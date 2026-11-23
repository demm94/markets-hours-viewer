import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DateTime } from 'luxon';
import {
  CHILE_TZ,
  formatMinutes,
  getSantiagoOffsetDescription,
  projectMarketToTimeline
} from './timezone';
import { MARKETS } from './markets';
import { pwaManifest } from './pwa-manifest';
import { getMarketHoliday } from './holidays';
import { MarketEvaluation } from './types';

// Repository files are resolved from this module's own location, never from the process
// CWD, so the suite behaves identically no matter which directory the runner starts in.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const readRepoFile = (relativePath: string): string =>
  readFileSync(resolve(REPO_ROOT, relativePath), 'utf-8');

const repoFileExists = (relativePath: string): boolean =>
  existsSync(resolve(REPO_ROOT, relativePath));

/**
 * Reads a 6-digit hex custom property from the `:root` block of a stylesheet.
 * Comments are stripped first so a commented-out declaration can never win the match,
 * and the search is scoped to `:root` so a redeclaration elsewhere cannot change the
 * answer. Returns null when the structure is unrecognisable, so the caller fails loudly
 * instead of silently asserting against a wrong value.
 */
const readRootHexToken = (cssSource: string, token: string): string | null => {
  const withoutComments = cssSource.replace(/\/\*[\s\S]*?\*\//g, '');
  const rootBlock = /:root\s*\{([^}]*)\}/.exec(withoutComments);
  if (!rootBlock) return null;
  const declaration = new RegExp(
    `--${token}:\\s*(#[0-9a-fA-F]{6})(?![0-9a-fA-F])`
  ).exec(rootBlock[1]);
  return declaration ? declaration[1] : null;
};

describe('timeline-visualizer & pwa-shell compliance', () => {
  it('calculates scrubber percentage accurately across 0-1440 minutes', () => {
    const minToPct = (min: number) => (min / 1440) * 100;

    expect(minToPct(0)).toBe(0);
    expect(minToPct(720)).toBe(50);
    expect(minToPct(1440)).toBe(100);
  });

  it('formats Chilean reference times and identifies DST status', () => {
    const testDate = DateTime.fromISO('2026-09-15T14:30:00', { zone: CHILE_TZ });
    expect(formatMinutes(testDate.hour * 60 + testDate.minute)).toBe('14:30');

    const desc = getSantiagoOffsetDescription(testDate);
    expect(desc).toContain('UTC-3');
    expect(desc).toContain('Horario de Verano');
  });

  it('contains all 5 international markets plus Chile (BCS)', () => {
    const marketIds = MARKETS.map((m) => m.id);
    expect(marketIds).toContain('twse');
    expect(marketIds).toContain('krx');
    expect(marketIds).toContain('sse');
    expect(marketIds).toContain('nse');
    expect(marketIds).toContain('nyse');
    expect(marketIds).toContain('chile');

    const chileMarket = MARKETS.find((m) => m.id === 'chile');
    expect(chileMarket).toBeDefined();
    expect(chileMarket?.code).toBe('BCS');
    expect(chileMarket?.timezone).toBe('America/Santiago');
  });

  it('projects Chile (BCS) regular sessions, early closes, and full holidays onto timeline', () => {
    const chileMarket = MARKETS.find((m) => m.id === 'chile');
    expect(chileMarket).toBeDefined();

    // Regular weekday: 09:30–16:00 CL (570..960)
    const regularSegments = projectMarketToTimeline(
      chileMarket!,
      DateTime.fromISO('2026-09-15T12:00:00', { zone: CHILE_TZ })
    );
    expect(regularSegments).toHaveLength(1);
    expect(regularSegments[0]).toMatchObject({
      type: 'regular',
      startMinute: 570,
      endMinute: 960
    });

    // Early close: 2026-12-31 Víspera de Año Nuevo closes at 12:30 CL (570..750)
    const earlyCloseSegments = projectMarketToTimeline(
      chileMarket!,
      DateTime.fromISO('2026-12-31T10:00:00', { zone: CHILE_TZ })
    );
    expect(earlyCloseSegments).toHaveLength(1);
    expect(earlyCloseSegments[0].startMinute).toBe(570);
    expect(earlyCloseSegments[0].endMinute).toBe(750);
    expect(earlyCloseSegments[0].holiday?.isEarlyClose).toBe(true);

    // Full holiday: 2026-09-18 Fiestas Patrias
    const holidaySegments = projectMarketToTimeline(
      chileMarket!,
      DateTime.fromISO('2026-09-18T12:00:00', { zone: CHILE_TZ })
    );
    expect(holidaySegments.length).toBeGreaterThanOrEqual(1);
    expect(holidaySegments[0].holiday?.name).toBe('Fiestas Patrias');
    expect(holidaySegments[0].holiday?.isEarlyClose).toBeFalsy();
  });

  it('validates PWA web app manifest requirements without depending on dist build', () => {
    expect(pwaManifest.display).toBe('standalone');

    // The dark theme background has a single source of truth: the --background token in
    // the :root block of src/index.css. The manifest and the HTML meta must both agree with
    // it, so the invariant from openspec/specs/pwa-shell/spec.md is asserted without
    // hardcoding a palette hex that would rot on every re-skin.
    const backgroundToken = readRootHexToken(readRepoFile('src/index.css'), 'background');
    expect(
      backgroundToken,
      'src/index.css must declare a 6-digit hex --background token inside :root (theme source of truth)'
    ).not.toBeNull();

    const htmlSource = readRepoFile('index.html');
    const htmlThemeColor = /<meta\s+name="theme-color"\s+content="(#[0-9a-fA-F]{6})"/.exec(htmlSource);
    expect(
      htmlThemeColor,
      'index.html must declare a 6-digit hex theme-color meta content value'
    ).not.toBeNull();

    const themeBackground = backgroundToken!;

    expect(
      pwaManifest.theme_color,
      'pwaManifest.theme_color must match the --background token in src/index.css'
    ).toBe(themeBackground);
    expect(
      pwaManifest.background_color,
      'pwaManifest.background_color must match the --background token in src/index.css'
    ).toBe(themeBackground);
    expect(
      htmlThemeColor![1],
      'index.html theme-color meta must match the --background token in src/index.css'
    ).toBe(themeBackground);

    expect(pwaManifest.icons?.length).toBeGreaterThanOrEqual(2);
    expect(pwaManifest.name).toBe('Markets');
    expect(pwaManifest.short_name).toBe('Markets');
  });

  it('verifies PWA static icon assets exist in public folder', () => {
    expect(repoFileExists('public/favicon.svg')).toBe(true);
    expect(repoFileExists('public/pwa-192x192.svg')).toBe(true);
    expect(repoFileExists('public/pwa-512x512.svg')).toBe(true);
  });

  it('verifies index.html specifies viewport-fit=cover for notch safe areas', () => {
    const html = readRepoFile('index.html');
    expect(html).toContain('viewport-fit=cover');
    expect(html).toContain('apple-mobile-web-app-title');
  });

  it('evaluates Chilean holiday reference axis on public holidays', () => {
    // September 18, 2026: Fiestas Patrias in Chile
    const fiestasPatrias = DateTime.fromISO('2026-09-18T12:00:00', { zone: CHILE_TZ });
    const holiday = getMarketHoliday('chile', fiestasPatrias.toISODate()!);
    expect(holiday).toBeDefined();
    expect(holiday?.name).toBe('Fiestas Patrias');

    // Emulate chileScrubberEvaluation logic
    const scrubberMinutes = 720;
    const chileEvaluation: MarketEvaluation = {
      marketId: 'chile',
      status: 'closed',
      localTimeFormatted: formatMinutes(scrubberMinutes),
      localDateFormatted: fiestasPatrias.toFormat('ccc d MMM', { locale: 'es' }),
      ...(holiday ? { holiday, activeSegmentLabel: `Feriado: ${holiday.name}` } : {})
    };

    expect(chileEvaluation.marketId).toBe('chile');
    expect(chileEvaluation.holiday).toEqual(holiday);
    expect(chileEvaluation.activeSegmentLabel).toBe('Feriado: Fiestas Patrias');
    expect(chileEvaluation.localTimeFormatted).toBe('12:00');

    // Non-holiday day: September 15, 2026
    const regularDay = DateTime.fromISO('2026-09-15T12:00:00', { zone: CHILE_TZ });
    const noHoliday = getMarketHoliday('chile', regularDay.toISODate()!);
    expect(noHoliday).toBeUndefined();

    const normalChileEvaluation: MarketEvaluation = {
      marketId: 'chile',
      status: 'closed',
      localTimeFormatted: formatMinutes(scrubberMinutes),
      localDateFormatted: regularDay.toFormat('ccc d MMM', { locale: 'es' }),
      ...(noHoliday ? { holiday: noHoliday, activeSegmentLabel: `Feriado: ${noHoliday.name}` } : {})
    };

    expect(normalChileEvaluation.holiday).toBeUndefined();
    expect(normalChileEvaluation.activeSegmentLabel).toBeUndefined();
  });

  it('keeps simplified timeline layout without floating pills, slider scrubber, or foreign local clocks', () => {
    const timelineBars = readRepoFile('src/components/timeline/TimelineBars.tsx');
    expect(timelineBars).not.toContain('window.innerWidth');
    expect(timelineBars).not.toContain('renderCollapsedFloatingPills');
    expect(timelineBars).not.toContain('role="slider"');
    expect(timelineBars).not.toContain('min-w-[460px]');
    expect(timelineBars).not.toContain('min-w-[600px]');

    const timelineGrid = readRepoFile('src/components/TimelineGrid.tsx');
    expect(timelineGrid).not.toContain('window.innerWidth');

    const timelineLeftCol = readRepoFile('src/components/timeline/TimelineLeftColumn.tsx');
    expect(timelineLeftCol).not.toContain('Hora local');
    expect(timelineLeftCol).not.toContain('localTimeFormatted');

    const drawer = readRepoFile('src/components/EventsDrawer.tsx');
    expect(drawer).toContain('env(safe-area-inset-bottom)');

    const modal = readRepoFile('src/components/timeline/EventDetailModal.tsx');
    expect(modal).toContain('env(safe-area-inset-bottom)');
  });
});
