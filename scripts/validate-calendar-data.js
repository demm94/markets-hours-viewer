/**
 * scripts/validate-calendar-data.js
 * Strict validation gate for src/data/holidays.json, src/data/events.json, and src/data/calendar-meta.json.
 * Exits with code 1 on any schema error, weekend entry, holiday/event collision,
 * misleading early-close label, or insufficient per-market forward coverage.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DateTime } from 'luxon';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const HOLIDAYS_FILE = path.join(ROOT_DIR, 'src/data/holidays.json');
const EVENTS_FILE = path.join(ROOT_DIR, 'src/data/events.json');
const META_FILE = path.join(ROOT_DIR, 'src/data/calendar-meta.json');

const MARKET_TIMEZONES = {
  nyse: 'America/New_York',
  sse: 'Asia/Shanghai',
  twse: 'Asia/Taipei',
  krx: 'Asia/Seoul',
  nse: 'Asia/Kolkata',
  chile: 'America/Santiago'
};

const VALID_MARKET_IDS = Object.keys(MARKET_TIMEZONES);
const VALID_CATEGORIES = new Set(['employment', 'inflation', 'central_bank', 'gdp', 'holidays']);
const VALID_IMPORTANCE = new Set(['high', 'medium']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const FORBIDDEN_EARLY_CLOSE_NAMES = new Set(['Thanksgiving Day', 'Christmas']);

const MIN_HOLIDAY_COVERAGE_DAYS = 120;
const MIN_EVENT_COVERAGE_DAYS = 60;

function parseArgs() {
  let refDate = DateTime.now().setZone('America/Santiago').startOf('day');
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--ref-date=')) {
      const candidate = DateTime.fromISO(arg.slice('--ref-date='.length), {
        zone: 'America/Santiago'
      }).startOf('day');
      if (candidate.isValid) {
        refDate = candidate;
      }
    }
  }
  return { refDate };
}

function readJson(filePath, errors, label) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing required file: ${label}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    errors.push(`Invalid JSON in ${label}: ${err.message}`);
    return null;
  }
}

function main() {
  const { refDate } = parseArgs();
  const errors = [];

  const holidays = readJson(HOLIDAYS_FILE, errors, 'src/data/holidays.json');
  const events = readJson(EVENTS_FILE, errors, 'src/data/events.json');
  const meta = readJson(META_FILE, errors, 'src/data/calendar-meta.json');

  if (!Array.isArray(holidays)) errors.push('src/data/holidays.json must be an array');
  if (!Array.isArray(events)) errors.push('src/data/events.json must be an array');
  if (!meta || typeof meta !== 'object' || !meta.holidays || !meta.events) {
    errors.push('src/data/calendar-meta.json must contain both "holidays" and "events" metadata');
  }

  if (errors.length > 0) {
    for (const err of errors) console.error(`❌ ${err}`);
    process.exit(1);
  }

  // 1. Validate holidays
  const holidayKeys = new Set();
  const fullHolidayKeys = new Set();
  const holidayMaxByMarket = Object.fromEntries(VALID_MARKET_IDS.map((m) => [m, null]));
  const holidayCountByMarket = Object.fromEntries(VALID_MARKET_IDS.map((m) => [m, 0]));

  for (let i = 0; i < holidays.length; i++) {
    const h = holidays[i];
    const prefix = `holidays[${i}]`;

    if (!h || typeof h !== 'object') {
      errors.push(`${prefix}: record must be an object`);
      continue;
    }
    if (!MARKET_TIMEZONES[h.marketId]) {
      errors.push(`${prefix}: invalid marketId "${h.marketId}"`);
      continue;
    }
    if (typeof h.date !== 'string' || !ISO_DATE_RE.test(h.date)) {
      errors.push(`${prefix}: invalid date "${h.date}"`);
      continue;
    }
    const dt = DateTime.fromISO(h.date, { zone: MARKET_TIMEZONES[h.marketId] });
    if (!dt.isValid) {
      errors.push(`${prefix}: unparseable date "${h.date}"`);
      continue;
    }
    if (dt.weekday >= 6) {
      errors.push(`${prefix}: weekend holiday not allowed (${h.marketId} ${h.date})`);
    }
    if (typeof h.name !== 'string' || h.name.trim().length === 0) {
      errors.push(`${prefix}: missing holiday name (${h.marketId} ${h.date})`);
    }
    if (h.isEarlyClose !== undefined && typeof h.isEarlyClose !== 'boolean') {
      errors.push(`${prefix}: isEarlyClose must be boolean if provided`);
    }
    if (h.isEarlyClose) {
      if (typeof h.closeTime !== 'string' || !HH_MM_RE.test(h.closeTime)) {
        errors.push(`${prefix}: early close missing valid HH:MM closeTime (${h.marketId} ${h.date})`);
      }
      if (h.marketId === 'nyse' && FORBIDDEN_EARLY_CLOSE_NAMES.has(h.name)) {
        errors.push(`${prefix}: misleading early-close name "${h.name}" on ${h.date}`);
      }
    }

    const key = `${h.marketId}:${h.date}`;
    if (holidayKeys.has(key)) {
      errors.push(`${prefix}: duplicate holiday key ${key}`);
    }
    holidayKeys.add(key);
    if (!h.isEarlyClose) {
      fullHolidayKeys.add(key);
    }

    if (i > 0) {
      const prev = holidays[i - 1];
      if (prev.date > h.date || (prev.date === h.date && prev.marketId > h.marketId)) {
        errors.push(`${prefix}: holidays.json is not sorted by (date, marketId) near ${h.date} ${h.marketId}`);
      }
    }

    holidayCountByMarket[h.marketId] += 1;
    if (!holidayMaxByMarket[h.marketId] || h.date > holidayMaxByMarket[h.marketId]) {
      holidayMaxByMarket[h.marketId] = h.date;
    }
  }

  // 2. Validate events
  const eventIds = new Set();
  const eventMaxByMarket = Object.fromEntries(VALID_MARKET_IDS.map((m) => [m, null]));
  const eventCountByMarket = Object.fromEntries(VALID_MARKET_IDS.map((m) => [m, 0]));

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const prefix = `events[${i}]`;

    if (!e || typeof e !== 'object') {
      errors.push(`${prefix}: record must be an object`);
      continue;
    }
    if (typeof e.id !== 'string' || e.id.trim().length === 0) {
      errors.push(`${prefix}: missing id`);
      continue;
    }
    if (eventIds.has(e.id)) {
      errors.push(`${prefix}: duplicate event id "${e.id}"`);
    }
    eventIds.add(e.id);

    if (!MARKET_TIMEZONES[e.marketId]) {
      errors.push(`${prefix} (${e.id}): invalid marketId "${e.marketId}"`);
      continue;
    }
    if (typeof e.title !== 'string' || e.title.trim().length === 0) {
      errors.push(`${prefix} (${e.id}): missing title`);
    }
    if (!VALID_CATEGORIES.has(e.category)) {
      errors.push(`${prefix} (${e.id}): invalid category "${e.category}"`);
    }
    if (!VALID_IMPORTANCE.has(e.importance)) {
      errors.push(`${prefix} (${e.id}): invalid importance "${e.importance}"`);
    }
    if (typeof e.timestampUtc !== 'string') {
      errors.push(`${prefix} (${e.id}): timestampUtc must be string`);
      continue;
    }

    const dtUtc = DateTime.fromISO(e.timestampUtc, { zone: 'utc' });
    if (!dtUtc.isValid) {
      errors.push(`${prefix} (${e.id}): invalid timestampUtc "${e.timestampUtc}"`);
      continue;
    }

    if (i > 0 && events[i - 1].timestampUtc > e.timestampUtc) {
      errors.push(`${prefix} (${e.id}): events.json is not sorted chronologically`);
    }

    const localDt = dtUtc.setZone(MARKET_TIMEZONES[e.marketId]);
    const localDateStr = localDt.toFormat('yyyy-MM-dd');

    if (localDt.weekday >= 6) {
      errors.push(`${prefix} (${e.id}): event falls on weekend in ${MARKET_TIMEZONES[e.marketId]} (${localDateStr})`);
    }
    if (fullHolidayKeys.has(`${e.marketId}:${localDateStr}`)) {
      errors.push(`${prefix} (${e.id}): event collides with full holiday (${e.marketId}:${localDateStr})`);
    }

    eventCountByMarket[e.marketId] += 1;
    if (!eventMaxByMarket[e.marketId] || localDateStr > eventMaxByMarket[e.marketId]) {
      eventMaxByMarket[e.marketId] = localDateStr;
    }
  }

  // 3. Per-market minimum forward coverage check
  const minHolidayHorizon = refDate.plus({ days: MIN_HOLIDAY_COVERAGE_DAYS }).toFormat('yyyy-MM-dd');
  const minEventHorizon = refDate.plus({ days: MIN_EVENT_COVERAGE_DAYS }).toFormat('yyyy-MM-dd');

  for (const marketId of VALID_MARKET_IDS) {
    const hMax = holidayMaxByMarket[marketId];
    const eMax = eventMaxByMarket[marketId];

    if (!hMax || hMax < minHolidayHorizon) {
      errors.push(
        `Insufficient holiday coverage for ${marketId}: max=${hMax ?? 'none'} < required ${minHolidayHorizon} (+${MIN_HOLIDAY_COVERAGE_DAYS}d)`
      );
    }
    if (!eMax || eMax < minEventHorizon) {
      errors.push(
        `Insufficient event coverage for ${marketId}: max=${eMax ?? 'none'} < required ${minEventHorizon} (+${MIN_EVENT_COVERAGE_DAYS}d)`
      );
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ Calendar data validation failed with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`  • ${err}`);
    }
    process.exit(1);
  }

  console.log(
    `✅ Calendar datasets validated cleanly (ref=${refDate.toFormat('yyyy-MM-dd')}, ` +
      `${holidays.length} holidays, ${events.length} events)`
  );
  console.log('Market | Holidays (maxDate)       | Events (maxDate)');
  console.log('-------+--------------------------+------------------------');
  for (const marketId of VALID_MARKET_IDS) {
    const hCol = `${String(holidayCountByMarket[marketId]).padStart(2)} (${holidayMaxByMarket[marketId]})`;
    const eCol = `${String(eventCountByMarket[marketId]).padStart(2)} (${eventMaxByMarket[marketId]})`;
    console.log(`${marketId.padEnd(6)} | ${hCol.padEnd(24)} | ${eCol}`);
  }
}

main();
