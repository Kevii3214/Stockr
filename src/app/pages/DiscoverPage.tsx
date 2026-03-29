import { useState, useMemo } from 'react';
import { TrendingUp, X, Heart, RotateCcw, Wallet, ChevronUp } from 'lucide-react';
import { StockCard } from '../components/StockCard';
import { SwipeableCard } from '../components/SwipeableCard';
import { StockDetailModal } from '../components/StockDetailModal';
import { mockStocks, Stock } from '../data/mockStocks';
import { motion, AnimatePresence } from 'motion/react';
import { useGamification } from '../contexts/GamificationContext';

interface DiscoverPageProps {
  watchlist: Stock[];
  passed: Stock[];
  onAddToWatchlist: (stock: Stock) => void;
  onAddToPassed: (stock: Stock) => void;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function DiscoverPage({ watchlist, passed, onAddToWatchlist, onAddToPassed }: DiscoverPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailModalStock, setDetailModalStock] = useState<Stock | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const { addXP, incrementSwipes, unlockAchievement, data } = useGamification();

  // Randomize the order of stocks once on component mount
  const randomizedStocks = useMemo(() => shuffleArray(mockStocks), []);

  const currentStock = randomizedStocks[currentIndex];
  const isComplete = currentIndex >= randomizedStocks.length;

  // Calculate button animations based on drag position
  const passButtonScale = 1 + Math.max(0, -dragX) / 200; // Grows when dragging left
  const likeButtonScale = 1 + Math.max(0, dragX) / 200; // Grows when dragging right
  const passButtonGlow = Math.max(0, -dragX) / 150;
  const likeButtonGlow = Math.max(0, dragX) / 150;

  const handleDragUpdate = (x: number, y: number) => {
    setDragX(x);
    setDragY(y);
  };

  const handleSwipeLeft = () => {
    if (currentStock) {
      onAddToPassed(currentStock);
      // Award XP for swipe
      addXP(10, 'Swiped on a stock');
      incrementSwipes();
    }
  };

  const handleSwipeRight = () => {
    if (currentStock) {
      onAddToWatchlist(currentStock);
      // Award XP for swipe
      addXP(10, 'Swiped on a stock');
      incrementSwipes();
      
      // Check if this is the first stock added to watchlist
      if (watchlist.length === 0 && !data.achievements.find(a => a.id === 'first_stock')?.unlocked) {
        unlockAchievement('first_stock');
      }
    }
  };

  const handleSwipeUp = () => {
    if (currentStock) {
      setDetailModalStock(currentStock);
    }
  };

  const handleSwipeComplete = () => {
    setCurrentIndex(prev => prev + 1);
    setDragX(0);
    setDragY(0);
  };

  const handlePassClick = () => {
    handleSwipeLeft();
    handleSwipeComplete();
  };

  const handleLikeClick = () => {
    handleSwipeRight();
    handleSwipeComplete();
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Remove last item from watchlist or passed
      const lastStock = randomizedStocks[currentIndex - 1];
      // This is simplified - in a real app you'd track which list it came from
    }
  };

  return (
    <div className="flex flex-col items-center px-3 sm:px-4 py-3 sm:py-4">
      {/* Card Stack - Dynamic height based on viewport */}
      <div 
        className="relative w-full" 
        style={{ 
          height: 'calc(100dvh - 200px)',
          maxHeight: '650px',
          minHeight: '400px'
        }}
      >
        {isComplete ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/50 rounded-3xl backdrop-blur-xl border border-slate-700/50 p-6"
          >
            <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">All Done!</h2>
            <p className="text-slate-400 mb-6 text-center text-sm sm:text-base">
              You've reviewed all stocks
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-700 transition-colors font-medium cursor-pointer min-h-[48px]"
            >
              Start Over
            </button>
          </motion.div>
        ) : (
          <>
            {/* Background cards for depth effect with smooth transitions */}
            <AnimatePresence>
              {randomizedStocks[currentIndex + 1] && (
                <motion.div
                  key={`card-${currentIndex + 1}`}
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 0.95, y: 10, opacity: 0.5 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="absolute inset-0 bg-slate-800/30 rounded-3xl pointer-events-none backdrop-blur-sm border border-slate-700/30"
                  style={{ zIndex: 0 }}
                />
              )}
              {randomizedStocks[currentIndex + 2] && (
                <motion.div
                  key={`card-${currentIndex + 2}`}
                  initial={{ scale: 0.85, y: 30, opacity: 0 }}
                  animate={{ scale: 0.9, y: 20, opacity: 0.3 }}
                  exit={{ scale: 0.85, y: 30, opacity: 0 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="absolute inset-0 bg-slate-800/20 rounded-3xl pointer-events-none backdrop-blur-sm border border-slate-700/20"
                  style={{ zIndex: -1 }}
                />
              )}
            </AnimatePresence>
            
            {/* Current card */}
            <AnimatePresence mode="wait">
              {currentStock && (
                <SwipeableCard
                  key={`swipe-${currentIndex}`}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onSwipeUp={handleSwipeUp}
                  onSwipeComplete={handleSwipeComplete}
                  onDragUpdate={handleDragUpdate}
                >
                  <StockCard stock={currentStock} />
                </SwipeableCard>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Action Buttons - Responsive sizing */}
      {!isComplete && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 sm:gap-6 mt-4 sm:mt-6"
        >
          <motion.button
            onClick={handlePassClick}
            animate={{
              scale: passButtonScale,
              boxShadow: `0 0 ${20 + passButtonGlow * 30}px rgba(239, 68, 68, ${0.5 + passButtonGlow})`
            }}
            whileHover={{ scale: Math.max(passButtonScale, 1.1) }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 border-2 border-red-500 flex items-center justify-center cursor-pointer relative overflow-hidden group"
            aria-label="Pass"
          >
            <motion.div 
              animate={{ opacity: passButtonGlow }}
              className="absolute inset-0 bg-red-500/20 rounded-full"
            />
            <motion.div
              animate={{ rotate: passButtonGlow * 90 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <X className="w-7 h-7 sm:w-8 sm:h-8 text-red-500 relative z-10" />
            </motion.div>
          </motion.button>
          
          <motion.button
            onClick={handleUndo}
            disabled={currentIndex === 0}
            whileHover={{ scale: currentIndex === 0 ? 1 : 1.1 }}
            whileTap={{ scale: currentIndex === 0 ? 1 : 0.95 }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-700 hover:bg-slate-600 active:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 cursor-pointer hover:shadow-lg disabled:hover:scale-100 relative overflow-hidden group"
            aria-label="Undo"
          >
            <div className="absolute inset-0 bg-slate-500/0 group-hover:bg-slate-500/20 transition-all duration-300 rounded-full" />
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 relative z-10 transition-transform duration-300 group-hover:-rotate-180" />
          </motion.button>
          
          <motion.button
            onClick={handleLikeClick}
            animate={{
              scale: likeButtonScale,
              boxShadow: `0 0 ${20 + likeButtonGlow * 30}px rgba(34, 197, 94, ${0.5 + likeButtonGlow})`
            }}
            whileHover={{ scale: Math.max(likeButtonScale, 1.1) }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/30 hover:bg-green-500/40 active:bg-green-500/50 border-2 border-green-500 flex items-center justify-center cursor-pointer relative overflow-hidden group"
            aria-label="Add to watchlist"
          >
            <motion.div 
              animate={{ opacity: likeButtonGlow }}
              className="absolute inset-0 bg-green-500/20 rounded-full"
            />
            <motion.div
              animate={{ scale: 1 + likeButtonGlow * 0.2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-green-500 relative z-10" />
            </motion.div>
          </motion.button>
        </motion.div>
      )}

      {/* Progress */}
      {!isComplete && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 sm:mt-4 text-center"
        >
          <p className="text-slate-400 text-xs sm:text-sm">
            {currentIndex + 1} / {randomizedStocks.length}
          </p>
        </motion.div>
      )}

      {/* Stock Detail Modal */}
      <StockDetailModal
        stock={detailModalStock || randomizedStocks[0]}
        isOpen={!!detailModalStock}
        onClose={() => setDetailModalStock(null)}
      />
    </div>
  );
}