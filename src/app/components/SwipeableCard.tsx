import { motion, useMotionValue, useTransform, PanInfo, useAnimation } from 'motion/react';
import { ReactNode, useState } from 'react';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onSwipeComplete: () => void;
  onDragUpdate?: (x: number, y: number) => void;
}

export function SwipeableCard({ children, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeComplete, onDragUpdate }: SwipeableCardProps) {
  const [exitX, setExitX] = useState(0);
  const [exitY, setExitY] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();
  
  // More dynamic rotation based on drag distance
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  
  // Smooth opacity fade on extreme swipes
  const opacity = useTransform(
    x, 
    [-250, -150, 0, 150, 250], 
    [0.3, 1, 1, 1, 0.3]
  );
  
  // Scale effect - card gets slightly smaller as you drag it
  const scale = useTransform(
    x,
    [-250, 0, 250],
    [0.95, 1, 0.95]
  );

  // Overlay indicators for swipe direction
  const passOpacity = useTransform(x, [-150, 0], [1, 0]);
  const likeOpacity = useTransform(x, [0, 150], [0, 1]);
  const passScale = useTransform(x, [-150, 0], [1.2, 0.8]);
  const likeScale = useTransform(x, [0, 150], [0.8, 1.2]);

  const handleDrag = () => {
    if (onDragUpdate) {
      onDragUpdate(x.get(), y.get());
    }
  };

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (onDragUpdate) {
      onDragUpdate(0, 0);
    }

    const horizontalThreshold = 100;
    const verticalThreshold = -100; // Negative because up is negative Y
    const velocity = Math.abs(info.velocity.x) + Math.abs(info.velocity.y);
    
    // Check for swipe up first (with velocity consideration)
    if (info.offset.y < verticalThreshold || (info.velocity.y < -500 && info.offset.y < -50)) {
      // Spring back to center so card stays visible when modal is closed
      await controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: {
          type: 'spring',
          stiffness: 350,
          damping: 25,
          mass: 0.8,
        },
      });
      onSwipeUp();
      return;
    }
    
    // Then check for horizontal swipes (with velocity consideration)
    const horizontalSwipe = Math.abs(info.offset.x) > horizontalThreshold || 
                           (Math.abs(info.velocity.x) > 500 && Math.abs(info.offset.x) > 50);
    
    if (horizontalSwipe) {
      // Determine swipe direction
      const direction = info.offset.x > 0 ? 1 : -1;
      
      // Animate exit with slower, more controlled speed
      const exitDistance = direction * 800; // Reduced from dynamic calculation
      setExitX(exitDistance);
      setExitY(info.velocity.y * 0.05); // Reduced vertical influence
      
      // Call appropriate callback
      if (direction > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
      
      // Wait longer for slower exit animation
      setTimeout(() => {
        onSwipeComplete();
      }, 300); // Increased from 150ms
    } else {
      // Smooth spring back to center if not swiped far enough
      await controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: {
          type: 'spring',
          stiffness: 350,
          damping: 25,
          mass: 0.8,
        },
      });
    }
  };

  return (
    <motion.div
      className="absolute w-full h-full cursor-grab active:cursor-grabbing touch-none"
      style={{
        x,
        y,
        rotate,
        opacity,
        scale,
        zIndex: 1,
      }}
      drag
      dragElastic={0.15}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 || exitY !== 0 ? { x: exitX, y: exitY, opacity: 0 } : controls}
      transition={{ 
        type: 'spring', 
        stiffness: 250, // Reduced from 400
        damping: 28, // Reduced from 35
        mass: 1.2, // Increased from 0.8
      }}
      whileTap={{ scale: 0.98, cursor: 'grabbing' }}
    >
      {/* Swipe Indicators Overlay */}
      <motion.div
        className="absolute top-8 left-8 pointer-events-none z-10"
        style={{ opacity: passOpacity, scale: passScale, rotate: -15 }}
      >
        <div className="px-6 py-3 border-4 border-destructive rounded-2xl bg-transparent">
          <span className="text-destructive font-black text-3xl tracking-wider">PASS</span>
        </div>
      </motion.div>

      <motion.div
        className="absolute top-8 right-8 pointer-events-none z-10"
        style={{ opacity: likeOpacity, scale: likeScale, rotate: 15 }}
      >
        <div className="px-6 py-3 border-4 border-success rounded-2xl bg-transparent">
          <span className="text-success font-black text-3xl tracking-wider">LIKE</span>
        </div>
      </motion.div>

      {children}
    </motion.div>
  );
}