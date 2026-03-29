import { Outlet, useLocation, useNavigate } from 'react-router';
import { TrendingUp, List, BarChart3, CirclePlus, User } from 'lucide-react';
import basketMascot from '../../assets/cb8ffba2d07206d23ccab0368bab9721827c20ae.png';

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Desktop/Laptop Container - Centers content with max width */}
      <div className="max-w-md mx-auto min-h-screen bg-slate-950/50 flex flex-col" style={{ minHeight: '100dvh' }}>
        {/* Header with safe area support */}
        <header className="border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-xl sticky top-0 z-40 flex-shrink-0" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#2C3863] flex items-center justify-center shadow-lg shadow-[#2C3863]/20 p-1">
                  <img 
                    src={basketMascot} 
                    alt="Stockr" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold text-white">Stockr</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Add padding for bottom nav */}
        <main className="flex-1 overflow-y-auto scrollbar-hide" style={{ paddingBottom: 'max(80px, calc(80px + env(safe-area-inset-bottom)))' }}>
          <Outlet />
        </main>

        {/* Bottom Navigation Bar - Now with 5 items */}
        <nav 
          className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-slate-800/50 z-50"
          style={{ 
            backgroundColor: '#00073f',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' 
          }}
        >
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-around px-1 pt-2">
              {/* Swipe/Discover */}
              <button
                onClick={() => navigate('/')}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-300 min-w-[50px] hover:scale-105 active:scale-95 ${
                  isActive('/')
                    ? 'text-[#2C3863]'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                  isActive('/') ? 'bg-[#2C3863]/30 shadow-lg shadow-[#2C3863]/20' : 'hover:bg-slate-800/50'
                }`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">Swipe</span>
              </button>

              {/* Watchlist */}
              <button
                onClick={() => navigate('/watchlist')}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-300 min-w-[50px] hover:scale-105 active:scale-95 ${
                  isActive('/watchlist')
                    ? 'text-[#2C3863]'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                  isActive('/watchlist') ? 'bg-[#2C3863]/30 shadow-lg shadow-[#2C3863]/20' : 'hover:bg-slate-800/50'
                }`}>
                  <List className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium\">Watchlist</span>
              </button>

              {/* Portfolio */}
              <button
                onClick={() => navigate('/portfolio')}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-300 min-w-[50px] hover:scale-105 active:scale-95 ${
                  isActive('/portfolio')
                    ? 'text-[#2C3863]'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                  isActive('/portfolio') ? 'bg-[#2C3863]/30 shadow-lg shadow-[#2C3863]/20' : 'hover:bg-slate-800/50'
                }`}>
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">Portfolio</span>
              </button>

              {/* Explore */}
              <button
                onClick={() => navigate('/explore')}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-300 min-w-[50px] hover:scale-105 active:scale-95 ${
                  isActive('/explore')
                    ? 'text-[#2C3863]'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                  isActive('/explore') ? 'bg-[#2C3863]/30 shadow-lg shadow-[#2C3863]/20' : 'hover:bg-slate-800/50'
                }`}>
                  <CirclePlus className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">Explore</span>
              </button>

              {/* Profile */}
              <button
                onClick={() => navigate('/profile')}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-300 min-w-[50px] hover:scale-105 active:scale-95 ${
                  isActive('/profile')
                    ? 'text-[#2C3863]'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                  isActive('/profile') ? 'bg-[#2C3863]/30 shadow-lg shadow-[#2C3863]/20' : 'hover:bg-slate-800/50'
                }`}>
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}