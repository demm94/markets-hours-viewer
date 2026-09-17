import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DateTime } from 'luxon';
import { CHILE_TZ, formatMinutes, getSantiagoOffsetDescription } from './timezone';
import { MARKETS } from './markets';
import { pwaManifest } from './pwa-manifest';

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

  it('contains all 5 specified international markets plus Chile reference', () => {
    const marketIds = MARKETS.map((m) => m.id);
    expect(marketIds).toContain('twse');
    expect(marketIds).toContain('krx');
    expect(marketIds).toContain('sse');
    expect(marketIds).toContain('nse');
    expect(marketIds).toContain('nyse');
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
    expect(pwaManifest.name).toBe('Markets View');
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
});
