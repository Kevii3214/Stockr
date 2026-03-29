import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { Sparkles, Trophy, Zap } from 'lucide-react';

interface Notification {
  id: string;
  type: 'xp' | 'achievement' | 'levelup';
  message: string;
  icon?: string;
}

let notificationQueue: Notification[] = [];
let setNotificationsCallback: ((notifications: Notification[]) => void) | null = null;

export const showGamificationNotification = (notification: Omit<Notification, 'id'>) => {
  const newNotification = {
    ...notification,
    id: Date.now().toString() + Math.random(),
  };
  
  notificationQueue = [...notificationQueue, newNotification];
  
  if (setNotificationsCallback) {
    setNotificationsCallback([...notificationQueue]);
  }
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notificationQueue = notificationQueue.filter(n => n.id !== newNotification.id);
    if (setNotificationsCallback) {
      setNotificationsCallback([...notificationQueue]);
    }
  }, 3000);
};

export function GamificationNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    setNotificationsCallback = setNotifications;
    return () => {
      setNotificationsCallback = null;
    };
  }, []);
  
  return (
    <div className="fixed top-20 right-4 z-[100] pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ marginBottom: index > 0 ? '8px' : '0' }}
            className={`rounded-xl px-4 py-3 shadow-2xl border backdrop-blur-xl pointer-events-auto ${
              notification.type === 'levelup'
                ? 'bg-gradient-to-r from-yellow-500/90 to-orange-500/90 border-yellow-400'
                : notification.type === 'achievement'
                ? 'bg-gradient-to-r from-purple-600/90 to-blue-600/90 border-purple-400'
                : 'bg-gradient-to-r from-[#2C3863]/90 to-[#1f2847]/90 border-[#2C3863]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {notification.type === 'levelup' ? (
                  <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-warning" />
                  </div>
                ) : notification.type === 'achievement' ? (
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xl">
                    {notification.icon || '🏆'}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-warning" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">
                  {notification.message}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}