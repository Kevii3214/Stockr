/**
 * Static similarity graph for the 61 tickers in the app.
 * Used by the recommendation algorithm to boost related stocks
 * after a right-swipe.
 */
export const SIMILARITY_MAP: Record<string, string[]> = {
  // ─── Technology ───────────────────────────────────────────────
  AAPL: ['MSFT', 'NVDA', 'CSCO', 'IBM'],
  MSFT: ['AAPL', 'NVDA', 'CRM', 'IBM'],
  NVDA: ['AAPL', 'MSFT', 'CSCO', 'QQQ', 'XLK'],
  CRM:  ['MSFT', 'IBM', 'CSCO'],
  CSCO: ['IBM', 'MSFT', 'HON'],
  IBM:  ['MSFT', 'CSCO', 'CRM'],

  // ─── Healthcare ───────────────────────────────────────────────
  AMGN: ['JNJ', 'MRK', 'UNH'],
  JNJ:  ['AMGN', 'MRK', 'UNH'],
  MRK:  ['JNJ', 'AMGN', 'UNH'],
  UNH:  ['JNJ', 'MRK', 'AMGN'],

  // ─── Financials ───────────────────────────────────────────────
  GS:  ['JPM', 'AXP', 'V'],
  JPM: ['GS', 'AXP', 'V', 'TRV'],
  AXP: ['V', 'JPM', 'GS'],
  V:   ['AXP', 'JPM', 'GS'],
  TRV: ['JPM', 'V'],

  // ─── Consumer Discretionary ───────────────────────────────────
  AMZN: ['MCD', 'HD', 'NKE'],
  MCD:  ['AMZN', 'KO', 'WMT'],
  HD:   ['AMZN', 'WMT'],
  NKE:  ['AMZN', 'MCD'],

  // ─── Consumer Staples ─────────────────────────────────────────
  KO:  ['PG', 'WMT', 'MCD'],
  PG:  ['KO', 'WMT'],
  WMT: ['KO', 'PG', 'HD'],

  // ─── Industrials ──────────────────────────────────────────────
  BA:  ['HON', 'CAT', 'MMM'],
  CAT: ['BA', 'HON', 'MMM', 'DOW'],
  HON: ['BA', 'CAT', 'MMM'],
  MMM: ['BA', 'CAT', 'HON'],

  // ─── Energy / Materials ───────────────────────────────────────
  CVX: ['DOW', 'SHW'],
  DOW: ['CAT', 'CVX', 'SHW'],
  SHW: ['DOW', 'CVX'],

  // ─── Communication Services ───────────────────────────────────
  DIS: ['AMZN', 'MSFT'],

  // ─── Crypto clusters ──────────────────────────────────────────
  BTC:   ['ETH', 'BNB'],
  ETH:   ['BTC', 'SOL', 'MATIC', 'AVAX'],
  SOL:   ['ETH', 'AVAX', 'DOT'],
  BNB:   ['BTC', 'ETH'],
  XRP:   ['ADA', 'DOT', 'LINK'],
  ADA:   ['XRP', 'DOT', 'ETH'],
  AVAX:  ['SOL', 'ETH', 'DOT'],
  DOT:   ['SOL', 'ADA', 'LINK'],
  LINK:  ['DOT', 'XRP', 'ETH'],
  MATIC: ['ETH', 'SOL', 'AVAX'],

  // ─── ETF clusters ─────────────────────────────────────────────
  SPY:  ['VOO', 'VTI', 'DIA'],
  VOO:  ['SPY', 'VTI', 'QQQ'],
  VTI:  ['SPY', 'VOO'],
  QQQ:  ['XLK', 'ARKK', 'SPY'],
  DIA:  ['SPY', 'VOO'],
  IWM:  ['VTI', 'EEM'],
  GLD:  ['TLT', 'BND'],
  TLT:  ['BND', 'GLD'],
  XLK:  ['QQQ', 'ARKK'],
  VNQ:  ['VYM', 'BND'],
  EEM:  ['EFA', 'IWM'],
  EFA:  ['EEM', 'VTI'],
  ARKK: ['QQQ', 'XLK'],
  BND:  ['TLT', 'GLD', 'VYM'],
  VYM:  ['BND', 'VNQ'],
};
