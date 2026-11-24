/**
 * scripts/sync-events.js
 * Builds and updates src/data/events.json from:
 *   1. Authoritative verified macro schedule seed (scripts/macro-schedule-seed.json)
 *   2. Rule-based PBoC LPR releases (20th of month shifted to next non-holiday SSE business day)
 *   3. Optional official US release dates from FRED API (when FRED_API_KEY is set)
 *   4. Optional current-week forecasts/high-impact events from FairEconomy weekly JSON feed
 *
 * Enforces weekday-only (in exchange local timezone) and zero full-holiday collision guards.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DateTime } from 'luxon';
import { inferCategory } from '../src/core/event-category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const EVENTS_FILE = path.join(ROOT_DIR, 'src/data/events.json');
const HOLIDAYS_FILE = path.join(ROOT_DIR, 'src/data/holidays.json');
const META_FILE = path.join(ROOT_DIR, 'src/data/calendar-meta.json');
const SEED_FILE = path.join(ROOT_DIR, 'scripts/macro-schedule-seed.json');

const RETENTION_DAYS = 365;

const MARKET_TIMEZONES = {
  nyse: 'America/New_York',
  sse: 'Asia/Shanghai',
  twse: 'Asia/Taipei',
  krx: 'Asia/Seoul',
  nse: 'Asia/Kolkata',
  chile: 'America/Santiago'
};

const VALID_MARKET_IDS = new Set(Object.keys(MARKET_TIMEZONES));
const VALID_CATEGORIES = new Set(['employment', 'inflation', 'central_bank', 'gdp', 'holidays']);
const VALID_IMPORTANCE = new Set(['high', 'medium']);

const FF_CURRENCY_TO_MARKET = {
  USD: 'nyse',
  CNY: 'sse',
  INR: 'nse',
  KRW: 'krx',
  TWD: 'twse'
};

const FRED_RELEASE_CONFIG = [
  {
    releaseId: 10,
    title: 'IPC de EE.UU. (Inflación)',
    description: 'Índice de Precios al Consumidor mensual (BLS).',
    category: 'inflation',
    importance: 'high',
    hourEt: 8,
    minuteEt: 30,
    slug: 'us-cpi'
  },
  {
    releaseId: 50,
    title: 'Nóminas No Agrícolas (NFP) y Tasa de Desempleo EE.UU.',
    description: 'Reporte mensual oficial de empleo del Bureau of Labor Statistics.',
    category: 'employment',
    importance: 'high',
    hourEt: 8,
    minuteEt: 30,
    slug: 'us-nfp'
  },
  {
    releaseId: 54,
    title: 'Inflación PCE y Gasto Personal EE.UU.',
    description: 'Deflactor de consumo personal (BEA) seguido por la Reserva Federal.',
    category: 'inflation',
    importance: 'high',
    hourEt: 8,
    minuteEt: 30,
    slug: 'us-pce'
  },
  {
    releaseId: 53,
    title: 'PIB Trimestral EE.UU.',
    description: 'Producto Interno Bruto anualizado de EE.UU. (BEA).',
    category: 'gdp',
    importance: 'high',
    hourEt: 8,
    minuteEt: 30,
    slug: 'us-gdp'
  }
];

function readJsonSafe(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

export function isValidEventRecord(record) {
  if (!record || typeof record !== 'object') return false;
  if (typeof record.id !== 'string' || record.id.trim().length === 0) return false;
  if (!VALID_MARKET_IDS.has(record.marketId)) return false;
  if (typeof record.title !== 'string' || record.title.trim().length === 0) return false;
  if (!VALID_CATEGORIES.has(record.category)) return false;
  if (!VALID_IMPORTANCE.has(record.importance)) return false;
  if (typeof record.timestampUtc !== 'string' || isNaN(Date.parse(record.timestampUtc))) return false;
  return true;
}

function buildFullHolidaySet(holidays) {
  const fullHolidays = new Set();
  for (const h of holidays) {
    if (h && h.marketId && h.date && !h.isEarlyClose) {
      fullHolidays.add(`${h.marketId}:${h.date}`);
    }
  }
  return fullHolidays;
}

function isExchangeBusinessDay(marketId, localDateTime, fullHolidaySet) {
  if (!localDateTime.isValid) return false;
  if (localDateTime.weekday >= 6) return false;
  const isoDate = localDateTime.toFormat('yyyy-MM-dd');
  return !fullHolidaySet.has(`${marketId}:${isoDate}`);
}

function isValidEventOnCalendar(record, fullHolidaySet) {
  if (!isValidEventRecord(record)) return false;
  const tz = MARKET_TIMEZONES[record.marketId];
  const localDt = DateTime.fromISO(record.timestampUtc, { zone: 'utc' }).setZone(tz);
  return isExchangeBusinessDay(record.marketId, localDt, fullHolidaySet);
}

/**
 * Generates monthly PBoC Loan Prime Rate (LPR) schedule from Dec 2026 through Dec 2027.
 * PBoC announces LPR on the 20th of each month at 09:15 Asia/Shanghai, postponed to
 * the next business day if the 20th falls on a weekend or SSE holiday.
 */
function generatePbocLprEvents(fullHolidaySet) {
  const generated = [];
  const months = [{ year: 2026, month: 12 }];
  for (let m = 1; m <= 12; m++) {
    months.push({ year: 2027, month: m });
  }

  for (const { year, month } of months) {
    let candidate = DateTime.fromObject(
      { year, month, day: 20, hour: 9, minute: 15, second: 0 },
      { zone: 'Asia/Shanghai' }
    );
    while (!isExchangeBusinessDay('sse', candidate, fullHolidaySet)) {
      candidate = candidate.plus({ days: 1 });
    }
    const monthTag = candidate.setLocale('en').toFormat('LLL').toLowerCase();
    const id = `cn-pboc-lpr-${monthTag}-${candidate.year}`;
    generated.push({
      id,
      marketId: 'sse',
      title: 'Decisión Tasa LPR Banco Popular de China (PBoC)',
      description: 'Fijación mensual de las tasas preferenciales de préstamos a 1 y 5 años (09:15 CST).',
      category: 'central_bank',
      importance: 'high',
      timestampUtc: candidate.toUTC().toISO({ suppressMilliseconds: true })
    });
  }

  return generated;
}

async function fetchFredUsReleases(apiKey, now, fullHolidaySet) {
  if (!apiKey) return [];

  const fromStr = now.minus({ days: 7 }).toFormat('yyyy-MM-dd');
  const toStr = now.plus({ days: 180 }).toFormat('yyyy-MM-dd');
  const discovered = [];

  for (const cfg of FRED_RELEASE_CONFIG) {
    const url =
      `https://api.stlouisfed.org/fred/release/dates` +
      `?release_id=${cfg.releaseId}&realtime_start=${fromStr}&realtime_end=${toStr}` +
      `&include_release_dates_with_no_data=true&api_key=${encodeURIComponent(apiKey)}&file_type=json`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) {
        console.warn(`⚠️ FRED release ${cfg.releaseId} returned HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const rows = Array.isArray(data?.release_dates) ? data.release_dates : [];
      for (const row of rows) {
        const dateStr = String(row?.date || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
        const dtEt = DateTime.fromISO(`${dateStr}T${String(cfg.hourEt).padStart(2, '0')}:${String(cfg.minuteEt).padStart(2, '0')}:00`, {
          zone: 'America/New_York'
        });
        if (!isExchangeBusinessDay('nyse', dtEt, fullHolidaySet)) continue;
        const monthTag = dtEt.setLocale('en').toFormat('LLL').toLowerCase();
        discovered.push({
          id: `${cfg.slug}-${monthTag}-${dtEt.year}-fred`,
          marketId: 'nyse',
          title: cfg.title,
          description: cfg.description,
          category: cfg.category,
          importance: cfg.importance,
          timestampUtc: dtEt.toUTC().toISO({ suppressMilliseconds: true })
        });
      }
    } catch (err) {
      console.warn(`⚠️ FRED release ${cfg.releaseId} fetch skipped: ${err.message}`);
    }
  }

  return discovered;
}

function normalizeTitleTokens(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 28);
}

async function fetchFairEconomyWeekly(fullHolidaySet) {
  const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'markets-pwa-sync/1.0'
      },
      signal: AbortSignal.timeout(6000)
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      console.warn(`ℹ️ FairEconomy feed unavailable or non-JSON (status ${res.status}); skipping weekly enrichment.`);
      return [];
    }

    const payload = await res.json();
    if (!Array.isArray(payload)) return [];

    const enriched = [];
    for (const item of payload) {
      const marketId = FF_CURRENCY_TO_MARKET[String(item?.country || '').toUpperCase()];
      if (!marketId) continue;

      const rawImpact = String(item?.impact || '').toLowerCase();
      if (rawImpact !== 'high' && rawImpact !== 'medium') continue;

      const dtUtc = DateTime.fromISO(String(item?.date || ''), { setZone: true }).toUTC();
      if (!dtUtc.isValid) continue;

      const localDt = dtUtc.setZone(MARKET_TIMEZONES[marketId]);
      if (!isExchangeBusinessDay(marketId, localDt, fullHolidaySet)) continue;

      const title = String(item?.title || '').trim();
      if (!title) continue;

      const forecast = item?.forecast ? String(item.forecast).trim() : undefined;
      const previous = item?.previous ? String(item.previous).trim() : undefined;

      enriched.push({
        id: `${marketId}-${slugify(title)}-${localDt.toFormat('yyyy-MM-dd')}`,
        marketId,
        title,
        description: `Indicador macroeconómico (${String(item.country).toUpperCase()}).`,
        category: inferCategory(title),
        importance: rawImpact === 'high' ? 'high' : 'medium',
        timestampUtc: dtUtc.toISO({ suppressMilliseconds: true }),
        ...(forecast ? { forecast } : {}),
        ...(previous ? { previous } : {})
      });
    }

    return enriched;
  } catch (err) {
    console.warn(`ℹ️ FairEconomy weekly enrichment skipped: ${err.message}`);
    return [];
  }
}

function findMatchingSeedEvent(candidate, eventsMap) {
  const candTz = MARKET_TIMEZONES[candidate.marketId];
  const candDate = DateTime.fromISO(candidate.timestampUtc, { zone: 'utc' })
    .setZone(candTz)
    .toFormat('yyyy-MM-dd');
  const candTokens = new Set(normalizeTitleTokens(candidate.title));

  for (const existing of eventsMap.values()) {
    if (existing.marketId !== candidate.marketId) continue;
    if (existing.category !== candidate.category) continue;
    const exDate = DateTime.fromISO(existing.timestampUtc, { zone: 'utc' })
      .setZone(candTz)
      .toFormat('yyyy-MM-dd');
    if (exDate !== candDate) continue;

    // Match if same category+date+market and either shares key indicator token or is central_bank/employment/inflation
    const exTokens = normalizeTitleTokens(existing.title);
    const hasOverlap = exTokens.some((t) => t.length >= 3 && candTokens.has(t));
    if (hasOverlap || ['inflation', 'employment', 'central_bank'].includes(candidate.category)) {
      return existing;
    }
  }
  return undefined;
}

export async function syncEvents({ referenceNow = DateTime.now().setZone('utc') } = {}) {
  const holidays = readJsonSafe(HOLIDAYS_FILE, []);
  const fullHolidaySet = buildFullHolidaySet(holidays);
  const seedEvents = readJsonSafe(SEED_FILE, []);

  const eventsMap = new Map();

  // 1. Authoritative verified baseline seed
  for (const evt of seedEvents) {
    if (isValidEventOnCalendar(evt, fullHolidaySet)) {
      eventsMap.set(evt.id, evt);
    } else {
      console.warn(`⚠️ Skipping invalid/holiday-colliding seed event: ${evt?.id}`);
    }
  }

  // 2. Rule-based PBoC LPR releases
  for (const lprEvt of generatePbocLprEvents(fullHolidaySet)) {
    if (isValidEventOnCalendar(lprEvt, fullHolidaySet) && !eventsMap.has(lprEvt.id)) {
      eventsMap.set(lprEvt.id, lprEvt);
    }
  }

  // 3. Optional FRED official US release dates (if FRED_API_KEY configured)
  const fredKey = process.env.FRED_API_KEY;
  if (fredKey) {
    const fredEvents = await fetchFredUsReleases(fredKey, referenceNow, fullHolidaySet);
    for (const fe of fredEvents) {
      const existing = findMatchingSeedEvent(fe, eventsMap);
      if (!existing && isValidEventOnCalendar(fe, fullHolidaySet)) {
        eventsMap.set(fe.id, fe);
      }
    }
  }

  // 4. Optional weekly FairEconomy forecast enrichment (fail-soft)
  const weeklyEvents = await fetchFairEconomyWeekly(fullHolidaySet);
  for (const we of weeklyEvents) {
    const existing = findMatchingSeedEvent(we, eventsMap);
    if (existing) {
      eventsMap.set(existing.id, {
        ...existing,
        ...(we.forecast ? { forecast: we.forecast } : {}),
        ...(we.previous ? { previous: we.previous } : {})
      });
    } else if (we.importance === 'high' && isValidEventOnCalendar(we, fullHolidaySet)) {
      eventsMap.set(we.id, we);
    }
  }

  // 5. Retain up to 365 days back and sort deterministically
  const cutoffMs = referenceNow.toMillis() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const finalEvents = Array.from(eventsMap.values())
    .filter((evt) => isValidEventOnCalendar(evt, fullHolidaySet) && Date.parse(evt.timestampUtc) >= cutoffMs)
    .sort((a, b) => a.timestampUtc.localeCompare(b.timestampUtc) || a.id.localeCompare(b.id));

  fs.writeFileSync(EVENTS_FILE, JSON.stringify(finalEvents, null, 2) + '\n', 'utf-8');

  // Update events metadata in calendar-meta.json
  const byMarket = {};
  for (const marketId of VALID_MARKET_IDS) {
    byMarket[marketId] = { count: 0, minDate: null, maxDate: null };
  }
  for (const evt of finalEvents) {
    const localDate = DateTime.fromISO(evt.timestampUtc, { zone: 'utc' })
      .setZone(MARKET_TIMEZONES[evt.marketId])
      .toFormat('yyyy-MM-dd');
    const bucket = byMarket[evt.marketId];
    bucket.count += 1;
    if (!bucket.minDate || localDate < bucket.minDate) bucket.minDate = localDate;
    if (!bucket.maxDate || localDate > bucket.maxDate) bucket.maxDate = localDate;
  }

  const existingMeta = readJsonSafe(META_FILE, {});
  const nextMeta = {
    ...(existingMeta && typeof existingMeta === 'object' ? existingMeta : {}),
    events: {
      generatedAtUtc: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      source: fredKey
        ? 'verified-seed+pboc-rule+fred+faireconomy'
        : 'verified-seed+pboc-rule+faireconomy',
      totalCount: finalEvents.length,
      byMarket
    }
  };
  fs.writeFileSync(META_FILE, JSON.stringify(nextMeta, null, 2) + '\n', 'utf-8');

  console.log(`✅ Successfully synced ${finalEvents.length} macro events to src/data/events.json`);
  for (const [mId, info] of Object.entries(byMarket)) {
    console.log(`  - ${mId.padEnd(5)}: ${String(info.count).padStart(2)} events [${info.minDate} .. ${info.maxDate}]`);
  }

  return finalEvents;
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  syncEvents().catch((err) => {
    console.error('❌ Event sync failed:', err);
    process.exit(1);
  });
}
