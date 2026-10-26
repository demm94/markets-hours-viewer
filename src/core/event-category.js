/**
 * Accurately infers the macroeconomic category for an event title using word boundaries and domain precedence.
 * Shared between runtime core (`src/core/events.ts`) and data ingestion pipeline (`scripts/sync-events.js`).
 *
 * @param {string} eventTitle
 * @returns {'employment' | 'inflation' | 'central_bank' | 'gdp' | 'holidays'}
 */
export function inferCategory(eventTitle) {
  const text = (eventTitle || '').toLowerCase();

  // 1. Employment (higher specificity: unemployment, nonfarm payrolls, jobless claims)
  if (
    /\b(unemployment|payroll|payrolls|jobless|employment|desempleo|empleo|labor force|labor market|non-?farm|adp|jolts)\b/.test(
      text
    )
  ) {
    return 'employment';
  }

  // 2. Inflation (cpi, ppi, pce, inflation, price index, ipc, deflator)
  // Ensure "shipping" or "clipping" does not trigger "ppi"
  if (
    /\b(cpi|ipc|inflation|inflaci[oó]n|price index|\bppi\b|\bpce\b|deflator|cost of living)\b/.test(
      text
    )
  ) {
    return 'inflation';
  }

  // 3. Central Bank (rates, FOMC, Fed meetings, monetary policy, repo rate)
  // Ensure "confederation" does not trigger "fed"
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
