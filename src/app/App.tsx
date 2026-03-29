import { useState, useMemo, useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router';
import { Stock } from './data/mockStocks';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GamificationProvider, setShowNotification } from './contexts/GamificationContext';
import { SocialProvider } from './contexts/SocialContext';
import { GamificationNotifications, showGamificationNotification } from './components/GamificationNotifications';
import { RootLayout } from './layouts/RootLayout';
import { DiscoverPage } from './pages/DiscoverPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { PassedPage } from './pages/PassedPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ProfilePage } from './pages/ProfilePage';
import { LearnPage } from './pages/LearnPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ExplorePage } from './pages/ExplorePage';
import { PlanDetailPage } from './pages/PlanDetailPage';
import { LoadingPage } from './pages/LoadingPage';
import { Toaster } from 'sonner';

// Portfolio holding interface
export interface Holding {
  stock: Stock;
  shares: number;
  purchasePrice: number;
  purchaseDate: Date;
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Auth Route wrapper (redirects to home if already logged in)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [passed, setPassed] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Holding[]>(() => {
    // Load portfolio from localStorage
    const stored = localStorage.getItem('stockr_portfolio');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((holding: any) => ({
        ...holding,
        purchaseDate: new Date(holding.purchaseDate)
      }));
    }
    return [];
  });

  // Save portfolio to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('stockr_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Set up notification callback
  useEffect(() => {
    setShowNotification(showGamificationNotification);
  }, []);

  const addToWatchlist = (stock: Stock) => {
    setWatchlist(prev => {
      if (prev.find(s => s.id === stock.id)) return prev;
      return [...prev, stock];
    });
  };

  const addToPassed = (stock: Stock) => {
    setPassed(prev => {
      if (prev.find(s => s.id === stock.id)) return prev;
      return [...prev, stock];
    });
  };

  const removeFromWatchlist = (stock: Stock) => {
    setWatchlist(prev => prev.filter(s => s.id !== stock.id));
  };

  const removeFromPassed = (stock: Stock) => {
    setPassed(prev => prev.filter(s => s.id !== stock.id));
  };

  const handleBuyStock = (stock: Stock, shares: number) => {
    setPortfolio(prev => {
      // Check if we already have this stock
      const existingHolding = prev.find(h => h.stock.id === stock.id);
      
      if (existingHolding) {
        // Update existing holding
        return prev.map(h => 
          h.stock.id === stock.id
            ? { 
                ...h, 
                shares: h.shares + shares,
                // Keep the original purchase price for tracking
              }
            : h
        );
      } else {
        // Add new holding
        return [...prev, {
          stock,
          shares,
          purchasePrice: stock.price,
          purchaseDate: new Date()
        }];
      }
    });
  };

  const handleSellStock = (stock: Stock, shares: number) => {
    setPortfolio(prev => {
      const existingHolding = prev.find(h => h.stock.id === stock.id);
      
      if (!existingHolding) {
        return prev;
      }
      
      if (existingHolding.shares <= shares) {
        // Remove holding completely if selling all shares
        return prev.filter(h => h.stock.id !== stock.id);
      } else {
        // Reduce shares
        return prev.map(h =>
          h.stock.id === stock.id
            ? { ...h, shares: h.shares - shares }
            : h
        );
      }
    });
  };

  // Router configuration with all routes including explore and learn
  const router = useMemo(
    () => createBrowserRouter([
      {
        path: '/login',
        element: (
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        ),
      },
      {
        path: '/signup',
        element: (
          <AuthRoute>
            <SignUpPage />
          </AuthRoute>
        ),
      },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <DiscoverPage
                watchlist={watchlist}
                passed={passed}
                onAddToWatchlist={addToWatchlist}
                onAddToPassed={addToPassed}
              />
            ),
          },
          {
            path: 'watchlist',
            element: (
              <WatchlistPage
                watchlist={watchlist}
                onRemoveFromWatchlist={removeFromWatchlist}
                onBuyStock={handleBuyStock}
                onSellStock={handleSellStock}
              />
            ),
          },
          {
            path: 'portfolio',
            element: (
              <PortfolioPage
                watchlist={watchlist}
                portfolio={portfolio}
              />
            ),
          },
          {
            path: 'explore',
            element: (
              <ExplorePage
                watchlist={watchlist}
                passed={passed}
                onAddToWatchlist={addToWatchlist}
                onBuyStock={handleBuyStock}
                onSellStock={handleSellStock}
              />
            ),
          },
          {
            path: 'learn',
            element: <LearnPage />,
          },
          {
            path: 'plan/:planId',
            element: <PlanDetailPage />,
          },
          {
            path: 'passed',
            element: (
              <PassedPage
                passed={passed}
                onRemoveFromPassed={removeFromPassed}
              />
            ),
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
        ],
      },
    ]),
    [watchlist, passed, portfolio]
  );

  // Show loading screen first
  if (isLoading) {
    return <LoadingPage onLoadingComplete={() => setIsLoading(false)} />;
  }

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors />
      <GamificationNotifications />
      <RouterProvider router={router} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <SocialProvider>
          <AppContent />
        </SocialProvider>
      </GamificationProvider>
    </AuthProvider>
  );
}