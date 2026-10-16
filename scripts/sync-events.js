/**
 * scripts/sync-events.js
 * Automated sync script for macroeconomic events and market holidays using Finnhub.io.
 * Run automatically by GitHub Actions on a schedule or triggered manually via workflow_dispatch.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVENTS_FILE = path.resolve(__dirname, '../src/data/events.json');
const HOLIDAYS_FILE = path.resolve(__dirname, '../src/data/holidays.json');

const COUNTRY_TO_MARKET = {
  US: 'nyse',
  CN: 'sse',
  TW: 'twse',
  KR: 'krx',
  IN: 'nse',
  CL: 'chile'
};

function inferCategory(eventTitle) {
  const text = (eventTitle || '').toLowerCase();

  // 1. Employment (unemployment, nonfarm payrolls, jobless claims)
  if (
    /\b(unemployment|payroll|payrolls|jobless|employment|desempleo|empleo|labor force|labor market|non-?farm|adp|jolts)\b/.test(
      text
    )
  ) {
    return 'employment';
  }

  // 2. Inflation (cpi, ppi, pce, inflation, price index, ipc, deflator)
  if (
    /\b(cpi|ipc|inflation|inflaci[oó]n|price index|\bppi\b|\bpce\b|deflator|cost of living)\b/.test(
      text
    )
  ) {
    return 'inflation';
  }

  // 3. Central Bank (rates, FOMC, Fed meetings, monetary policy, repo rate)
  if (
    /\b(interest rate|policy rate|loan prime rate|fomc|federal reserve|\bfed\b|\bpboc\b|central bank|banco central|monetary policy|pol[ií]tica monetaria|\brpm\b|\blpr\b|repo rate|tasa de inter[eé]s|discount rate|target rate|rate decision|decisi[oó]n de tasa|decisi[oó]n tasa)\b/.test(
      text
    )
  ) {
    return 'central_bank';
  }

  // 4. Growth, Output & Trade (GDP, PIB, PMI, Retail, Industrial Production, Trade Balance)
  if (
    /\b(gdp|pib|growth|trade balance|balanza comercial|industrial production|producci[oó]n industrial|retail sales|ventas minoristas|pmi|ism|manufacturing|servicios|current account)\b/.test(
      text
    )
  ) {
    return 'gdp';
  }

  // 5. Holidays
  if (/\b(holiday|feriado|closure|festivo)\b/.test(text)) {
    return 'holidays';
  }

  return 'gdp';
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

  const holidayMap = new Map(existingHolidays.map((h) => [`${h.marketId}:${h.date}`, h]));

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
      const url = `https://finnhub.io/api/v1/stock/market-holiday?exchange=${ex.code}&token=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const items = data.data || [];
      for (const item of items) {
        if (!item.atDate) continue;
        // Skip partial-day / early-close sessions (Finnhub sets tradingHour="" for full closures)
        if (item.tradingHour && String(item.tradingHour).trim() !== '') continue;

        const key = `${ex.marketId}:${item.atDate}`;
        if (NON_CLOSURE_EXCLUSIONS.has(key)) continue;

        // Preserve existing curated holiday names; only insert newly discovered future closures
        if (!holidayMap.has(key)) {
          holidayMap.set(key, {
            marketId: ex.marketId,
            date: item.atDate,
            name: item.eventName || 'Feriado bursátil'
          });
        }
      }
    } catch (err) {
      console.warn(`⚠️ Could not fetch holidays for exchange ${ex.code}:`, err.message);
    }
  }

  const mergedHolidays = Array.from(holidayMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date) || a.marketId.localeCompare(b.marketId)
  );

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

  const url = `https://finnhub.io/api/v1/calendar/economic?from=${fromStr}&to=${toStr}&token=${apiKey}`;

  console.log(`📡 Fetching economic calendar from Finnhub (${fromStr} to ${toStr})...`);

  const response = await fetch(url);
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

  const existingMap = new Map(existingEvents.map((e) => [e.id, e]));

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

    existingMap.set(id, { ...existingMap.get(id), ...normalized });
  }

  const merged = Array.from(existingMap.values()).sort((a, b) =>
    a.timestampUtc.localeCompare(b.timestampUtc)
  );

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

main().catch((err) => {
  console.error('❌ Pipeline run failed:', err);
  process.exit(1);
});
