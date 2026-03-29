import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useStockData } from './StockDataContext';

const LEGACY_CASH_KEY = '@stockr:cash_balance';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Holding {
  ticker: string;
  shares: number;
  avgCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingWithLive extends Holding {
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  plDollar: number;
  plPercent: number;
  companyName: string;
  logoUrl: string | null;
}

interface PortfolioContextValue {
  cashBalance: number;
  holdings: Holding[];
  holdingsLoading: boolean;
  totalInvested: number;
  totalCurrentValue: number;
  totalPortfolioValue: number;
  totalPLDollar: number;
  totalPLPercent: number;
  getAllHoldingsWithLive: () => HoldingWithLive[];
  sharesOwned: (ticker: string) => number;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  buyStock: (ticker: string, shares: number, pricePerShare: number) => Promise<{ error: string | null }>;
  sellStock: (ticker: string, shares: number, pricePerShare: number) => Promise<{ error: string | null }>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { stocks } = useStockData();

  const [cashBalance, setCashBalance] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);

  // Load data when user signs in
  useEffect(() => {
    if (!user) {
      setCashBalance(0);
      setHoldings([]);
      return;
    }
    loadPortfolio(user.id);
  }, [user?.id]);

  const loadPortfolio = async (userId: string) => {
    setHoldingsLoading(true);
    try {
      // Load cash balance from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('cash_balance')
        .eq('id', userId)
        .single();

      let cash = profile?.cash_balance ?? 0;

      // Migrate from AsyncStorage if Supabase has 0
      if (cash === 0) {
        const legacy = await AsyncStorage.getItem(LEGACY_CASH_KEY);
        if (legacy && parseFloat(legacy) > 0) {
          cash = parseFloat(legacy);
          await supabase.from('profiles').update({ cash_balance: cash }).eq('id', userId);
          await AsyncStorage.removeItem(LEGACY_CASH_KEY);
        }
      }

      setCashBalance(cash);

      // Load holdings
      const { data: rows } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', userId);

      if (rows) {
        setHoldings(rows.map(r => ({
          ticker: r.ticker,
          shares: parseFloat(r.shares),
          avgCost: parseFloat(r.avg_cost),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })));
      }
    } finally {
      setHoldingsLoading(false);
    }
  };

  // ─── Deposit / Withdraw ──────────────────────────────────────────────────────

  const deposit = async (amount: number) => {
    if (!user) return;
    const next = cashBalance + amount;
    setCashBalance(next);
    await supabase.from('profiles').update({ cash_balance: next }).eq('id', user.id);
  };

  const withdraw = async (amount: number) => {
    if (!user) return;
    const next = Math.max(0, cashBalance - amount);
    setCashBalance(next);
    await supabase.from('profiles').update({ cash_balance: next }).eq('id', user.id);
  };

  // ─── Buy ─────────────────────────────────────────────────────────────────────

  const buyStock = async (
    ticker: string,
    shares: number,
    pricePerShare: number,
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in' };

    const totalCost = shares * pricePerShare;
    if (totalCost > cashBalance) return { error: 'Insufficient buying power' };

    const existing = holdings.find(h => h.ticker === ticker);
    const newShares = (existing?.shares ?? 0) + shares;
    const newAvgCost = existing
      ? (existing.avgCost * existing.shares + totalCost) / newShares
      : pricePerShare;
    const newCash = cashBalance - totalCost;

    // Optimistic update
    setCashBalance(newCash);
    setHoldings(prev => {
      if (existing) {
        return prev.map(h =>
          h.ticker === ticker
            ? { ...h, shares: newShares, avgCost: newAvgCost }
            : h,
        );
      }
      return [...prev, {
        ticker,
        shares,
        avgCost: pricePerShare,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    });

    // Persist cash
    const { error: cashErr } = await supabase
      .from('profiles')
      .update({ cash_balance: newCash })
      .eq('id', user.id);

    if (cashErr) {
      // Rollback
      setCashBalance(cashBalance);
      setHoldings(prev => existing
        ? prev.map(h => h.ticker === ticker ? existing : h)
        : prev.filter(h => h.ticker !== ticker));
      return { error: cashErr.message };
    }

    // Persist holding
    const { error: holdErr } = await supabase
      .from('holdings')
      .upsert(
        { user_id: user.id, ticker, shares: newShares, avg_cost: newAvgCost },
        { onConflict: 'user_id,ticker' },
      );

    if (holdErr) {
      // Compensate: restore cash
      await supabase.from('profiles').update({ cash_balance: cashBalance }).eq('id', user.id);
      setCashBalance(cashBalance);
      setHoldings(prev => existing
        ? prev.map(h => h.ticker === ticker ? existing : h)
        : prev.filter(h => h.ticker !== ticker));
      return { error: holdErr.message };
    }

    return { error: null };
  };

  // ─── Sell ─────────────────────────────────────────────────────────────────────

  const sellStock = async (
    ticker: string,
    shares: number,
    pricePerShare: number,
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in' };

    const existing = holdings.find(h => h.ticker === ticker);
    if (!existing) return { error: 'No position found' };
    if (shares > existing.shares) return { error: 'Insufficient shares' };

    const proceeds = shares * pricePerShare;
    const newCash = cashBalance + proceeds;
    const remainingShares = existing.shares - shares;

    // Optimistic update
    setCashBalance(newCash);
    setHoldings(prev =>
      remainingShares === 0
        ? prev.filter(h => h.ticker !== ticker)
        : prev.map(h => h.ticker === ticker ? { ...h, shares: remainingShares } : h),
    );

    // Persist cash
    const { error: cashErr } = await supabase
      .from('profiles')
      .update({ cash_balance: newCash })
      .eq('id', user.id);

    if (cashErr) {
      setCashBalance(cashBalance);
      setHoldings(prev => {
        const withoutTicker = prev.filter(h => h.ticker !== ticker);
        return [...withoutTicker, existing].sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt));
      });
      return { error: cashErr.message };
    }

    // Persist holding (delete or update)
    if (remainingShares === 0) {
      const { error: delErr } = await supabase
        .from('holdings')
        .delete()
        .eq('user_id', user.id)
        .eq('ticker', ticker);
      if (delErr) {
        await supabase.from('profiles').update({ cash_balance: cashBalance }).eq('id', user.id);
        setCashBalance(cashBalance);
        setHoldings(prev => {
          const withoutTicker = prev.filter(h => h.ticker !== ticker);
          return [...withoutTicker, existing].sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt));
        });
        return { error: delErr.message };
      }
    } else {
      const { error: updErr } = await supabase
        .from('holdings')
        .update({ shares: remainingShares })
        .eq('user_id', user.id)
        .eq('ticker', ticker);
      if (updErr) {
        await supabase.from('profiles').update({ cash_balance: cashBalance }).eq('id', user.id);
        setCashBalance(cashBalance);
        setHoldings(prev => prev.map(h => h.ticker === ticker ? existing : h));
        return { error: updErr.message };
      }
    }

    return { error: null };
  };

  // ─── Derived values ──────────────────────────────────────────────────────────

  const getAllHoldingsWithLive = useCallback((): HoldingWithLive[] => {
    return holdings.map(h => {
      const stock = stocks.find(s => s.ticker === h.ticker);
      const currentPrice = stock?.live?.price ?? h.avgCost;
      const currentValue = h.shares * currentPrice;
      const costBasis = h.shares * h.avgCost;
      const plDollar = currentValue - costBasis;
      const plPercent = costBasis > 0 ? (plDollar / costBasis) * 100 : 0;
      return {
        ...h,
        currentPrice,
        currentValue,
        costBasis,
        plDollar,
        plPercent,
        companyName: stock?.company_name ?? h.ticker,
        logoUrl: stock?.logo_url ?? null,
      };
    });
  }, [holdings, stocks]);

  const sharesOwned = useCallback(
    (ticker: string) => holdings.find(h => h.ticker === ticker)?.shares ?? 0,
    [holdings],
  );

  const totalInvested = holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0);

  const totalCurrentValue = holdings.reduce((sum, h) => {
    const stock = stocks.find(s => s.ticker === h.ticker);
    const price = stock?.live?.price ?? h.avgCost;
    return sum + h.shares * price;
  }, 0);

  const totalPortfolioValue = cashBalance + totalCurrentValue;
  const totalPLDollar = totalCurrentValue - totalInvested;
  const totalPLPercent = totalInvested > 0 ? (totalPLDollar / totalInvested) * 100 : 0;

  return (
    <PortfolioContext.Provider value={{
      cashBalance,
      holdings,
      holdingsLoading,
      totalInvested,
      totalCurrentValue,
      totalPortfolioValue,
      totalPLDollar,
      totalPLPercent,
      getAllHoldingsWithLive,
      sharesOwned,
      deposit,
      withdraw,
      buyStock,
      sellStock,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
