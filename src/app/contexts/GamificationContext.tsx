import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { investmentGoals } from '../data/investmentPlans';

// Import notification helper
let showNotification: ((notification: { type: 'xp' | 'achievement' | 'levelup'; message: string; icon?: string }) => void) | null = null;

export const setShowNotification = (fn: typeof showNotification) => {
  showNotification = fn;
};

// Notification queue to avoid setState during render
let notificationQueue: Array<{ type: 'xp' | 'achievement' | 'levelup'; message: string; icon?: string }> = [];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  xpReward: number;
}

export interface LessonProgress {
  topicId: string;
  completed: boolean;
  score?: number;
  completedAt?: Date;
}

export interface GamificationData {
  xp: number;
  level: number;
  achievements: Achievement[];
  streak: number;
  lastLoginDate: string | null;
  totalSwipes: number;
  lessonProgress: LessonProgress[];
}

interface GamificationContextType {
  data: GamificationData;
  addXP: (amount: number, reason?: string) => void;
  unlockAchievement: (achievementId: string) => void;
  updateStreak: () => void;
  incrementSwipes: () => void;
  completeLesson: (topicId: string, score: number) => void;
  completeStep: (planId: string, stepId: string, xpReward: number) => void;
  getLevel: () => number;
  getXPForNextLevel: () => number;
  getCurrentLevelXP: () => number;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// XP required for each level (exponential growth)
const getXPRequiredForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Calculate total XP needed to reach a specific level
const getTotalXPForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPRequiredForLevel(i);
  }
  return total;
};

// Default achievements
const defaultAchievements: Achievement[] = [
  {
    id: 'first_stock',
    title: 'First Stock',
    description: 'Added your first stock to watchlist',
    icon: '🎯',
    unlocked: false,
    xpReward: 100,
  },
  {
    id: 'swipe_master_50',
    title: 'Swipe Master',
    description: 'Swiped on 50 stocks',
    icon: '👆',
    unlocked: false,
    xpReward: 150,
  },
  {
    id: 'swipe_master_100',
    title: 'Swipe Legend',
    description: 'Swiped on 100 stocks',
    icon: '🔥',
    unlocked: false,
    xpReward: 300,
  },
  {
    id: 'streak_7',
    title: '7-Day Streak',
    description: 'Logged in for 7 days in a row',
    icon: '⚡',
    unlocked: false,
    xpReward: 200,
  },
  {
    id: 'streak_30',
    title: '30-Day Streak',
    description: 'Logged in for 30 days in a row',
    icon: '💎',
    unlocked: false,
    xpReward: 500,
  },
  {
    id: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    description: 'Completed 5 lessons',
    icon: '📚',
    unlocked: false,
    xpReward: 250,
  },
  {
    id: 'quiz_master',
    title: 'Quiz Master',
    description: 'Got 100% on 3 quizzes',
    icon: '🎓',
    unlocked: false,
    xpReward: 300,
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Started your learning journey',
    icon: '🌅',
    unlocked: false,
    xpReward: 50,
  },
];

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GamificationData>(() => {
    // Load from localStorage
    const stored = localStorage.getItem('stockr_gamification');
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      xp: 0,
      level: 1,
      achievements: defaultAchievements,
      streak: 0,
      lastLoginDate: null,
      totalSwipes: 0,
      lessonProgress: [],
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('stockr_gamification', JSON.stringify(data));
  }, [data]);

  // Process notification queue after state updates
  useEffect(() => {
    if (notificationQueue.length > 0 && showNotification) {
      // Process all queued notifications
      notificationQueue.forEach(notification => {
        showNotification(notification);
      });
      // Clear the queue
      notificationQueue = [];
    }
  }, [data.xp, data.level, data.achievements]);

  // Update streak on mount
  useEffect(() => {
    updateStreak();
  }, []);

  const calculateLevel = (xp: number): number => {
    let level = 1;
    let totalXP = 0;
    while (totalXP + getXPRequiredForLevel(level) <= xp) {
      totalXP += getXPRequiredForLevel(level);
      level++;
    }
    return level;
  };

  const addXP = (amount: number, reason?: string) => {
    setData(prev => {
      const newXP = prev.xp + amount;
      const newLevel = calculateLevel(newXP);
      
      // Queue notification if level up
      if (newLevel > prev.level) {
        console.log(`🎉 Level Up! You are now level ${newLevel}`);
        notificationQueue.push({
          type: 'levelup',
          message: `Level Up! You're now level ${newLevel}!`,
        });
      }
      
      if (reason) {
        console.log(`+${amount} XP: ${reason}`);
      }
      
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
      };
    });
  };

  const unlockAchievement = (achievementId: string) => {
    setData(prev => {
      const achievement = prev.achievements.find(a => a.id === achievementId);
      if (!achievement || achievement.unlocked) {
        return prev;
      }

      const updatedAchievements = prev.achievements.map(a =>
        a.id === achievementId
          ? { ...a, unlocked: true, unlockedAt: new Date() }
          : a
      );

      // Add XP reward
      const newXP = prev.xp + achievement.xpReward;
      const newLevel = calculateLevel(newXP);

      console.log(`🏆 Achievement Unlocked: ${achievement.title} (+${achievement.xpReward} XP)`);
      
      // Queue notification
      notificationQueue.push({
        type: 'achievement',
        message: `Achievement: ${achievement.title}!`,
        icon: achievement.icon,
      });

      return {
        ...prev,
        achievements: updatedAchievements,
        xp: newXP,
        level: newLevel,
      };
    });
  };

  const updateStreak = () => {
    setData(prev => {
      const today = new Date().toDateString();
      const lastLogin = prev.lastLoginDate;

      if (lastLogin === today) {
        // Already logged in today
        return prev;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      let newStreak = prev.streak;

      if (lastLogin === yesterdayStr) {
        // Consecutive day
        newStreak = prev.streak + 1;
      } else if (lastLogin === null) {
        // First login ever
        newStreak = 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      console.log(`🔥 Daily login! Streak: ${newStreak} days`);

      return {
        ...prev,
        streak: newStreak,
        lastLoginDate: today,
      };
    });

    // Check streak achievements
    setTimeout(() => {
      setData(prev => {
        let updated = { ...prev };
        
        if (prev.streak >= 7 && !prev.achievements.find(a => a.id === 'streak_7')?.unlocked) {
          const achievement = prev.achievements.find(a => a.id === 'streak_7');
          if (achievement) {
            unlockAchievement('streak_7');
          }
        }
        
        if (prev.streak >= 30 && !prev.achievements.find(a => a.id === 'streak_30')?.unlocked) {
          const achievement = prev.achievements.find(a => a.id === 'streak_30');
          if (achievement) {
            unlockAchievement('streak_30');
          }
        }
        
        return updated;
      });
    }, 100);
  };

  const incrementSwipes = () => {
    setData(prev => {
      const newTotal = prev.totalSwipes + 1;
      
      // Check swipe achievements
      setTimeout(() => {
        if (newTotal >= 50 && !prev.achievements.find(a => a.id === 'swipe_master_50')?.unlocked) {
          unlockAchievement('swipe_master_50');
        }
        if (newTotal >= 100 && !prev.achievements.find(a => a.id === 'swipe_master_100')?.unlocked) {
          unlockAchievement('swipe_master_100');
        }
      }, 100);
      
      return {
        ...prev,
        totalSwipes: newTotal,
      };
    });
  };

  const completeLesson = (topicId: string, score: number) => {
    setData(prev => {
      // Check if already completed
      const existingProgress = prev.lessonProgress.find(p => p.topicId === topicId);
      
      let updatedProgress: LessonProgress[];
      if (existingProgress) {
        // Update existing progress
        updatedProgress = prev.lessonProgress.map(p =>
          p.topicId === topicId
            ? { ...p, score, completedAt: new Date() }
            : p
        );
      } else {
        // Add new progress
        updatedProgress = [
          ...prev.lessonProgress,
          {
            topicId,
            completed: true,
            score,
            completedAt: new Date(),
          },
        ];
      }

      // Award XP for completion
      const xpAmount = score === 100 ? 50 : 25; // Bonus for perfect score
      addXP(xpAmount, `Completed lesson: ${topicId}`);

      // Check learning achievements
      const completedCount = updatedProgress.filter(p => p.completed).length;
      const perfectScores = updatedProgress.filter(p => p.score === 100).length;

      setTimeout(() => {
        if (completedCount >= 1 && !prev.achievements.find(a => a.id === 'early_bird')?.unlocked) {
          unlockAchievement('early_bird');
        }
        if (completedCount >= 5 && !prev.achievements.find(a => a.id === 'knowledge_seeker')?.unlocked) {
          unlockAchievement('knowledge_seeker');
        }
        if (perfectScores >= 3 && !prev.achievements.find(a => a.id === 'quiz_master')?.unlocked) {
          unlockAchievement('quiz_master');
        }
      }, 100);

      return {
        ...prev,
        lessonProgress: updatedProgress,
      };
    });
  };

  const completeStep = (planId: string, stepId: string, xpReward: number) => {
    // Award XP for completing a step
    addXP(xpReward, `Completed step in plan ${planId}`);
    
    // Update the step completion in the investmentGoals data
    // This is a temporary solution - in a real app, this would be stored in a database
    const plan = investmentGoals.find(p => p.id === planId);
    if (plan) {
      const step = plan.steps.find(s => s.id === stepId);
      if (step) {
        step.completed = true;
      }
    }
  };

  const getLevel = () => data.level;

  const getXPForNextLevel = (): number => {
    return getXPRequiredForLevel(data.level);
  };

  const getCurrentLevelXP = (): number => {
    const totalXPForCurrentLevel = getTotalXPForLevel(data.level);
    return data.xp - totalXPForCurrentLevel;
  };

  return (
    <GamificationContext.Provider
      value={{
        data,
        addXP,
        unlockAchievement,
        updateStreak,
        incrementSwipes,
        completeLesson,
        completeStep,
        getLevel,
        getXPForNextLevel,
        getCurrentLevelXP,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}