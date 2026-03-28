import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface WatchlistContextValue {
  tickers: string[];
  loading: boolean;
  addToWatchlist: (ticker: string) => Promise<void>;
  removeFromWatchlist: (ticker: string) => Promise<void>;
  clearWatchlist: () => Promise<void>;
  isInWatchlist: (ticker: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextValue>({
  tickers: [],
  loading: true,
  addToWatchlist: async () => {},
  removeFromWatchlist: async () => {},
  clearWatchlist: async () => {},
  isInWatchlist: () => false,
});

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tickers, setTickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTickers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('watchlist')
      .select('ticker')
      .eq('user_id', user.id)
      .order('added_at', { ascending: true })
      .then(({ data }) => {
        setTickers(data ? data.map((r: { ticker: string }) => r.ticker) : []);
        setLoading(false);
      });
  }, [user?.id]);

  const addToWatchlist = useCallback(async (ticker: string) => {
    if (!user) return;
    // Optimistic update
    setTickers(prev => prev.includes(ticker) ? prev : [...prev, ticker]);
    const { error } = await supabase
      .from('watchlist')
      .insert({ user_id: user.id, ticker });
    if (error) {
      // Rollback on failure
      setTickers(prev => prev.filter(t => t !== ticker));
    }
  }, [user]);

  const removeFromWatchlist = useCallback(async (ticker: string) => {
    if (!user) return;
    // Optimistic update
    setTickers(prev => prev.filter(t => t !== ticker));
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('ticker', ticker);
    if (error) {
      // Rollback on failure
      setTickers(prev => [...prev, ticker]);
    }
  }, [user]);

  const clearWatchlist = useCallback(async () => {
    if (!user) return;
    const prev = tickers;
    setTickers([]);
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id);
    if (error) {
      setTickers(prev);
    }
  }, [user, tickers]);

  const isInWatchlist = useCallback(
    (ticker: string) => tickers.includes(ticker),
    [tickers],
  );

  return (
    <WatchlistContext.Provider value={{ tickers, loading, addToWatchlist, removeFromWatchlist, clearWatchlist, isInWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  return useContext(WatchlistContext);
}
