import { User, Mail, Bell, Shield, HelpCircle, LogOut, ChevronRight, Moon, Award, TrendingUp as TrendingUpIcon, Flame, Zap, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { data, getXPForNextLevel, getCurrentLevelXP } = useGamification();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const xpForNextLevel = getXPForNextLevel();
  const currentLevelXP = getCurrentLevelXP();
  const xpProgress = (currentLevelXP / xpForNextLevel) * 100;

  const unlockedAchievements = data.achievements.filter(a => a.unlocked);
  const totalAchievements = data.achievements.length;

  return (
    <div className="px-3 sm:px-4 py-3 sm:py-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-slate-400 text-sm sm:text-base">Manage your account</p>
      </div>

      {/* Profile Header with XP */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#2C3863] to-[#1f2847] rounded-2xl p-5 mb-4 shadow-xl shadow-[#2C3863]/20"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            {/* Level Badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-[#2C3863] shadow-lg">
              <span className="text-xs font-bold text-white">{data.level}</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">{user?.name || 'Stock Trader'}</h2>
            <p className="text-blue-100 text-sm">{user?.email || 'stocktrader@example.com'}</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-xs font-medium">Level {data.level}</span>
            <span className="text-blue-100 text-xs">
              {currentLevelXP} / {xpForNextLevel} XP
            </span>
          </div>
          <div className="h-2.5 bg-[#1f2847] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-yellow-500/50"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#3d4a7d]/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{data.totalSwipes}</div>
            <div className="text-blue-100 text-xs">Total Swipes</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-2xl font-bold text-white">{data.streak}</span>
            </div>
            <div className="text-blue-100 text-xs">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{data.xp}</div>
            <div className="text-blue-100 text-xs">Total XP</div>
          </div>
        </div>
      </motion.div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-warning" />
            <h3 className="text-white font-semibold">Achievements</h3>
          </div>
          <span className="text-slate-400 text-sm">
            {unlockedAchievements.length}/{totalAchievements}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {data.achievements.slice(0, 8).map((achievement) => (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: achievement.unlocked ? 1.1 : 1 }}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                  : 'bg-slate-900/50 border-2 border-slate-700/30'
              }`}
            >
              <div className={`text-2xl mb-1 ${achievement.unlocked ? '' : 'grayscale opacity-40'}`}>
                {achievement.icon}
              </div>
              <div className={`text-[10px] text-center leading-tight ${
                achievement.unlocked ? 'text-warning' : 'text-slate-500'
              }`}>
                {achievement.title.split(' ')[0]}
              </div>
            </motion.div>
          ))}
        </div>

        {unlockedAchievements.length < totalAchievements && (
          <p className="text-slate-400 text-xs text-center mt-4">
            Keep going! {totalAchievements - unlockedAchievements.length} more to unlock
          </p>
        )}
      </motion.div>

      {/* Mascot Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg"
          >
            🦉
          </motion.div>
          <div className="flex-1">
            <h3 className="text-purple-100 font-semibold mb-1">Your Learning Buddy</h3>
            <p className="text-purple-200/80 text-xs leading-relaxed">
              {data.streak >= 7
                ? "Amazing streak! You're becoming a pro investor! 🚀"
                : data.lessonProgress.length >= 3
                ? "Great progress! Keep learning to unlock more achievements! 📚"
                : "Hey there! Complete lessons to earn XP and level up! 🎓"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Account Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-2xl p-1 border border-slate-700/50 overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-slate-400 px-3 pt-3 pb-2">Account</h3>
          
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 active:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-white text-sm">Edit Profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 active:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Mail className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-white text-sm">Email Preferences</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 active:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-white text-sm">Notifications</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>

        {/* App Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-800/50 rounded-2xl p-1 border border-slate-700/50 overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-slate-400 px-3 pt-3 pb-2">Preferences</h3>
          
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 active:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Moon className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-white text-sm">Dark Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">On</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 active:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-white text-sm">Privacy & Security</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>

        {/* Support */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 rounded-2xl p-1 border border-slate-700/50 overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-slate-400 px-3 pt-3 pb-2">Support</h3>
          
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 active:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-white text-sm">Help & Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>

        {/* Logout */}
        <motion.button 
          onClick={handleLogout}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 border border-red-500/50 rounded-2xl p-4 transition-colors"
        >
          <div className="flex items-center justify-center gap-3">
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-semibold">Log Out</span>
          </div>
        </motion.button>

        {/* App Version */}
        <div className="text-center text-slate-500 text-xs py-4">
          Stockr v1.0.0
        </div>
      </div>
    </div>
  );
}