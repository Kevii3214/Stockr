import { useEffect } from 'react';
import { motion } from 'motion/react';

interface LogoLoadingPageProps {
  onLoadingComplete: () => void;
}

export function LogoLoadingPage({ onLoadingComplete }: LogoLoadingPageProps) {
  useEffect(() => {
    // Auto-complete loading after 1.5 seconds
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C3863] via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Subtle pulsing gradient orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </motion.div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.5,
            type: "spring",
            bounce: 0.3
          }}
        >
          <h1 className="text-7xl md:text-8xl font-black text-white tracking-tight">
            Stockr
          </h1>
          
          {/* Animated underline */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-1.5 bg-gradient-to-r from-[#2C3863] via-purple-600 to-[#2C3863] rounded-full mt-3"
          />
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-2 mt-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0,
            }}
            className="w-2.5 h-2.5 bg-purple-400 rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
            className="w-2.5 h-2.5 bg-pink-400 rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
            className="w-2.5 h-2.5 bg-purple-400 rounded-full"
          />
        </motion.div>
      </div>
    </div>
  );
}