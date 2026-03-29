export interface Flashcard {
  term: string;
  definition: string;
  example?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  description: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export type Mode = 'overview' | 'flashcards' | 'quiz';

export const topics: Topic[] = [
  {
    id: 'pe_ratio',
    title: 'P/E Ratio',
    icon: '📊',
    description: 'Learn about Price-to-Earnings ratio and how to evaluate stock value',
    flashcards: [
      {
        term: 'P/E Ratio',
        definition: 'Price-to-Earnings ratio compares a company\'s stock price to its earnings per share',
        example: 'If a stock costs $50 and earns $5 per share, P/E = 10',
      },
      {
        term: 'High P/E',
        definition: 'Indicates investors expect high growth in the future',
        example: 'Tech companies often have high P/E ratios (30+)',
      },
      {
        term: 'Low P/E',
        definition: 'May indicate undervalued stock or lower growth expectations',
        example: 'Value stocks often have low P/E ratios (5-15)',
      },
    ],
    quiz: [
      {
        question: 'What does P/E ratio measure?',
        options: [
          'Company revenue',
          'Stock price relative to earnings',
          'Total market value',
          'Dividend yield',
        ],
        correctAnswer: 1,
        explanation: 'P/E ratio measures how much investors pay for each dollar of earnings',
      },
      {
        question: 'A high P/E ratio typically suggests:',
        options: [
          'The company is losing money',
          'High growth expectations',
          'The stock is undervalued',
          'Low investor confidence',
        ],
        correctAnswer: 1,
        explanation: 'High P/E ratios often indicate investors expect strong future growth',
      },
      {
        question: 'If a stock is $100 and EPS is $5, what is the P/E ratio?',
        options: ['5', '10', '20', '25'],
        correctAnswer: 2,
        explanation: 'P/E = Price / EPS = $100 / $5 = 20',
      },
    ],
  },
  {
    id: 'market_cap',
    title: 'Market Cap',
    icon: '💰',
    description: 'Understand market capitalization and company size classification',
    flashcards: [
      {
        term: 'Market Cap',
        definition: 'Total value of a company\'s outstanding shares',
        example: 'Calculated by: Share Price × Total Shares',
      },
      {
        term: 'Large Cap',
        definition: 'Companies valued at $10 billion or more',
        example: 'Apple, Microsoft, Amazon are large-cap stocks',
      },
      {
        term: 'Small Cap',
        definition: 'Companies valued between $300M and $2B',
        example: 'Higher growth potential but more volatile',
      },
    ],
    quiz: [
      {
        question: 'How is market cap calculated?',
        options: [
          'Total revenue × P/E ratio',
          'Share price × outstanding shares',
          'Assets - liabilities',
          'Annual profit × 10',
        ],
        correctAnswer: 1,
        explanation: 'Market Cap = Current Share Price × Total Outstanding Shares',
      },
      {
        question: 'Large-cap companies are valued at:',
        options: ['$1B+', '$5B+', '$10B+', '$100B+'],
        correctAnswer: 2,
        explanation: 'Large-cap companies have market capitalizations of $10 billion or more',
      },
      {
        question: 'Which typically offers more growth potential but higher risk?',
        options: ['Large-cap', 'Mid-cap', 'Small-cap', 'Mega-cap'],
        correctAnswer: 2,
        explanation: 'Small-cap stocks often have more room to grow but come with higher volatility',
      },
    ],
  },
  {
    id: 'dividends',
    title: 'Dividends',
    icon: '💵',
    description: 'Discover how companies share profits with shareholders',
    flashcards: [
      {
        term: 'Dividend',
        definition: 'Cash payment distributed to shareholders from company profits',
        example: 'If you own 100 shares paying $1 dividend, you get $100',
      },
      {
        term: 'Dividend Yield',
        definition: 'Annual dividend per share divided by stock price',
        example: '$4 dividend ÷ $100 stock price = 4% yield',
      },
      {
        term: 'Dividend Growth',
        definition: 'Companies that consistently increase dividend payments',
        example: 'Dividend Aristocrats have raised dividends for 25+ years',
      },
    ],
    quiz: [
      {
        question: 'What is a dividend?',
        options: [
          'A stock split',
          'A loan to the company',
          'Cash paid to shareholders',
          'A type of bond',
        ],
        correctAnswer: 2,
        explanation: 'Dividends are cash payments companies make to shareholders from profits',
      },
      {
        question: 'If a stock costs $50 and pays $2 annual dividend, what\'s the yield?',
        options: ['2%', '4%', '25%', '8%'],
        correctAnswer: 1,
        explanation: 'Dividend Yield = ($2 / $50) × 100 = 4%',
      },
      {
        question: 'Which type of company typically pays higher dividends?',
        options: [
          'Young startups',
          'Growth tech companies',
          'Mature, established companies',
          'Bankrupt companies',
        ],
        correctAnswer: 2,
        explanation: 'Mature companies with stable profits often pay higher dividends',
      },
    ],
  },
  {
    id: 'bull_bear',
    title: 'Bull vs Bear Markets',
    icon: '🐂',
    description: 'Learn about market trends and investor sentiment',
    flashcards: [
      {
        term: 'Bull Market',
        definition: 'Period of rising stock prices and optimistic sentiment',
        example: 'Markets rise 20%+ from recent lows',
      },
      {
        term: 'Bear Market',
        definition: 'Period of declining prices and pessimistic sentiment',
        example: 'Markets fall 20%+ from recent highs',
      },
      {
        term: 'Market Correction',
        definition: 'A decline of 10-20% from recent highs',
        example: 'Normal healthy pullback in an uptrend',
      },
    ],
    quiz: [
      {
        question: 'A bull market is characterized by:',
        options: [
          'Falling prices',
          'Rising prices',
          'Stable prices',
          'Random volatility',
        ],
        correctAnswer: 1,
        explanation: 'Bull markets feature sustained increases in stock prices',
      },
      {
        question: 'How much must markets fall to be considered a bear market?',
        options: ['10%', '15%', '20%', '30%'],
        correctAnswer: 2,
        explanation: 'A bear market is typically defined as a 20%+ decline from recent highs',
      },
      {
        question: 'What\'s a market correction?',
        options: [
          'A 5% decline',
          'A 10-20% decline',
          'A 25%+ decline',
          'Any price increase',
        ],
        correctAnswer: 1,
        explanation: 'A correction is a decline of 10-20%, often seen as healthy in bull markets',
      },
    ],
  },
  {
    id: 'risk_reward',
    title: 'Risk & Reward',
    icon: '⚖️',
    description: 'Understand the relationship between risk and potential returns',
    flashcards: [
      {
        term: 'Risk Tolerance',
        definition: 'How much uncertainty an investor can handle',
        example: 'Conservative investors prefer low-risk bonds',
      },
      {
        term: 'Volatility',
        definition: 'How much a stock\'s price fluctuates',
        example: 'Tech stocks often have high volatility',
      },
      {
        term: 'Diversification',
        definition: 'Spreading investments across different assets',
        example: '"Don\'t put all your eggs in one basket"',
      },
    ],
    quiz: [
      {
        question: 'Higher risk investments typically offer:',
        options: [
          'Lower potential returns',
          'Higher potential returns',
          'Guaranteed returns',
          'No returns',
        ],
        correctAnswer: 1,
        explanation: 'Higher risk investments generally offer higher potential returns to compensate',
      },
      {
        question: 'What is diversification?',
        options: [
          'Investing in one stock',
          'Spreading investments across assets',
          'Only buying tech stocks',
          'Avoiding the stock market',
        ],
        correctAnswer: 1,
        explanation: 'Diversification reduces risk by spreading investments across different assets',
      },
      {
        question: 'Volatility measures:',
        options: [
          'Company profit',
          'Price fluctuation',
          'Dividend payments',
          'Market cap',
        ],
        correctAnswer: 1,
        explanation: 'Volatility measures how much a stock\'s price moves up and down',
      },
    ],
  },
];
