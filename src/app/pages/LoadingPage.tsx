import { useEffect } from 'react';
import { motion } from 'motion/react';
import basketMascot from '../../assets/cb8ffba2d07206d23ccab0368bab9721827c20ae.png';

interface LoadingPageProps {
  onLoadingComplete: () => void;
}

export function LoadingPage({ onLoadingComplete }: LoadingPageProps) {
  useEffect(() => {
    // Auto-complete loading after 3 seconds
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C3863] via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Pulsing gradient orbs - more subtle */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* App Name */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12"
        >
          <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight">
            Stockr
          </h1>
        </motion.div>

        {/* Mascot Character */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            delay: 0.2,
            type: "spring",
            bounce: 0.3
          }}
          className="relative mb-12"
        >
          {/* Subtle glow effect behind mascot */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-2xl"
          />
          
          {/* Mascot with subtle animation */}
          <motion.img
            src={basketMascot}
            alt="Stockr Mascot"
            className="relative w-40 h-40 md:w-48 md:h-48 object-contain drop-shadow-2xl"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mb-12"
        >
          <p className="text-slate-400 text-lg">
            Your investing journey starts here
          </p>
        </motion.div>

        {/* Loading Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-full max-w-xs"
        >
          <div className="relative h-1.5 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ 
                duration: 2.5,
                ease: "easeInOut",
                delay: 0.3
              }}
              className="h-full bg-gradient-to-r from-[#2C3863] via-purple-600 to-[#2C3863] rounded-full"
            />
          </div>
        </motion.div>

        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          whileHover={{ opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 1 }}
          onClick={onLoadingComplete}
          className="mt-12 px-6 py-2 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
        >
          Skip
        </motion.button>
      </div>
    </div>
  );
}