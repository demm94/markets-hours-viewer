/**
 * scripts/sync-events.js
 * Automated sync script for macroeconomic events and market holidays using Finnhub.io.
 * Run automatically by GitHub Actions on a schedule or triggered manually via workflow_dispatch.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inferCategory } from '../src/core/event-category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVENTS_FILE = path.resolve(__dirname, '../src/data/events.json');
const HOLIDAYS_FILE = path.resolve(__dirname, '../src/data/holidays.json');

// Retain up to 365 days of historical events/holidays to prevent unbounded bundle growth across years
const RETENTION_DAYS = 365;

const COUNTRY_TO_MARKET = {
  US: 'nyse',
  CN: 'sse',
  TW: 'twse',
  KR: 'krx',
  IN: 'nse',
  CL: 'chile'
};

const VALID_MARKET_IDS = new Set(Object.values(COUNTRY_TO_MARKET));
const VALID_CATEGORIES = new Set(['employment', 'inflation', 'central_bank', 'gdp', 'holidays']);
const VALID_IMPORTANCE = new Set(['high', 'medium']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidHolidayRecord(record) {
  if (!record || typeof record !== 'object') return false;
  if (!VALID_MARKET_IDS.has(record.marketId)) return false;
  if (typeof record.date !== 'string' || !ISO_DATE_RE.test(record.date)) return false;
  if (typeof record.name !== 'string' || record.name.trim().length === 0) return false;
  if (record.isEarlyClose !== undefined && typeof record.isEarlyClose !== 'boolean') return false;
  if (record.isEarlyClose && (typeof record.closeTime !== 'string' || !HH_MM_RE.test(record.closeTime))) {
    return false;
  }
  return true;
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

function parseUtcTimestamp(timeStr) {
  if (!timeStr) return new Date().toISOString();
  const clean = String(timeStr).trim();
  if (clean.endsWith('Z')) return new Date(clean).toISOString();
  // Finnhub format: "YYYY-MM-DD HH:mm:ss" in UTC
  const isoCandidate = clean.replace(' ', 'T') + 'Z';
  const d = new Date(isoCandidate);
  return isNaN(d.getTime()) ? new Date(clean).toISOString() : d.toISOString();
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30);
}

// Verified dates where exchanges remain open or do not observe compensatory closure
const NON_CLOSURE_EXCLUSIONS = new Set([
  'krx:2026-06-05',
  'nse:2026-08-14'
]);

async function syncHolidays(apiKey) {
  let existingHolidays = [];
  if (fs.existsSync(HOLIDAYS_FILE)) {
    try {
      existingHolidays = JSON.parse(fs.readFileSync(HOLIDAYS_FILE, 'utf-8'));
    } catch {
      existingHolidays = [];
    }
  }

  const holidayMap = new Map(
    existingHolidays
      .filter(isValidHolidayRecord)
      .map((h) => [`${h.marketId}:${h.date}`, h])
  );

  const exchanges = [
    { code: 'US', marketId: 'nyse' },
    { code: 'SS', marketId: 'sse' },
    { code: 'TW', marketId: 'twse' },
    { code: 'KS', marketId: 'krx' },
    { code: 'IN', marketId: 'nse' }
  ];

  console.log(`📡 Fetching official market holidays from Finnhub...`);

  for (const ex of exchanges) {
    try {
      const url = `https://finnhub.io/api/v1/stock/market-holiday?exchange=${ex.code}`;
      const res = await fetch(url, { headers: { 'X-Finnhub-Token': apiKey } });

      if (!res.ok) continue;
      const data = await res.json();
      const items = data.data || [];
      for (const item of items) {
        const key = `${ex.marketId}:${item.atDate}`;
        if (NON_CLOSURE_EXCLUSIONS.has(key)) continue;

        // Finnhub sets tradingHour="" for full closures, or e.g. "09:30-13:00" for early closes
        const tradingHour = String(item.tradingHour || '').trim();
        const isEarlyClose = tradingHour !== '' && tradingHour.includes('-');
        let closeTime;
        if (isEarlyClose) {
          const parts = tradingHour.split('-');
          closeTime = parts[1]?.trim();
        }

        // Preserve existing curated holiday names; only insert newly discovered future closures
        if (!holidayMap.has(key)) {
          const candidate = {
            marketId: ex.marketId,
            date: item.atDate,
            name: item.eventName || (isEarlyClose ? 'Cierre temprano' : 'Feriado bursátil'),
            ...(isEarlyClose && closeTime ? { isEarlyClose: true, closeTime } : {})
          };
          if (isValidHolidayRecord(candidate)) {
            holidayMap.set(key, candidate);
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️ Could not fetch holidays for exchange ${ex.code}:`, err.message);
    }
  }

  const cutoffDateStr = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const mergedHolidays = Array.from(holidayMap.values())
    .filter((h) => h.date >= cutoffDateStr && isValidHolidayRecord(h))
    .sort((a, b) => a.date.localeCompare(b.date) || a.marketId.localeCompare(b.marketId));

  fs.writeFileSync(HOLIDAYS_FILE, JSON.stringify(mergedHolidays, null, 2) + '\n', 'utf-8');
  console.log(`✅ Successfully updated ${HOLIDAYS_FILE} (${mergedHolidays.length} total holidays).`);
}

async function syncEvents(apiKey) {
  // Determine 4-month rolling window (yesterday to +120 days in UTC)
  const now = new Date();
  const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // yesterday
  const endDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000); // 120 days ahead (~4 months)

  const fromStr = startDate.toISOString().slice(0, 10);
  const toStr = endDate.toISOString().slice(0, 10);

  const url = `https://finnhub.io/api/v1/calendar/economic?from=${fromStr}&to=${toStr}`;

  console.log(`📡 Fetching economic calendar from Finnhub (${fromStr} to ${toStr})...`);

  const response = await fetch(url, { headers: { 'X-Finnhub-Token': apiKey } });
  if (!response.ok) {
    throw new Error(`Finnhub API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const economicEvents = data.economicCalendar || [];

  console.log(`📦 Received ${economicEvents.length} total events from Finnhub.`);

  // Filter for our markets and high/medium impact
  const relevantEvents = economicEvents.filter((item) => {
    const marketId = COUNTRY_TO_MARKET[item.country];
    if (!marketId) return false;
    const impact = (item.impact || '').toLowerCase();
    return impact === 'high' || impact === 'medium';
  });

  console.log(`🎯 Found ${relevantEvents.length} relevant high/medium impact events for configured markets.`);

  // Read existing events to preserve manual entries (like local Chile central bank meetings)
  let existingEvents = [];
  if (fs.existsSync(EVENTS_FILE)) {
    try {
      existingEvents = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
    } catch {
      existingEvents = [];
    }
  }

  const existingMap = new Map(
    existingEvents
      .filter(isValidEventRecord)
      .map((e) => [e.id, e])
  );

  // Normalize and merge
  for (const item of relevantEvents) {
    const marketId = COUNTRY_TO_MARKET[item.country];
    const timestampUtc = parseUtcTimestamp(item.time);
    const datePrefix = timestampUtc.slice(0, 10);
    const id = `${marketId}-${slugify(item.event)}-${datePrefix}`;

    const normalized = {
      id,
      marketId,
      title: item.event,
      description: item.description || `Indicador macroeconómico oficial de ${item.country}.`,
      category: inferCategory(item.event),
      importance: item.impact.toLowerCase() === 'high' ? 'high' : 'medium',
      timestampUtc,
      forecast: item.estimate != null ? String(item.estimate) : undefined,
      previous: item.prev != null ? String(item.prev) : undefined
    };

    const mergedCandidate = { ...existingMap.get(id), ...normalized };
    if (isValidEventRecord(mergedCandidate)) {
      existingMap.set(id, mergedCandidate);
    }
  }

  const cutoffTimestampMs = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  const merged = Array.from(existingMap.values())
    .filter((e) => isValidEventRecord(e) && Date.parse(e.timestampUtc) >= cutoffTimestampMs)
    .sort((a, b) => a.timestampUtc.localeCompare(b.timestampUtc));

  fs.writeFileSync(EVENTS_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`✅ Successfully updated ${EVENTS_FILE} (${merged.length} total events).`);
}

async function main() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  FINNHUB_API_KEY not found in environment variables.');
    console.warn('ℹ️  Add FINNHUB_API_KEY to your GitHub Repository Secrets to enable automatic updates.');
    console.warn('ℹ️  Preserving existing data files without modification.');
    return;
  }

  // 1. Sync official exchange holidays (standard stock API endpoint)
  try {
    await syncHolidays(apiKey);
  } catch (err) {
    console.error('❌ Failed syncing market holidays:', err.message);
  }

  // 2. Sync macroeconomic calendar events (graceful fallback if endpoint requires premium access)
  try {
    await syncEvents(apiKey);
  } catch (err) {
    console.warn('⚠️  Could not fetch economic calendar from Finnhub:', err.message);
    console.warn('ℹ️  Note: /calendar/economic may require a Finnhub plan with economic calendar access.');
    console.warn('ℹ️  Preserving existing curated events in events.json.');
  }
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  main().catch((err) => {
    console.error('❌ Pipeline run failed:', err);
    process.exit(1);
  });
}
