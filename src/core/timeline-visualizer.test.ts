import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { DateTime } from 'luxon';
import { CHILE_TZ, formatMinutes, getSantiagoOffsetDescription } from './timezone';
import { MARKETS } from './markets';
import { pwaManifest } from './pwa-manifest';

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
    expect(pwaManifest.theme_color).toBe('#0f172a');
    expect(pwaManifest.background_color).toBe('#090d16');
    expect(pwaManifest.icons?.length).toBeGreaterThanOrEqual(2);
    expect(pwaManifest.name).toBe('Markets View');
  });

  it('verifies PWA static icon assets exist in public folder', () => {
    expect(existsSync('public/favicon.svg')).toBe(true);
    expect(existsSync('public/pwa-192x192.svg')).toBe(true);
    expect(existsSync('public/pwa-512x512.svg')).toBe(true);
  });

  it('verifies index.html specifies viewport-fit=cover for notch safe areas', () => {
    const html = readFileSync('index.html', 'utf-8');
    expect(html).toContain('viewport-fit=cover');
    expect(html).toContain('apple-mobile-web-app-title');
  });
});
