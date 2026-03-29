import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Target, Clock, Award, CheckCircle2, Circle, Lock, TrendingUp, Lightbulb, MessageCircle, Sparkles, ChevronRight, Trophy, Star } from 'lucide-react';
import { investmentGoals } from '../data/investmentPlans';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import { topics } from '../data/learnTopics';
import basketMascot from '../../assets/cb8ffba2d07206d23ccab0368bab9721827c20ae.png';

export function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data, completeStep } = useGamification();
  const { user } = useAuth();
  
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string; timestamp: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const plan = investmentGoals.find(p => p.id === planId);

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">Plan Not Found</h1>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-3 bg-[#2C3863] hover:bg-[#3d4a7d] text-white rounded-xl font-semibold transition-colors"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const isLocked = data.xp < plan.requiredXP;
  const completedSteps = plan.steps.filter(s => s.completed).length;
  const totalSteps = plan.steps.length;
  const progressPercent = (completedSteps / totalSteps) * 100;
  const isCompleted = completedSteps === totalSteps;

  const handleStepComplete = (stepId: string) => {
    if (isLocked) return;
    
    const step = plan.steps.find(s => s.id === stepId);
    if (!step || step.completed) return;

    completeStep(plan.id, stepId, step.xpReward);
    
    // Check if this was the last step
    const newCompletedSteps = plan.steps.filter(s => s.completed || s.id === stepId).length;
    if (newCompletedSteps === totalSteps) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const handleSendAIMessage = (message: string) => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAITyping(true);

    setTimeout(() => {
      const aiResponses = getAIResponseForPlan(message, plan, data);
      const aiMessage = {
        role: 'ai' as const,
        content: aiResponses,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMessage]);
      setIsAITyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const getAIResponseForPlan = (userMessage: string, currentPlan: typeof plan, userData: typeof data): string => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('help') || msg.includes('stuck') || msg.includes('how')) {
      const nextStep = currentPlan.steps.find(s => !s.completed);
      if (nextStep) {
        return `Baggio's here to help! 💪 Let's tackle **${nextStep.title}** together.\n\n📝 **Quick Tips:**\n${nextStep.description}\n\n💡 **Getting Started:**\n1. Take it one step at a time\n2. Research online resources\n3. Ask questions in the community\n4. Track your progress\n\nYou'll earn **${nextStep.xpReward} XP** when you complete this! Need more specific guidance?`;
      } else {
        return `Amazing! You've completed all steps! 🎉 You're a **${currentPlan.title}** champion!\n\nWhat's next?\n• Check out other investment plans\n• Share your achievement\n• Apply what you've learned\n\nKeep up the incredible work! 🚀`;
      }
    }
    
    if (msg.includes('progress') || msg.includes('status')) {
      return `Here's your progress on **${currentPlan.title}**: 📊\n\n✅ Completed: ${completedSteps}/${totalSteps} steps\n📈 Progress: ${Math.round(progressPercent)}%\n🎯 XP Earned: ${currentPlan.steps.filter(s => s.completed).reduce((sum, s) => sum + s.xpReward, 0)} XP\n⏱️ Timeframe: ${currentPlan.timeframe}\n\n${completedSteps === 0 ? "Let's get started! Click the first step to begin your journey." : completedSteps === totalSteps ? "🎉 Congratulations! You've completed this plan!" : "You're doing great! Keep going! 💪"}`;
    }
    
    if (msg.includes('next') || msg.includes('what should')) {
      const nextStep = currentPlan.steps.find(s => !s.completed);
      if (nextStep) {
        return `Your next step is: **${nextStep.title}** 🎯\n\n${nextStep.description}\n\n💡 **Why this matters:**\nThis step is crucial for ${currentPlan.title.toLowerCase()}. Completing it will move you closer to your investment goals!\n\n🏆 **Reward:** ${nextStep.xpReward} XP\n\nReady to check it off? You've got this! 💪`;
      } else {
        return `You've completed all steps! 🌟 Amazing work!\n\nConsider these next plans:\n• **${investmentGoals.find(p => p.id !== currentPlan.id && userData.xp >= p.requiredXP)?.title || 'Explore more plans'}**\n\nKeep building your investment knowledge! 🚀`;
      }
    }
    
    if (msg.includes('tip') || msg.includes('advice') || msg.includes('recommend')) {
      return `Here are Baggio's top tips for **${currentPlan.title}**: 💡\n\n1️⃣ **Stay Consistent** - Work on it regularly, even if just 15 minutes a day\n\n2️⃣ **Take Notes** - Document your learnings and insights\n\n3️⃣ **Join Communities** - Connect with others on the same journey\n\n4️⃣ **Be Patient** - ${currentPlan.timeframe} is the timeframe, don't rush!\n\n5️⃣ **Ask Questions** - Baggio's always here to help! Just ask! 🤗\n\nWhat aspect would you like to explore deeper?`;
    }

    if (msg.includes('time') || msg.includes('long') || msg.includes('duration')) {
      return `Great question about timing! ⏰\n\n**Estimated Timeframe:** ${currentPlan.timeframe}\n\n**Your Progress:**\n• Steps completed: ${completedSteps}/${totalSteps}\n• Estimated time remaining: ${completedSteps === 0 ? currentPlan.timeframe : completedSteps === totalSteps ? 'All done! 🎉' : 'A few weeks'}\n\n💡 **Tip:** Everyone moves at their own pace! The timeframe is just a guideline. Focus on understanding rather than rushing through.\n\nTake your time and enjoy the learning process! 🌱`;
    }
    
    return `Great question about **${currentPlan.title}**! 🤔\n\nBaggio is your dedicated guide for this plan. I can help you with:\n\n📋 **Plan Progress** - Check your status\n🎯 **Next Steps** - Know what to do next\n💡 **Tips & Advice** - Get actionable guidance\n❓ **Questions** - Ask anything about this plan\n\nTry asking:\n• "What's my progress?"\n• "What should I do next?"\n• "Give me tips for this plan"\n• "I'm stuck, help!"\n\nHow can I assist you today? 😊`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{ 
                  y: window.innerHeight + 20,
                  rotate: Math.random() * 360,
                  opacity: 0
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  ease: "easeOut"
                }}
                className="absolute text-2xl"
              >
                {['🎉', '⭐', '🏆', '💰', '🎯'][Math.floor(Math.random() * 5)]}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/explore')}
              className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-white font-bold text-lg">{plan.title}</h1>
              <p className="text-slate-400 text-xs">{plan.timeframe} • {totalSteps} steps</p>
            </div>
            <button
              onClick={() => setIsAIChatOpen(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 flex items-center justify-center transition-all shadow-lg"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className={`rounded-2xl p-6 border-2 ${
            isLocked 
              ? 'bg-slate-800/30 border-slate-700/30' 
              : plan.difficulty === 'beginner'
              ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30'
              : plan.difficulty === 'intermediate'
              ? 'bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-500/30'
              : 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30'
          }`}>
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-4xl shadow-xl ${
                isLocked 
                  ? 'from-slate-700 to-slate-800' 
                  : plan.difficulty === 'beginner'
                  ? 'from-green-600 to-emerald-700'
                  : plan.difficulty === 'intermediate'
                  ? 'from-blue-600 to-indigo-700'
                  : 'from-purple-600 to-pink-700'
              }`}>
                {isLocked ? '🔒' : plan.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    plan.difficulty === 'beginner'
                      ? 'bg-green-500/20 text-green-400'
                      : plan.difficulty === 'intermediate'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {plan.difficulty}
                  </span>
                  {isLocked && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-700/50 text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {plan.requiredXP} XP Required
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-warning/20 text-warning flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Completed!
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {plan.description}
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-xs">Duration</span>
                </div>
                <div className="text-white font-bold text-sm">{plan.timeframe}</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-xs">Steps</span>
                </div>
                <div className="text-white font-bold text-sm">{completedSteps}/{totalSteps}</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-warning" />
                  <span className="text-slate-400 text-xs">Total XP</span>
                </div>
                <div className="text-white font-bold text-sm">
                  {plan.steps.reduce((sum, s) => sum + s.xpReward, 0)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {!isLocked && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-medium">Overall Progress</span>
                  <span className="text-white font-bold text-sm">{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-slate-900/50 rounded-full h-3 overflow-hidden border border-slate-700/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      plan.difficulty === 'beginner'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : plan.difficulty === 'intermediate'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Locked Message */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center"
          >
            <Lock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Plan Locked</h3>
            <p className="text-slate-400 text-sm mb-4">
              You need <span className="text-white font-bold">{plan.requiredXP - data.xp} more XP</span> to unlock this plan
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="px-6 py-3 bg-[#2C3863] hover:bg-[#3d4a7d] text-white rounded-xl font-semibold transition-colors"
            >
              Complete More Lessons
            </button>
          </motion.div>
        )}

        {/* Steps Section */}
        {!isLocked && (
          <div className="space-y-3">
            <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Action Steps
            </h2>
            
            {plan.steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl p-4 border-2 transition-all ${
                  step.completed
                    ? 'bg-green-900/10 border-green-500/30'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50'
                }`}
              >
                <div className="flex gap-4">
                  <button
                    onClick={() => handleStepComplete(step.id)}
                    disabled={step.completed}
                    className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-1"
                    style={{
                      borderColor: step.completed ? '#10B981' : '#64748b',
                      backgroundColor: step.completed ? '#10B981' : 'transparent'
                    }}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={`font-bold ${
                        step.completed ? 'text-green-400 line-through' : 'text-white'
                      }`}>
                        {index + 1}. {step.title}
                      </h3>
                      <span className="px-2 py-1 rounded-lg text-xs font-bold bg-warning/20 text-warning whitespace-nowrap flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        +{step.xpReward} XP
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      step.completed ? 'text-slate-500' : 'text-slate-300'
                    }`}>
                      {step.description}
                    </p>
                    {step.completed && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-semibold">Completed! Great job! 🎉</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Completion Celebration */}
        {isCompleted && !isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 bg-gradient-to-r from-warning/20 to-orange-500/20 border-2 border-warning/40 rounded-2xl p-6 text-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
              className="text-6xl mb-3"
            >
              🏆
            </motion.div>
            <h3 className="text-white font-bold text-2xl mb-2">Congratulations!</h3>
            <p className="text-slate-300 mb-4">
              You've completed <span className="text-warning font-bold">{plan.title}</span>!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/explore')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all shadow-lg"
              >
                Explore More Plans
              </button>
            </div>
          </motion.div>
        )}

        {/* Baggio Assistant CTA */}
        {!isLocked && !isCompleted && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAIChatOpen(true)}
            className="mt-6 w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border-2 border-purple-500/40 rounded-xl p-4 transition-all group"
          >
            <div className="flex items-center gap-3">
              <img 
                src={basketMascot} 
                alt="Baggio" 
                className="w-12 h-12 object-contain"
              />
              <div className="flex-1 text-left">
                <p className="text-purple-200 font-semibold mb-1">Need Help?</p>
                <p className="text-purple-300/80 text-sm">Ask Baggio for guidance on this plan</p>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        )}
      </div>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {isAIChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAIChatOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            />
            
            {/* Chat Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-4 bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-[460px] sm:h-[600px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-purple-500/50 shadow-2xl shadow-purple-500/30 z-[101] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center gap-3">
                <motion.img 
                  src={basketMascot} 
                  alt="Baggio" 
                  className="w-12 h-12 object-contain drop-shadow-lg"
                  animate={{
                    rotate: [0, -5, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">AI Plan Assistant</h3>
                  <p className="text-purple-100 text-xs">Guiding you through {plan.title}</p>
                </div>
                <button
                  onClick={() => setIsAIChatOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <span className="text-white text-xl">×</span>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-6xl mb-4"
                    >
                      {plan.icon}
                    </motion.div>
                    <h4 className="text-white font-bold text-lg mb-2">Welcome to {plan.title}!</h4>
                    <p className="text-slate-400 text-sm mb-4 px-4">
                      Baggio is here to help you complete this plan successfully!
                    </p>
                    <div className="space-y-2 text-left max-w-xs mx-auto">
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-purple-300 text-sm">💬 Ask about your progress</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-purple-300 text-sm">🎯 Get help with next steps</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-purple-300 text-sm">💡 Receive tips & advice</p>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs mt-4 px-4">
                      Try: "What should I do next?"
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {chatMessages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'ai' && (
                          <img 
                            src={basketMascot} 
                            alt="AI" 
                            className="w-8 h-8 object-contain flex-shrink-0"
                          />
                        )}
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-slate-800/70 border border-slate-700/50 text-slate-200'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                          </div>
                          <p className={`text-xs text-slate-500 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {message.timestamp}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isAITyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <img 
                          src={basketMascot} 
                          alt="AI" 
                          className="w-8 h-8 object-contain flex-shrink-0"
                        />
                        <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="w-2 h-2 bg-purple-400 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              className="w-2 h-2 bg-purple-400 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              className="w-2 h-2 bg-purple-400 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAIMessage(chatInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about this plan..."
                    className="flex-1 bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    disabled={isAITyping}
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!chatInput.trim() || isAITyping}
                    className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-white font-bold text-sm transition-all shadow-lg"
                  >
                    Send
                  </motion.button>
                </form>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  AI guidance for {plan.title}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}