import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useStockData } from './StockDataContext';
import { useWatchlist } from './WatchlistContext';
import { usePortfolio } from './PortfolioContext';
import { StockWithLive } from '../types/stock';
import { SIMILARITY_MAP } from '../lib/similarityMap';

// ─── Constants ────────────────────────────────────────────────────────────────

const COOLDOWN_MS = 72 * 60 * 60 * 1000;
const DECAY_LAMBDA = 0.05;
const DISCOVERY_RATIO = 0.08;
const SECTOR_CAP_RATIO = 0.4;
const DISCOVERY_SEEN_THRESHOLD = 3;
const BEGINNER_HOLDINGS_THRESHOLD = 3;
const BEGINNER_ETF_FLOOR = 0.4;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetType = 'crypto' | 'etf' | 'stock';
export type MarketCapTier = 'mega' | 'large' | 'mid' | 'small' | 'unknown';

export interface UserPreferences {
  sectorScores: Record<string, number>;
  assetTypeScores: Record<AssetType, number>;
  marketCapTierScores: Record<MarketCapTier, number>;
  betaPreference: number;
  dividendPreference: number;
  sectorSeenCounts: Record<string, number>;
}

export interface SwipeRecord {
  stockId: string;
  ticker: string;
  sector: string;
  direction: 'left' | 'right';
  swipedAt: Date;
  beta: number | null;
  dividendYield: number | null;
  marketCap: number | null;
}

export interface RecommendationContextValue {
  /** Whether the swipe history fetch from Supabase is still in flight. */
  historyLoading: boolean;
  /** Current derived user preferences (read-only, for debugging). */
  preferences: UserPreferences;
  /**
   * Record a swipe. Persists to Supabase and updates preferences in memory.
   * Call this from onSwipedRight / onSwipedLeft in the Swiper.
   */
  recordSwipe: (ticker: string, direction: 'left' | 'right') => Promise<void>;
  /**
   * Build the next batch of recommended cards.
   * Pass the set of tickers already in the display deck to avoid duplicates.
   * Call this to populate the initial deck and to replenish it.
   */
  getNextBatch: (excludeTickers: Set<string>, count?: number) => StockWithLive[];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: UserPreferences = {
  sectorScores: {},
  assetTypeScores: { crypto: 0, etf: 0, stock: 0 },
  marketCapTierScores: { mega: 0, large: 0, mid: 0, small: 0, unknown: 0 },
  betaPreference: 0,
  dividendPreference: 0,
  sectorSeenCounts: {},
};

// ─── Pure utilities ───────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getAssetType(sector: string | null): AssetType {
  if (sector === 'Cryptocurrency') return 'crypto';
  if (sector === 'ETF') return 'etf';
  return 'stock';
}

export function getMarketCapTier(marketCapMillions: number | null): MarketCapTier {
  if (marketCapMillions === null) return 'unknown';
  if (marketCapMillions >= 200_000) return 'mega';
  if (marketCapMillions >= 10_000) return 'large';
  if (marketCapMillions >= 2_000) return 'mid';
  return 'small';
}

export function computePreferences(
  history: SwipeRecord[],
  allStocks: StockWithLive[],
): UserPreferences {
  const stockMap = new Map(allStocks.map(s => [s.ticker, s]));

  const sectorSum: Record<string, number> = {};
  const sectorWeight: Record<string, number> = {};
  const sectorSeenCounts: Record<string, number> = {};
  const assetTypeSum: Record<AssetType, number> = { crypto: 0, etf: 0, stock: 0 };
  const assetTypeWeight: Record<AssetType, number> = { crypto: 0, etf: 0, stock: 0 };
  const tierSum: Record<MarketCapTier, number> = { mega: 0, large: 0, mid: 0, small: 0, unknown: 0 };
  const tierWeight: Record<MarketCapTier, number> = { mega: 0, large: 0, mid: 0, small: 0, unknown: 0 };
  let betaSum = 0, betaWeightTotal = 0;
  let dividendSum = 0, dividendWeightTotal = 0;

  const now = Date.now();

  for (const swipe of history) {
    const ageInDays = (now - swipe.swipedAt.getTime()) / 86_400_000;
    const w = Math.exp(-DECAY_LAMBDA * ageInDays);
    const signal = swipe.direction === 'right' ? 1.0 : -0.5;
    const weighted = signal * w;

    sectorSum[swipe.sector] = (sectorSum[swipe.sector] ?? 0) + weighted;
    sectorWeight[swipe.sector] = (sectorWeight[swipe.sector] ?? 0) + w;
    sectorSeenCounts[swipe.sector] = (sectorSeenCounts[swipe.sector] ?? 0) + 1;

    const at = getAssetType(swipe.sector);
    assetTypeSum[at] += weighted;
    assetTypeWeight[at] += w;

    const live = stockMap.get(swipe.ticker);
    const mc = live?.fundamentals?.marketCap ?? swipe.marketCap;
    const tier = getMarketCapTier(mc);
    tierSum[tier] += weighted;
    tierWeight[tier] += w;

    const beta = live?.fundamentals?.beta ?? swipe.beta;
    if (beta !== null) {
      betaSum += (beta - 1.0) * weighted;
      betaWeightTotal += w;
    }

    const divYield = live?.fundamentals?.dividendYield ?? swipe.dividendYield;
    if (divYield !== null) {
      dividendSum += clamp(divYield / 3.0, 0, 1) * weighted;
      dividendWeightTotal += w;
    }
  }

  const sectorScores: Record<string, number> = {};
  for (const sector of Object.keys(sectorSum)) {
    sectorScores[sector] = clamp(sectorSum[sector] / Math.max(sectorWeight[sector], 0.001), -1, 1);
  }

  const assetTypeScores: Record<AssetType, number> = { crypto: 0, etf: 0, stock: 0 };
  for (const at of ['crypto', 'etf', 'stock'] as AssetType[]) {
    if (assetTypeWeight[at] > 0)
      assetTypeScores[at] = clamp(assetTypeSum[at] / assetTypeWeight[at], -1, 1);
  }

  const marketCapTierScores: Record<MarketCapTier, number> = { mega: 0, large: 0, mid: 0, small: 0, unknown: 0 };
  for (const tier of ['mega', 'large', 'mid', 'small', 'unknown'] as MarketCapTier[]) {
    if (tierWeight[tier] > 0)
      marketCapTierScores[tier] = clamp(tierSum[tier] / tierWeight[tier], -1, 1);
  }

  return {
    sectorScores,
    assetTypeScores,
    marketCapTierScores,
    betaPreference: betaWeightTotal > 0 ? clamp(betaSum / betaWeightTotal, -1, 1) : 0,
    dividendPreference: dividendWeightTotal > 0 ? clamp(dividendSum / dividendWeightTotal, -1, 1) : 0,
    sectorSeenCounts,
  };
}

function scoreStock(
  stock: StockWithLive,
  prefs: UserPreferences,
  holdingsCount: number,
  similarityQueue: Set<string>,
): number {
  let score = 1.0;

  const sectorScore = prefs.sectorScores[stock.sector ?? ''] ?? 0;
  score *= 1.0 + sectorScore * 1.5;

  const at = getAssetType(stock.sector);
  let atScore = prefs.assetTypeScores[at];
  if (at === 'etf' && holdingsCount < BEGINNER_HOLDINGS_THRESHOLD)
    atScore = Math.max(atScore, BEGINNER_ETF_FLOOR);
  score *= clamp(1.0 + atScore * 2.0, 0, 3);

  const tier = getMarketCapTier(stock.fundamentals?.marketCap ?? null);
  score *= clamp(1.0 + (prefs.marketCapTierScores[tier] ?? 0) * 1.0, 0, 2);

  if (stock.fundamentals?.beta != null) {
    const agreement = (stock.fundamentals.beta - 1.0) * prefs.betaPreference;
    score *= clamp(1.0 + agreement * 0.8, 0.2, 1.8);
  }

  if (stock.fundamentals?.dividendYield != null) {
    const normalizedYield = clamp(stock.fundamentals.dividendYield / 3.0, 0, 1);
    score *= clamp(1.0 + normalizedYield * prefs.dividendPreference * 0.6, 0.4, 1.6);
  }

  if (stock.live?.changePercent != null) {
    if (stock.live.changePercent > 5) score *= 1.25;
    else if (stock.live.changePercent > 2) score *= 1.15;
  }

  if (similarityQueue.has(stock.ticker)) score *= 3.0;

  return Math.max(score, 0);
}

function weightedSample(
  candidates: Array<{ stock: StockWithLive; weight: number }>,
  count: number,
): StockWithLive[] {
  const pool = candidates.filter(c => c.weight > 0);
  if (pool.length === 0) return [];
  const keyed = pool.map(c => ({ stock: c.stock, key: Math.pow(Math.random(), 1 / c.weight) }));
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, count).map(k => k.stock);
}

function buildColdStartDeck(
  allStocks: StockWithLive[],
  excludeSet: Set<string>,
  count: number,
): StockWithLive[] {
  const available = allStocks.filter(s => !excludeSet.has(s.ticker));
  const picked = new Set<string>();
  const result: StockWithLive[] = [];

  for (const ticker of ['SPY', 'QQQ', 'GLD', 'BND', 'EFA', 'VYM']) {
    const s = available.find(a => a.ticker === ticker);
    if (s) { result.push(s); picked.add(s.ticker); }
  }

  const sectors = [
    'Technology', 'Healthcare', 'Financials', 'Consumer Discretionary',
    'Consumer Staples', 'Industrials', 'Energy', 'Materials', 'Communication Services',
  ];
  for (const sector of sectors) {
    const candidates = available.filter(s => s.sector === sector && !picked.has(s.ticker));
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      result.push(pick);
      picked.add(pick.ticker);
    }
  }

  const rest = available.filter(s => !picked.has(s.ticker));
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  result.push(...rest.slice(0, Math.max(0, count - result.length)));
  return result.slice(0, count);
}

export function buildDeck(
  allStocks: StockWithLive[],
  swipeHistory: Map<string, SwipeRecord[]>,
  prefs: UserPreferences,
  excludeSet: Set<string>,
  holdingsCount: number,
  similarityQueue: Set<string>,
  count: number,
): StockWithLive[] {
  const now = Date.now();

  // Add cooldown stocks to exclude set (left-swiped within 72h)
  const fullExclude = new Set<string>(excludeSet);
  for (const [ticker, records] of swipeHistory.entries()) {
    const latest = records[0];
    if (latest.direction === 'left' && now - latest.swipedAt.getTime() < COOLDOWN_MS) {
      fullExclude.add(ticker);
    }
  }

  const candidates = allStocks.filter(s => !fullExclude.has(s.ticker));
  if (candidates.length === 0) return [];

  const totalSwipes = Array.from(swipeHistory.values()).reduce((n, r) => n + r.length, 0);
  if (totalSwipes === 0) return buildColdStartDeck(allStocks, excludeSet, count);

  const discoveryCount = Math.max(1, Math.ceil(count * DISCOVERY_RATIO));
  const normalCount = count - discoveryCount;

  const discoveryPool = candidates.filter(
    s => (prefs.sectorSeenCounts[s.sector ?? ''] ?? 0) < DISCOVERY_SEEN_THRESHOLD,
  );

  const scored = candidates.map(s => ({ stock: s, weight: scoreStock(s, prefs, holdingsCount, similarityQueue) }));
  const scoredDiscovery = discoveryPool.map(s => ({ stock: s, weight: scoreStock(s, prefs, holdingsCount, similarityQueue) }));

  const normalSample = weightedSample(scored, normalCount);
  const discoverySample = weightedSample(scoredDiscovery, discoveryCount);

  // Sector cap
  const maxPerSector = Math.floor(count * SECTOR_CAP_RATIO);
  const allSampled = [...normalSample, ...discoverySample];
  const capped: StockWithLive[] = [];
  const sectorCounts: Record<string, number> = {};

  for (const s of allSampled) {
    const sec = s.sector ?? 'Unknown';
    const cur = sectorCounts[sec] ?? 0;
    if (cur < maxPerSector) {
      capped.push(s);
      sectorCounts[sec] = cur + 1;
    }
  }

  // Fill gaps from leftover
  if (capped.length < count) {
    const usedTickers = new Set(capped.map(s => s.ticker));
    const filler = candidates.filter(s => !usedTickers.has(s.ticker) && (sectorCounts[s.sector ?? 'Unknown'] ?? 0) < maxPerSector);
    for (let i = filler.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filler[i], filler[j]] = [filler[j], filler[i]];
    }
    capped.push(...filler.slice(0, count - capped.length));
  }

  // Interleave discovery cards
  const discoveryTickers = new Set(discoverySample.map(s => s.ticker));
  const normalCards = capped.filter(s => !discoveryTickers.has(s.ticker));
  const discoveryCards = discoverySample.filter(s => capped.some(c => c.ticker === s.ticker));

  const final: StockWithLive[] = [];
  let dIdx = 0;
  for (let i = 0; i < normalCards.length; i++) {
    final.push(normalCards[i]);
    if (dIdx < discoveryCards.length && (i + 1) % 12 === 0) {
      final.push(discoveryCards[dIdx++]);
    }
  }
  while (dIdx < discoveryCards.length) final.push(discoveryCards[dIdx++]);

  return final.slice(0, count);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const RecommendationContext = createContext<RecommendationContextValue | null>(null);

export function RecommendationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { stocks } = useStockData();
  const { tickers: watchlistTickers } = useWatchlist();
  const { holdings } = usePortfolio();

  const userId = session?.user?.id ?? null;

  const [swipeHistory, setSwipeHistory] = useState<Map<string, SwipeRecord[]>>(new Map());
  const [historyLoading, setHistoryLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  const tickerToDbIdRef = useRef<Map<string, string>>(new Map());
  const similarityQueueRef = useRef<Set<string>>(new Set());

  // ── Load history ───────────────────────────────────────────────────────────

  const loadSwipeHistory = useCallback(async (uid: string) => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('swipes')
        .select('stock_id, direction, swiped_at, stocks(ticker, sector)')
        .eq('user_id', uid)
        .order('swiped_at', { ascending: false });

      if (error) throw error;

      const historyMap = new Map<string, SwipeRecord[]>();
      const idMap = new Map<string, string>();

      if (data) {
        for (const row of data) {
          const stockInfo = row.stocks as { ticker: string; sector: string } | null;
          if (!stockInfo) continue;
          const { ticker, sector } = stockInfo;
          const record: SwipeRecord = {
            stockId: row.stock_id,
            ticker,
            sector,
            direction: row.direction as 'left' | 'right',
            swipedAt: new Date(row.swiped_at),
            beta: null,
            dividendYield: null,
            marketCap: null,
          };
          if (!historyMap.has(ticker)) historyMap.set(ticker, []);
          historyMap.get(ticker)!.push(record);
          idMap.set(ticker, row.stock_id);
        }
      }

      setSwipeHistory(historyMap);
      tickerToDbIdRef.current = idMap;
    } catch {
      // swipe history is non-critical; proceed with empty history
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setHistoryLoading(false);
      setSwipeHistory(new Map());
      return;
    }
    loadSwipeHistory(userId);
  }, [userId, loadSwipeHistory]);

  // ── Update preferences when history or stocks change ──────────────────────

  useEffect(() => {
    if (stocks.length === 0) return;
    const allRecords = Array.from(swipeHistory.values()).flat();
    setPreferences(computePreferences(allRecords, stocks));
  }, [swipeHistory, stocks]);

  // ── getNextBatch ───────────────────────────────────────────────────────────

  const getNextBatch = useCallback((excludeTickers: Set<string>, count = 20): StockWithLive[] => {
    return buildDeck(
      stocks,
      swipeHistory,
      preferences,
      excludeTickers,
      holdings.length,
      similarityQueueRef.current,
      count,
    );
  }, [stocks, swipeHistory, preferences, holdings]);

  // ── recordSwipe ────────────────────────────────────────────────────────────

  const recordSwipe = useCallback(async (ticker: string, direction: 'left' | 'right') => {
    const stockData = stocks.find(s => s.ticker === ticker);
    const swipedAt = new Date();

    const newRecord: SwipeRecord = {
      stockId: tickerToDbIdRef.current.get(ticker) ?? '',
      ticker,
      sector: stockData?.sector ?? 'Unknown',
      direction,
      swipedAt,
      beta: stockData?.fundamentals?.beta ?? null,
      dividendYield: stockData?.fundamentals?.dividendYield ?? null,
      marketCap: stockData?.fundamentals?.marketCap ?? null,
    };

    setSwipeHistory(prev => {
      const next = new Map(prev);
      next.set(ticker, [newRecord, ...(next.get(ticker) ?? [])]);
      return next;
    });

    if (direction === 'right') {
      (SIMILARITY_MAP[ticker] ?? []).forEach(t => similarityQueueRef.current.add(t));
    }

    if (!userId) return;

    let dbId = tickerToDbIdRef.current.get(ticker);
    if (!dbId) {
      const { data } = await supabase.from('stocks').select('id').eq('ticker', ticker).single();
      if (data?.id) {
        dbId = data.id;
        tickerToDbIdRef.current.set(ticker, data.id);
      }
    }

    if (dbId) {
      await supabase.from('swipes').insert({
        user_id: userId,
        stock_id: dbId,
        direction,
        swiped_at: swipedAt.toISOString(),
      });
    }
  }, [userId, stocks]);

  return (
    <RecommendationContext.Provider value={{ historyLoading, preferences, recordSwipe, getNextBatch }}>
      {children}
    </RecommendationContext.Provider>
  );
}

export function useRecommendation(): RecommendationContextValue {
  const ctx = useContext(RecommendationContext);
  if (!ctx) throw new Error('useRecommendation must be used within RecommendationProvider');
  return ctx;
}
