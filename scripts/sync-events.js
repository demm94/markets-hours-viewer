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
  const lower = eventTitle.toLowerCase();
  if (lower.includes('rate') || lower.includes('fed') || lower.includes('fomc') || lower.includes('central bank') || lower.includes('tasa') || lower.includes('policy')) {
    return 'central_bank';
  }
  if (lower.includes('cpi') || lower.includes('inflation') || lower.includes('ipc') || lower.includes('price index') || lower.includes('ppi')) {
    return 'inflation';
  }
  if (lower.includes('gdp') || lower.includes('pib') || lower.includes('growth') || lower.includes('trade balance') || lower.includes('industrial') || lower.includes('retail')) {
    return 'gdp';
  }
  if (lower.includes('pmi') || lower.includes('employment') || lower.includes('payroll') || lower.includes('jobless') || lower.includes('desempleo')) {
    return 'employment';
  }
  if (lower.includes('holiday') || lower.includes('feriado')) {
    return 'holidays';
  }
  return 'gdp';
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30);
}

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
        const key = `${ex.marketId}:${item.atDate}`;
        holidayMap.set(key, {
          marketId: ex.marketId,
          date: item.atDate,
          name: item.eventName || 'Feriado bursátil'
        });
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

async function syncEvents() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  FINNHUB_API_KEY not found in environment variables.');
    console.warn('ℹ️  Add FINNHUB_API_KEY to your GitHub Repository Secrets to enable automatic updates.');
    console.warn('ℹ️  Preserving existing data files without modification.');
    return;
  }

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
    const timestampUtc = new Date(item.time).toISOString();
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

  // Sync market holidays
  await syncHolidays(apiKey);
}

syncEvents().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
