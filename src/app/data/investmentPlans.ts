export interface InvestmentGoal {
  id: string;
  title: string;
  description: string;
  icon: string;
  timeframe: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requiredXP: number;
  steps: InvestmentStep[];
}

export interface InvestmentStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  type: 'learn' | 'action' | 'trade' | 'analyze';
  xpReward: number;
  icon: string;
}

export const investmentGoals: InvestmentGoal[] = [
  {
    id: 'beginner-foundation',
    title: 'Build Your Foundation',
    description: 'Start your investing journey with the basics',
    icon: '🌱',
    timeframe: '1-2 weeks',
    difficulty: 'beginner',
    requiredXP: 0,
    steps: [
      {
        id: 'step-1',
        title: 'Complete "Understanding Stocks" lesson',
        description: 'Learn what stocks are and how they work',
        completed: false,
        type: 'learn',
        xpReward: 50,
        icon: '📚'
      },
      {
        id: 'step-2',
        title: 'Swipe through 20 stocks',
        description: 'Explore different companies and sectors',
        completed: false,
        type: 'action',
        xpReward: 25,
        icon: '👆'
      },
      {
        id: 'step-3',
        title: 'Add 5 stocks to watchlist',
        description: 'Build your first watchlist of interesting stocks',
        completed: false,
        type: 'action',
        xpReward: 30,
        icon: '⭐'
      },
      {
        id: 'step-4',
        title: 'Complete "Risk Management" lesson',
        description: 'Understand how to manage investment risk',
        completed: false,
        type: 'learn',
        xpReward: 50,
        icon: '🛡️'
      }
    ]
  },
  {
    id: 'diversification-master',
    title: 'Diversify Like a Pro',
    description: 'Build a well-balanced, diversified portfolio',
    icon: '🎯',
    timeframe: '2-3 weeks',
    difficulty: 'intermediate',
    requiredXP: 200,
    steps: [
      {
        id: 'step-1',
        title: 'Complete "Portfolio Diversification" lesson',
        description: 'Learn the importance of spreading risk',
        completed: false,
        type: 'learn',
        xpReward: 75,
        icon: '📊'
      },
      {
        id: 'step-2',
        title: 'Research 3 different sectors',
        description: 'Explore Technology, Healthcare, and Finance',
        completed: false,
        type: 'analyze',
        xpReward: 40,
        icon: '🔍'
      },
      {
        id: 'step-3',
        title: 'Add stocks from 5 different sectors',
        description: 'Build a diverse watchlist across industries',
        completed: false,
        type: 'action',
        xpReward: 50,
        icon: '🌐'
      },
      {
        id: 'step-4',
        title: 'Make your first simulated trade',
        description: 'Practice buying a diversified position',
        completed: false,
        type: 'trade',
        xpReward: 100,
        icon: '💰'
      },
      {
        id: 'step-5',
        title: 'Complete "ETFs vs Individual Stocks" lesson',
        description: 'Learn about different investment vehicles',
        completed: false,
        type: 'learn',
        xpReward: 75,
        icon: '📈'
      }
    ]
  },
  {
    id: 'value-investor',
    title: 'Value Investing Strategy',
    description: 'Master Warren Buffett\'s value investing approach',
    icon: '💎',
    timeframe: '3-4 weeks',
    difficulty: 'intermediate',
    requiredXP: 350,
    steps: [
      {
        id: 'step-1',
        title: 'Complete "Fundamental Analysis" lesson',
        description: 'Learn to evaluate company financials',
        completed: false,
        type: 'learn',
        xpReward: 100,
        icon: '📊'
      },
      {
        id: 'step-2',
        title: 'Analyze 10 undervalued stocks',
        description: 'Look for stocks with P/E ratios below market average',
        completed: false,
        type: 'analyze',
        xpReward: 60,
        icon: '🔍'
      },
      {
        id: 'step-3',
        title: 'Complete "Reading Financial Statements" lesson',
        description: 'Master balance sheets and income statements',
        completed: false,
        type: 'learn',
        xpReward: 100,
        icon: '📄'
      },
      {
        id: 'step-4',
        title: 'Create a value portfolio',
        description: 'Build a watchlist of 8-10 value stocks',
        completed: false,
        type: 'action',
        xpReward: 75,
        icon: '📋'
      },
      {
        id: 'step-5',
        title: 'Practice value trades',
        description: 'Make 3 simulated value investments',
        completed: false,
        type: 'trade',
        xpReward: 150,
        icon: '💰'
      }
    ]
  },
  {
    id: 'growth-investor',
    title: 'Growth Stock Hunter',
    description: 'Identify high-potential growth opportunities',
    icon: '🚀',
    timeframe: '3-4 weeks',
    difficulty: 'intermediate',
    requiredXP: 350,
    steps: [
      {
        id: 'step-1',
        title: 'Complete "Growth Investing" lesson',
        description: 'Learn to spot high-growth companies',
        completed: false,
        type: 'learn',
        xpReward: 100,
        icon: '📚'
      },
      {
        id: 'step-2',
        title: 'Research emerging technologies',
        description: 'Study AI, renewable energy, and biotech sectors',
        completed: false,
        type: 'analyze',
        xpReward: 60,
        icon: '🔬'
      },
      {
        id: 'step-3',
        title: 'Find 10 high-growth stocks',
        description: 'Look for stocks with strong revenue growth',
        completed: false,
        type: 'analyze',
        xpReward: 60,
        icon: '📈'
      },
      {
        id: 'step-4',
        title: 'Complete "Technical Analysis Basics" lesson',
        description: 'Learn to read charts and identify trends',
        completed: false,
        type: 'learn',
        xpReward: 100,
        icon: '📊'
      },
      {
        id: 'step-5',
        title: 'Build growth portfolio',
        description: 'Create a watchlist of promising growth stocks',
        completed: false,
        type: 'action',
        xpReward: 75,
        icon: '🎯'
      }
    ]
  },
  {
    id: 'dividend-income',
    title: 'Dividend Income Generator',
    description: 'Build a passive income stream from dividends',
    icon: '💵',
    timeframe: '2-3 weeks',
    difficulty: 'intermediate',
    requiredXP: 300,
    steps: [
      {
        id: 'step-1',
        title: 'Complete "Dividend Investing" lesson',
        description: 'Understand dividend yields and payouts',
        completed: false,
        type: 'learn',
        xpReward: 100,
        icon: '💰'
      },
      {
        id: 'step-2',
        title: 'Find 15 dividend-paying stocks',
        description: 'Research companies with consistent dividends',
        completed: false,
        type: 'analyze',
        xpReward: 50,
        icon: '🔍'
      },
      {
        id: 'step-3',
        title: 'Complete "Dividend Aristocrats" lesson',
        description: 'Learn about companies with 25+ years of dividend growth',
        completed: false,
        type: 'learn',
        xpReward: 75,
        icon: '👑'
      },
      {
        id: 'step-4',
        title: 'Create dividend portfolio',
        description: 'Build a watchlist focused on income generation',
        completed: false,
        type: 'action',
        xpReward: 75,
        icon: '📋'
      },
      {
        id: 'step-5',
        title: 'Make dividend trades',
        description: 'Practice investing in dividend stocks',
        completed: false,
        type: 'trade',
        xpReward: 150,
        icon: '💸'
      }
    ]
  },
  {
    id: 'advanced-trader',
    title: 'Advanced Trading Mastery',
    description: 'Master advanced trading strategies and techniques',
    icon: '⚡',
    timeframe: '4-6 weeks',
    difficulty: 'advanced',
    requiredXP: 600,
    steps: [
      {
        id: 'step-1',
        title: 'Complete "Advanced Technical Analysis" lesson',
        description: 'Master indicators, patterns, and chart analysis',
        completed: false,
        type: 'learn',
        xpReward: 150,
        icon: '📈'
      },
      {
        id: 'step-2',
        title: 'Complete "Options Trading Basics" lesson',
        description: 'Learn about calls, puts, and options strategies',
        completed: false,
        type: 'learn',
        xpReward: 150,
        icon: '📊'
      },
      {
        id: 'step-3',
        title: 'Analyze market trends',
        description: 'Study sector rotations and market cycles',
        completed: false,
        type: 'analyze',
        xpReward: 100,
        icon: '🔍'
      },
      {
        id: 'step-4',
        title: 'Complete "Portfolio Rebalancing" lesson',
        description: 'Learn to maintain optimal portfolio allocation',
        completed: false,
        type: 'learn',
        xpReward: 150,
        icon: '⚖️'
      },
      {
        id: 'step-5',
        title: 'Execute advanced strategies',
        description: 'Practice swing trading and momentum strategies',
        completed: false,
        type: 'trade',
        xpReward: 200,
        icon: '🎯'
      },
      {
        id: 'step-6',
        title: 'Build multi-strategy portfolio',
        description: 'Combine value, growth, and income strategies',
        completed: false,
        type: 'action',
        xpReward: 150,
        icon: '🏆'
      }
    ]
  }
];

export const aiRecommendations = {
  beginner: {
    message: "Perfect! Let's start with the fundamentals. I recommend beginning with 'Build Your Foundation' - it's designed for new investors like you.",
    emoji: '🌱',
    tips: [
      'Start small and focus on learning',
      'Don\'t rush - understanding basics is crucial',
      'Use the swipe feature to explore different companies'
    ]
  },
  intermediate: {
    message: "You've got the basics down! Now it's time to develop a specific investing strategy. Choose a path that aligns with your goals.",
    emoji: '🎯',
    tips: [
      'Consider your risk tolerance and time horizon',
      'Diversification is key to long-term success',
      'Practice with simulated trades before real investments'
    ]
  },
  advanced: {
    message: "Impressive progress! You're ready for advanced strategies. Time to refine your approach and maximize returns.",
    emoji: '⚡',
    tips: [
      'Master technical and fundamental analysis',
      'Learn advanced portfolio management techniques',
      'Stay updated on market trends and economic indicators'
    ]
  }
};
