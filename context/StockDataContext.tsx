import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DJIA_STOCKS } from '../lib/djia';
import { supabase } from '../lib/supabase';
import { StockFundamentals, StockLiveData, StockWithLive } from '../types/stock';

const FINNHUB_KEY = process.env.EXPO_PUBLIC_FINNHUB_API_KEY ?? '';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockDataContextValue {
  stocks: StockWithLive[];
  loading: boolean;
  error: string | null;
}

const StockDataContext = createContext<StockDataContextValue>({
  stocks: [],
  loading: true,
  error: null,
});

export function useStockData() {
  return useContext(StockDataContext);
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchQuote(ticker: string): Promise<{
  price: number;
  prevClose: number;
  changePercent: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
} | null> {
  try {
    const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
    if (!res.ok) return null;
    const d = await res.json();
    const current: number = d.c ?? 0;
    const prevClose: number = d.pc ?? 0;
    // Use previous close as price when market is closed (c = 0 on weekends/after-hours)
    const price = current > 0 ? current : prevClose;
    if (price <= 0) return null;
    const changePercent = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    // open/high/low are 0 when market is closed — treat as unavailable
    const open    = (d.o  > 0) ? (d.o  as number) : undefined;
    const dayHigh = (d.h  > 0) ? (d.h  as number) : undefined;
    const dayLow  = (d.l  > 0) ? (d.l  as number) : undefined;
    return { price, prevClose, changePercent, open, dayHigh, dayLow };
  } catch {
    return null;
  }
}

// Supabase Edge Function proxies Yahoo Finance server-side to avoid CORS restrictions.
// Returns only the most recent trading day's 5-min closes (works on weekends/holidays).
const CANDLES_URL = 'https://guetouzxcfodjuseavtx.supabase.co/functions/v1/yahoo-candles';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

async function fetchCandles(ticker: string): Promise<number[]> {
  try {
    const res = await fetch(`${CANDLES_URL}?ticker=${ticker}`, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.closes) ? json.closes : [];
  } catch {
    return [];
  }
}

async function loadFundamentals(): Promise<Map<string, StockFundamentals>> {
  const result = new Map<string, StockFundamentals>();
  try {
    const { data, error } = await supabase.from('stock_fundamentals').select('*');
    if (error || !data) return result;
    for (const row of data) {
      result.set(row.ticker, {
        weekHigh52:   row.week_high_52,
        weekLow52:    row.week_low_52,
        peRatio:      row.pe_ratio,
        marketCap:    row.market_cap,
        eps:          row.eps,
        beta:         row.beta,
        dividendYield: row.dividend_yield,
        avgVolume10d: row.avg_volume_10d,
        updatedAt:    row.updated_at,
      });
    }
  } catch { /* ignore */ }
  return result;
}

// Fetch 15 at a time with a 1.1s gap to stay within Finnhub's 60 calls/min free limit
async function parallelBatch<T>(
  tickers: string[],
  fn: (t: string) => Promise<T>,
  batchSize = 15,
): Promise<Map<string, T>> {
  const result = new Map<string, T>();
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    const pairs = await Promise.all(batch.map(async t => [t, await fn(t)] as [string, T]));
    for (const [t, v] of pairs) result.set(t, v);
    if (i + batchSize < tickers.length) {
      await new Promise<void>(r => setTimeout(r, 1100));
    }
  }
  return result;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StockDataProvider({ children }: { children: React.ReactNode }) {
  const [liveData, setLiveData] = useState<Map<string, StockLiveData>>(new Map());
  const [fundamentalsData, setFundamentalsData] = useState<Map<string, StockFundamentals>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tickBufRef = useRef<Map<string, number>>(new Map());

  // Static stock list is hardcoded — no DB query needed
  const tickers = DJIA_STOCKS.map(s => s.ticker);

  // 1. Fetch initial live data from Finnhub + fundamentals from Supabase
  useEffect(() => {
    if (!FINNHUB_KEY || FINNHUB_KEY === 'your_finnhub_key_here') {
      setError('Add your EXPO_PUBLIC_FINNHUB_API_KEY to .env (free key at finnhub.io)');
      setLoading(false);
      return;
    }

    (async () => {
      // Finnhub quotes — rate-limited, run first
      const quoteMap = await parallelBatch(tickers, fetchQuote);

      // Candles (Supabase Edge Function) and fundamentals (Supabase DB) — both hit Supabase, run in parallel
      const [candleMap, fundsMap] = await Promise.all([
        parallelBatch(tickers, fetchCandles),
        loadFundamentals(),
      ]);

      setLiveData(() => {
        const m = new Map<string, StockLiveData>();
        for (const ticker of tickers) {
          const q = quoteMap.get(ticker);
          const candles = candleMap.get(ticker) ?? [];
          if (q) {
            m.set(ticker, {
              price: q.price,
              prevClose: q.prevClose,
              changePercent: q.changePercent,
              open: q.open,
              dayHigh: q.dayHigh,
              dayLow: q.dayLow,
              candles,
              lastUpdated: Date.now(),
            });
          }
        }
        return m;
      });

      setFundamentalsData(fundsMap);
      setLoading(false);
    })();
  }, []);

  // 2. WebSocket for real-time price ticks
  useEffect(() => {
    if (!FINNHUB_KEY || FINNHUB_KEY === 'your_finnhub_key_here') return;

    const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_KEY}`);

    ws.onopen = () => {
      for (const ticker of tickers) {
        ws.send(JSON.stringify({ type: 'subscribe', symbol: ticker }));
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'trade' && Array.isArray(msg.data)) {
          for (const trade of msg.data) {
            if (typeof trade.p === 'number' && trade.p > 0) {
              tickBufRef.current.set(trade.s as string, trade.p as number);
            }
          }
        }
      } catch { /* ignore */ }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    // Flush tick buffer into state every 500ms
    const flushId = setInterval(() => {
      if (!tickBufRef.current.size) return;
      const buf = new Map(tickBufRef.current);
      tickBufRef.current.clear();

      setLiveData(prev => {
        const next = new Map(prev);
        buf.forEach((price, ticker) => {
          const existing = next.get(ticker);
          if (existing) {
            const changePercent = existing.prevClose > 0
              ? ((price - existing.prevClose) / existing.prevClose) * 100
              : existing.changePercent;
            next.set(ticker, { ...existing, price, changePercent, lastUpdated: Date.now() });
          }
        });
        return next;
      });
    }, 500);

    return () => {
      clearInterval(flushId);
      ws.close();
    };
  }, []);

  // 3. Poll candle data every 90 seconds
  useEffect(() => {
    if (!FINNHUB_KEY || FINNHUB_KEY === 'your_finnhub_key_here') return;

    const pollId = setInterval(async () => {
      const candleMap = await parallelBatch(tickers, fetchCandles);
      setLiveData(prev => {
        const next = new Map(prev);
        candleMap.forEach((candles, ticker) => {
          const existing = next.get(ticker);
          if (existing && candles.length > 0) {
            next.set(ticker, { ...existing, candles });
          }
        });
        return next;
      });
    }, 90_000);

    return () => clearInterval(pollId);
  }, []);

  const stocksWithLive: StockWithLive[] = DJIA_STOCKS.map(s => ({
    ...s,
    live: liveData.get(s.ticker) ?? null,
    fundamentals: fundamentalsData.get(s.ticker) ?? null,
  }));

  return (
    <StockDataContext.Provider value={{ stocks: stocksWithLive, loading, error }}>
      {children}
    </StockDataContext.Provider>
  );
}
