import { createBrowserRouter } from 'react-router';
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
import { Stock } from './data/mockStocks';

// This will be passed via router context
interface RouterContext {
  watchlist: Stock[];
  passed: Stock[];
  addToWatchlist: (stock: Stock) => void;
  addToPassed: (stock: Stock) => void;
  removeFromWatchlist: (stock: Stock) => void;
  removeFromPassed: (stock: Stock) => void;
}

export const createAppRouter = (context: RouterContext) => createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <DiscoverPage
            watchlist={context.watchlist}
            passed={context.passed}
            onAddToWatchlist={context.addToWatchlist}
            onAddToPassed={context.addToPassed}
          />
        ),
      },
      {
        path: 'watchlist',
        element: (
          <WatchlistPage
            watchlist={context.watchlist}
            onRemoveFromWatchlist={context.removeFromWatchlist}
          />
        ),
      },
      {
        path: 'portfolio',
        element: (
          <PortfolioPage
            watchlist={context.watchlist}
          />
        ),
      },
      {
        path: 'learn',
        element: <LearnPage />,
      },
      {
        path: 'explore',
        element: (
          <ExplorePage
            watchlist={context.watchlist}
            passed={context.passed}
            onAddToWatchlist={context.addToWatchlist}
          />
        ),
      },
      {
        path: 'passed',
        element: (
          <PassedPage
            passed={context.passed}
            onRemoveFromPassed={context.removeFromPassed}
          />
        ),
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'plan/:planId',
        element: <PlanDetailPage />,
      },
    ],
  },
]);