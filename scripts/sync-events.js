/**
 * scripts/sync-events.js
 * Automated sync script for macroeconomic events using Finnhub.io.
 * Run automatically by GitHub Actions on a schedule or triggered manually via workflow_dispatch.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVENTS_FILE = path.resolve(__dirname, '../src/data/events.json');

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

async function syncEvents() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  FINNHUB_API_KEY not found in environment variables.');
    console.warn('ℹ️  Add FINNHUB_API_KEY to your GitHub Repository Secrets to enable automatic updates.');
    console.warn('ℹ️  Preserving existing src/data/events.json without modification.');
    return;
  }

  // Determine current month range in UTC
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed

  const startOfMonth = new Date(Date.UTC(year, month, 1));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

  const fromStr = startOfMonth.toISOString().slice(0, 10);
  const toStr = endOfMonth.toISOString().slice(0, 10);

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
}

syncEvents().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
