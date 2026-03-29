import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useWatchlist } from './WatchlistContext';
import { usePortfolio } from './PortfolioContext';
import { useStockData } from './StockDataContext';

// ─── XP / Levels ──────────────────────────────────────────────────────────────

export const XP_LEVELS = [
  { level: 1, name: 'Seed',        minXP: 0,    maxXP: 200  },
  { level: 2, name: 'Sprout',      minXP: 200,  maxXP: 500  },
  { level: 3, name: 'Growing',     minXP: 500,  maxXP: 1000 },
  { level: 4, name: 'Established', minXP: 1000, maxXP: 2000 },
  { level: 5, name: 'Pro',         minXP: 2000, maxXP: Infinity },
];

export function getLevelInfo(xp: number) {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXP) return XP_LEVELS[i];
  }
  return XP_LEVELS[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingStep =
  | 'greeting'
  | 'experience'
  | 'goal'
  | 'risk'
  | 'generating'
  | 'done';

export interface OnboardingAnswers {
  experience?: string;
  goal?: string;
  risk?: string;
}

export interface UserPlan {
  id: string;
  experience: string;
  style: string;
  horizon: string;
  risk: string;
  goal: string;
  budget: string;
  sectors: string[];
  planTitle: string;
  planSummary: string;
  xpTotal: number;
  level: number;
  createdAt: string;
}

export interface PlanTask {
  id: string;
  planId: string;
  taskKey: string;
  category: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const STEP_ORDER: OnboardingStep[] = [
  'experience', 'goal', 'risk',
];

function nextStep(current: OnboardingStep): OnboardingStep {
  const idx = STEP_ORDER.indexOf(current);
  if (idx === -1 || idx >= STEP_ORDER.length - 1) return 'generating';
  return STEP_ORDER[idx + 1];
}

// ─── Context interface ────────────────────────────────────────────────────────

interface PlanContextValue {
  plan: UserPlan | null;
  tasks: PlanTask[];
  messages: ChatMessage[];
  planLoading: boolean;
  chatLoading: boolean;
  onboardingStep: OnboardingStep;
  onboardingAnswers: OnboardingAnswers;
  sendMessage: (text: string) => Promise<void>;
  selectQuickReply: (label: string, value: string, step: OnboardingStep) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  createNewPlan: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localId() {
  return `local_${Date.now()}_${Math.random()}`;
}

function mapRowToTask(r: Record<string, unknown>): PlanTask {
  return {
    id: r.id as string,
    planId: r.plan_id as string,
    taskKey: r.task_key as string,
    category: r.category as string,
    title: r.title as string,
    description: r.description as string,
    xpReward: r.xp_reward as number,
    completed: r.completed as boolean,
    completedAt: (r.completed_at as string | null) ?? null,
    sortOrder: r.sort_order as number,
  };
}

function mapRowToPlan(r: Record<string, unknown>): UserPlan {
  return {
    id: r.id as string,
    experience: r.experience as string,
    style: r.style as string,
    horizon: r.horizon as string,
    risk: r.risk as string,
    goal: r.goal as string,
    budget: r.budget as string,
    sectors: (r.sectors as string[]) ?? [],
    planTitle: r.plan_title as string,
    planSummary: r.plan_summary as string,
    xpTotal: r.xp_total as number,
    level: r.level as number,
    createdAt: r.created_at as string,
  };
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { tickers: watchlistTickers } = useWatchlist();
  const { holdings } = usePortfolio();
  const { stocks } = useStockData();

  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('greeting');
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers>({});

  // Prevent double-run of auto-completion
  const completingRef = useRef<Set<string>>(new Set());

  // ─── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      setPlan(null);
      setTasks([]);
      setMessages([]);
      setOnboardingStep('greeting');
      setOnboardingAnswers({});
      return;
    }
    loadPlanData(user.id);
  }, [user?.id]);

  async function loadPlanData(userId: string) {
    setPlanLoading(true);
    try {
      const { data: planRow } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (planRow) {
        setPlan(mapRowToPlan(planRow));
        const { data: taskRows } = await supabase
          .from('plan_tasks')
          .select('*')
          .eq('plan_id', planRow.id)
          .order('sort_order', { ascending: true });
        setTasks(taskRows?.map(mapRowToTask) ?? []);
      } else {
        setPlan(null);
        setTasks([]);
        setOnboardingStep('experience');
      }

      const { data: msgRows } = await supabase
        .from('plan_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (msgRows && msgRows.length > 0) {
        setMessages(msgRows.map(r => ({
          id: r.id,
          role: r.role as 'user' | 'assistant',
          content: r.content,
          createdAt: r.created_at,
        })));
      } else {
        // Show greeting immediately without a network call
        setMessages([{
          id: localId(),
          role: 'assistant',
          content: "Hey! 👋 I'm Baggio, your personal investment guide. I'll help build a plan that fits your life — just 3 quick questions.\n\nFirst: what's your experience level with investing?",
          createdAt: new Date().toISOString(),
        }]);
      }
    } finally {
      setPlanLoading(false);
    }
  }

  // ─── callBaggio ──────────────────────────────────────────────────────────

  async function callBaggio(
    msgs: ChatMessage[],
    step: OnboardingStep,
    answers: OnboardingAnswers,
    mode: 'chat' | 'generate_plan',
  ): Promise<string> {
    const context = {
      experience: answers.experience,
      risk: answers.risk,
      goal: answers.goal,
      planState: plan ? 'active' : 'onboarding',
      onboardingStep: step,
      watchlistCount: watchlistTickers.length,
      portfolioSummary: holdings.length > 0
        ? `${holdings.length} holding${holdings.length > 1 ? 's' : ''}`
        : undefined,
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/baggio-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        messages: msgs.slice(-20).map(m => ({ role: m.role, content: m.content })),
        context,
        mode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }
    return response.json();
  }

  // ─── persistMessage ───────────────────────────────────────────────────────

  async function persistMessage(userId: string, role: 'user' | 'assistant', content: string) {
    await supabase.from('plan_messages').insert({ user_id: userId, role, content });
  }

  // ─── sendMessage ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !text.trim()) return;

    const userMsg: ChatMessage = {
      id: localId(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    await persistMessage(user.id, 'user', userMsg.content);

    try {
      const currentMessages = await new Promise<ChatMessage[]>(resolve => {
        setMessages(prev => { resolve(prev); return prev; });
      });

      const data = await callBaggio(currentMessages, onboardingStep, onboardingAnswers, 'chat') as { reply: string };
      const reply = data.reply ?? "I'm having trouble connecting right now. Please try again.";

      const assistantMsg: ChatMessage = {
        id: localId(),
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      await persistMessage(user.id, 'assistant', reply);
    } catch {
      const errMsg: ChatMessage = {
        id: localId(),
        role: 'assistant',
        content: "Oops! I had trouble connecting. Please check your connection and try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  }, [user, onboardingStep, onboardingAnswers, plan, watchlistTickers.length, holdings.length]);

  // ─── selectQuickReply ─────────────────────────────────────────────────────

  const selectQuickReply = useCallback(async (
    label: string,
    value: string,
    step: OnboardingStep,
  ) => {
    if (!user) return;

    const newAnswers = { ...onboardingAnswers };

    if (step === 'experience') newAnswers.experience = value;
    else if (step === 'goal')  newAnswers.goal = value;
    else if (step === 'risk')  newAnswers.risk = value;

    setOnboardingAnswers(newAnswers);

    const userMsg: ChatMessage = {
      id: localId(),
      role: 'user',
      content: label,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    await persistMessage(user.id, 'user', label);

    const next = nextStep(step);
    setOnboardingStep(next);

    if (next === 'generating') {
      await generatePlan(user.id, newAnswers);
      return;
    }

    setChatLoading(true);
    try {
      const currentMessages = await new Promise<ChatMessage[]>(resolve => {
        setMessages(prev => { resolve(prev); return prev; });
      });

      const data = await callBaggio(currentMessages, next, newAnswers, 'chat') as { reply: string };
      const reply = data.reply ?? "Got it! Let's keep going.";

      const assistantMsg: ChatMessage = {
        id: localId(),
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      await persistMessage(user.id, 'assistant', reply);
    } catch {
      // Silently continue — the user can still advance
    } finally {
      setChatLoading(false);
    }
  }, [user, onboardingAnswers, watchlistTickers.length, holdings.length]);

  // ─── generatePlan ─────────────────────────────────────────────────────────

  async function generatePlan(userId: string, answers: OnboardingAnswers) {
    setOnboardingStep('generating');
    setChatLoading(true);

    const loadingMsg: ChatMessage = {
      id: localId(),
      role: 'assistant',
      content: "Give me a moment while I craft your personalized plan... ✨",
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      const currentMessages = await new Promise<ChatMessage[]>(resolve => {
        setMessages(prev => { resolve(prev); return prev; });
      });

      const planData = await callBaggio(
        currentMessages,
        'generating',
        answers,
        'generate_plan',
      ) as {
        plan_title: string;
        plan_summary: string;
        tasks: Array<{
          task_key: string;
          category: string;
          title: string;
          description: string;
          xp_reward: number;
          sort_order: number;
        }>;
      };

      const { data: planRow, error: planErr } = await supabase
        .from('user_plans')
        .upsert({
          user_id: userId,
          experience: answers.experience ?? 'beginner',
          style: answers.goal ?? 'growth',
          horizon: 'medium',
          risk: answers.risk ?? 'moderate',
          goal: answers.goal ?? 'wealth',
          budget: 'exploring',
          sectors: [],
          plan_title: planData.plan_title ?? 'Your Investing Journey',
          plan_summary: planData.plan_summary ?? "Let's build your portfolio step by step.",
          xp_total: 0,
          level: 1,
          is_active: true,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (planErr || !planRow) throw new Error(planErr?.message ?? 'Failed to save plan');

      const taskInserts = (planData.tasks ?? []).map((t, i) => ({
        plan_id: planRow.id,
        user_id: userId,
        task_key: t.task_key,
        category: t.category,
        title: t.title,
        description: t.description,
        xp_reward: t.xp_reward,
        completed: false,
        sort_order: t.sort_order ?? i,
      }));

      if (taskInserts.length > 0) {
        await supabase.from('plan_tasks').insert(taskInserts);
      }

      const { data: savedTasks } = await supabase
        .from('plan_tasks')
        .select('*')
        .eq('plan_id', planRow.id)
        .order('sort_order', { ascending: true });

      setPlan(mapRowToPlan(planRow));
      setTasks(savedTasks?.map(mapRowToTask) ?? []);
      setOnboardingStep('done');

      const doneMsg: ChatMessage = {
        id: localId(),
        role: 'assistant',
        content: `Your plan is ready! 🌱 I've created "${planData.plan_title}" for you — complete the tasks below to earn XP and level up. You can always tap me in the corner if you have questions. Let's go!`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, doneMsg]);
      await persistMessage(userId, 'assistant', doneMsg.content);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: localId(),
        role: 'assistant',
        content: "I had trouble generating your plan. Please check your connection and try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
      setOnboardingStep('risk');
    } finally {
      setChatLoading(false);
    }
  }

  // ─── completeTask ─────────────────────────────────────────────────────────

  const completeTask = useCallback(async (taskId: string) => {
    if (!user || !plan) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    const newXp = plan.xpTotal + task.xpReward;
    const newLevel = getLevelInfo(newXp).level;
    const prevPlan = plan;
    const prevTasks = tasks;

    // Optimistic
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t,
    ));
    setPlan(prev => prev ? { ...prev, xpTotal: newXp, level: newLevel } : prev);

    const { error: taskErr } = await supabase
      .from('plan_tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskId);

    if (taskErr) {
      setTasks(prevTasks);
      setPlan(prevPlan);
      return;
    }

    const { error: planErr } = await supabase
      .from('user_plans')
      .update({ xp_total: newXp, level: newLevel })
      .eq('id', plan.id);

    if (planErr) {
      setTasks(prevTasks);
      setPlan(prevPlan);
    }
  }, [user, plan, tasks]);

  // ─── createNewPlan ────────────────────────────────────────────────────────

  const createNewPlan = useCallback(async () => {
    if (!user || !plan) return;

    await supabase
      .from('user_plans')
      .update({ is_active: false })
      .eq('id', plan.id);

    setPlan(null);
    setTasks([]);
    setOnboardingStep('experience');
    setOnboardingAnswers({});
    setMessages([{
      id: localId(),
      role: 'assistant',
      content: "Let's build a fresh plan! 🌱 Just 3 quick questions.\n\nFirst — what's your experience level with investing?",
      createdAt: new Date().toISOString(),
    }]);
  }, [user, plan]);

  // ─── Auto-completion ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!plan || tasks.length === 0) return;

    const incomplete = tasks.filter(t => !t.completed);
    if (incomplete.length === 0) return;

    for (const task of incomplete) {
      if (completingRef.current.has(task.id)) continue;

      let shouldComplete = false;

      switch (task.taskKey) {
        case 'add_etf': {
          shouldComplete = watchlistTickers.some(ticker => {
            const stock = stocks.find(s => s.ticker === ticker);
            return stock?.sector === 'ETF' || ['SPY', 'QQQ', 'GLD', 'BND', 'EFA', 'VYM', 'IWM', 'VTI', 'ARKK', 'XLF', 'XLV', 'XLE', 'XLK', 'GDX', 'TLT'].includes(ticker);
          });
          break;
        }
        case 'watchlist_3_sectors': {
          const sectors = new Set(
            watchlistTickers
              .map(ticker => stocks.find(s => s.ticker === ticker)?.sector)
              .filter((s): s is string => Boolean(s) && s !== 'ETF'),
          );
          shouldComplete = sectors.size >= 3;
          break;
        }
        case 'first_buy': {
          shouldComplete = holdings.length >= 1;
          break;
        }
        case 'portfolio_3_holdings': {
          shouldComplete = holdings.length >= 3;
          break;
        }
        case 'portfolio_3_sectors': {
          const sectors = new Set(
            holdings
              .map(h => stocks.find(s => s.ticker === h.ticker)?.sector)
              .filter((s): s is string => Boolean(s) && s !== 'ETF'),
          );
          shouldComplete = sectors.size >= 3;
          break;
        }
        case 'hold_dividend_7days': {
          shouldComplete = holdings.some(h => {
            const stock = stocks.find(s => s.ticker === h.ticker);
            const hasDividend = (stock?.fundamentals?.dividendYield ?? 0) > 0;
            const ageMs = Date.now() - new Date(h.createdAt).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            return hasDividend && ageDays >= 7;
          });
          break;
        }
      }

      if (shouldComplete) {
        completingRef.current.add(task.id);
        completeTask(task.id).finally(() => completingRef.current.delete(task.id));
      }
    }
  }, [plan, tasks, holdings.length, watchlistTickers.length, stocks]);

  return (
    <PlanContext.Provider value={{
      plan,
      tasks,
      messages,
      planLoading,
      chatLoading,
      onboardingStep,
      onboardingAnswers,
      sendMessage,
      selectQuickReply,
      completeTask,
      createNewPlan,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
