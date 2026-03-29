import { useState } from 'react';
import { BookOpen, Award, ChevronRight, TrendingUp, CheckCircle2, Circle, ArrowLeft, X, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGamification } from '../contexts/GamificationContext';

interface Topic {
  id: string;
  title: string;
  icon: string;
  description: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

interface Flashcard {
  term: string;
  definition: string;
  example?: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const topics: Topic[] = [
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

type Mode = 'overview' | 'flashcards' | 'quiz';

export function LearnPage() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [mode, setMode] = useState<Mode>('overview');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { data, completeLesson } = useGamification();

  const resetLesson = () => {
    setSelectedTopic(null);
    setMode('overview');
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setQuizAnswers([]);
    setShowResults(false);
  };

  const handleFlashcardComplete = () => {
    setMode('quiz');
    setCurrentCardIndex(0);
    setQuizAnswers(new Array(selectedTopic!.quiz.length).fill(null));
  };

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[currentCardIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const handleQuizComplete = () => {
    if (!selectedTopic) return;
    
    const correctCount = quizAnswers.filter(
      (answer, index) => answer === selectedTopic.quiz[index].correctAnswer
    ).length;
    
    const score = Math.round((correctCount / selectedTopic.quiz.length) * 100);
    completeLesson(selectedTopic.id, score);
    setShowResults(true);
  };

  const getTopicProgress = (topicId: string) => {
    return data.lessonProgress.find(p => p.topicId === topicId);
  };

  // Overview mode
  if (mode === 'overview' && !selectedTopic) {
    return (
      <div className="px-3 sm:px-4 py-3 sm:py-4 pb-6">
        {/* Header with mascot */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Learn</h1>
              <p className="text-slate-400 text-sm sm:text-base">Master stock market basics</p>
            </div>
            {/* AI Mascot */}
            <motion.div
              animate={{ 
                y: [0, -8, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2C3863] to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30"
            >
              🦉
            </motion.div>
          </div>

          {/* Friendly tip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-4"
          >
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Hey there, investor! 🎓</p>
                <p className="text-purple-200/80 text-xs leading-relaxed">
                  Complete lessons to earn XP and unlock achievements. Each topic has flashcards and a quiz!
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Progress Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-xs">Completed</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {data.lessonProgress.filter(p => p.completed).length}/{topics.length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-warning" />
              <span className="text-slate-400 text-xs">Avg Score</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {data.lessonProgress.length > 0
                ? Math.round(
                    data.lessonProgress.reduce((sum, p) => sum + (p.score || 0), 0) /
                      data.lessonProgress.length
                  )
                : 0}%
            </div>
          </div>
        </motion.div>

        {/* Topic Cards */}
        <div className="space-y-3">
          {topics.map((topic, index) => {
            const progress = getTopicProgress(topic.id);
            return (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedTopic(topic);
                  setMode('flashcards');
                }}
                className="w-full bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2C3863] to-[#1f2847] flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
                    {topic.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{topic.title}</h3>
                      {progress?.completed && (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mb-2">{topic.description}</p>
                    {progress?.completed && (
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-green-400 font-medium">
                          Score: {progress.score}%
                        </div>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Flashcards mode
  if (mode === 'flashcards' && selectedTopic) {
    const currentCard = selectedTopic.flashcards[currentCardIndex];
    const isLastCard = currentCardIndex === selectedTopic.flashcards.length - 1;

    return (
      <div className="px-3 sm:px-4 py-3 sm:py-4 min-h-[calc(100vh-160px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={resetLesson}
            className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center hover:bg-slate-700/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{selectedTopic.title}</h2>
            <p className="text-slate-400 text-xs">
              Flashcard {currentCardIndex + 1} of {selectedTopic.flashcards.length}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-800 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#2C3863] to-purple-500"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentCardIndex + 1) / selectedTopic.flashcards.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Flashcard */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <motion.div
            key={currentCardIndex}
            initial={{ opacity: 0, rotateY: isFlipped ? 180 : 0 }}
            animate={{ opacity: 1, rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-sm aspect-[3/4] cursor-pointer perspective-1000"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full h-full"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                transition: 'transform 0.6s',
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-[#2C3863] to-[#1f2847] rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl border border-slate-700/50"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-5xl mb-6">{selectedTopic.icon}</div>
                <h3 className="text-2xl font-bold text-white text-center mb-3">
                  {currentCard.term}
                </h3>
                <p className="text-slate-400 text-sm text-center">Tap to reveal</p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-6 flex flex-col justify-center shadow-2xl border border-purple-500/50"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <p className="text-white text-lg leading-relaxed mb-4">
                  {currentCard.definition}
                </p>
                {currentCard.example && (
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <p className="text-purple-100 text-sm font-medium mb-1">Example:</p>
                    <p className="text-purple-200 text-sm">{currentCard.example}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentCardIndex > 0 && (
            <button
              onClick={() => {
                setCurrentCardIndex(currentCardIndex - 1);
                setIsFlipped(false);
              }}
              className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl py-3 text-white font-medium transition-colors"
            >
              Previous
            </button>
          )}
          <button
            onClick={() => {
              if (isLastCard) {
                handleFlashcardComplete();
              } else {
                setCurrentCardIndex(currentCardIndex + 1);
                setIsFlipped(false);
              }
            }}
            className="flex-1 bg-gradient-to-r from-[#2C3863] to-purple-600 hover:from-[#364a7d] hover:to-purple-700 rounded-xl py-3 text-white font-medium transition-colors shadow-lg"
          >
            {isLastCard ? 'Start Quiz' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  // Quiz mode
  if (mode === 'quiz' && selectedTopic) {
    if (showResults) {
      const correctCount = quizAnswers.filter(
        (answer, index) => answer === selectedTopic.quiz[index].correctAnswer
      ).length;
      const score = Math.round((correctCount / selectedTopic.quiz.length) * 100);
      const isPerfect = score === 100;

      return (
        <div className="px-3 sm:px-4 py-3 sm:py-4 min-h-[calc(100vh-160px)] flex flex-col">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2C3863] to-purple-600 flex items-center justify-center text-5xl mb-6 shadow-2xl"
            >
              {isPerfect ? '🎉' : '⭐'}
            </motion.div>

            <h2 className="text-3xl font-bold text-white mb-2">
              {isPerfect ? 'Perfect Score!' : 'Great Job!'}
            </h2>
            <p className="text-slate-400 mb-6">
              You scored {correctCount} out of {selectedTopic.quiz.length}
            </p>

            <div className="w-32 h-32 rounded-full border-8 border-slate-800/50 flex items-center justify-center mb-8">
              <span className="text-5xl font-bold text-white">{score}%</span>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-8">
              <p className="text-green-400 font-medium mb-1">
                +{isPerfect ? 50 : 25} XP Earned!
              </p>
              <p className="text-slate-400 text-sm">
                {isPerfect ? 'Perfect score bonus!' : 'Keep learning!'}
              </p>
            </div>

            <button
              onClick={resetLesson}
              className="bg-gradient-to-r from-[#2C3863] to-purple-600 hover:from-[#364a7d] hover:to-purple-700 rounded-xl px-8 py-3 text-white font-medium transition-colors shadow-lg"
            >
              Back to Topics
            </button>
          </motion.div>
        </div>
      );
    }

    const currentQuestion = selectedTopic.quiz[currentCardIndex];
    const hasAnswered = quizAnswers[currentCardIndex] !== null;
    const isLastQuestion = currentCardIndex === selectedTopic.quiz.length - 1;

    return (
      <div className="px-3 sm:px-4 py-3 sm:py-4 min-h-[calc(100vh-160px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={resetLesson}
            className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center hover:bg-slate-700/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{selectedTopic.title} Quiz</h2>
            <p className="text-slate-400 text-xs">
              Question {currentCardIndex + 1} of {selectedTopic.quiz.length}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-slate-800 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentCardIndex + 1) / selectedTopic.quiz.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question */}
        <motion.div
          key={currentCardIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1"
        >
          <div className="bg-gradient-to-br from-[#2C3863] to-[#1f2847] rounded-2xl p-6 mb-6 shadow-xl border border-slate-700/50">
            <h3 className="text-xl text-white font-semibold leading-relaxed">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = quizAnswers[currentCardIndex] === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrectness = hasAnswered;

              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: hasAnswered ? 1 : 1.02 }}
                  whileTap={{ scale: hasAnswered ? 1 : 0.98 }}
                  onClick={() => !hasAnswered && handleQuizAnswer(index)}
                  disabled={hasAnswered}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                    showCorrectness && isCorrect
                      ? 'bg-green-500/20 border-green-500'
                      : showCorrectness && isSelected && !isCorrect
                      ? 'bg-red-500/20 border-red-500'
                      : isSelected
                      ? 'bg-[#2C3863]/50 border-[#2C3863]'
                      : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      showCorrectness && isCorrect
                        ? 'bg-green-500 border-green-500'
                        : showCorrectness && isSelected && !isCorrect
                        ? 'bg-red-500 border-red-500'
                        : isSelected
                        ? 'bg-[#2C3863] border-[#2C3863]'
                        : 'border-slate-600'
                    }`}
                  >
                    {showCorrectness && isCorrect ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : showCorrectness && isSelected && !isCorrect ? (
                      <X className="w-5 h-5 text-white" />
                    ) : isSelected ? (
                      <Circle className="w-3 h-3 fill-white" />
                    ) : null}
                  </div>
                  <span className="text-white flex-1">{option}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {hasAnswered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-6"
              >
                <p className="text-blue-100 text-sm font-medium mb-1">Explanation:</p>
                <p className="text-blue-200 text-sm">{currentQuestion.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        {hasAnswered && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              if (isLastQuestion) {
                handleQuizComplete();
              } else {
                setCurrentCardIndex(currentCardIndex + 1);
              }
            }}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl py-3 text-white font-medium transition-colors shadow-lg"
          >
            {isLastQuestion ? 'See Results' : 'Next Question'}
          </motion.button>
        )}
      </div>
    );
  }

  return null;
}