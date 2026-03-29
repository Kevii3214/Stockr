import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Swiper from 'react-native-deck-swiper';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StockDataProvider, useStockData } from './context/StockDataContext';
import { WatchlistProvider, useWatchlist } from './context/WatchlistContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { RecommendationProvider, useRecommendation } from './context/RecommendationContext';
import { PostsProvider } from './context/PostsContext';
import { PlanProvider } from './context/PlanContext';
import { AuthStack } from './navigation/AuthStack';
import StockCard from './components/StockCard';
import WatchlistScreen from './screens/WatchlistScreen';
import PortfolioScreen from './screens/PortfolioScreen';
import ExploreScreen from './screens/ExploreScreen';
import { StockWithLive } from './types/stock';

const CONTAINER_WIDTH = Platform.OS === 'web' ? 390 : Dimensions.get('window').width;
const CARD_MARGIN = 20;
const CARD_WIDTH = CONTAINER_WIDTH - CARD_MARGIN * 2;
const TAB_BAR_HEIGHT = 84;

type Tab = 'swipe' | 'watchlist' | 'portfolio' | 'explore' | 'profile';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSwipe({ color }: { color: string }) {
  return (
    <View style={{ width: 38, height: 32 }}>
      {/* back card */}
      <View style={{
        position: 'absolute', top: 7, left: 7,
        width: 26, height: 20, borderRadius: 4,
        borderWidth: 2, borderColor: color, opacity: 0.45,
      }} />
      {/* front card */}
      <View style={{
        position: 'absolute', top: 0, left: 0,
        width: 26, height: 20, borderRadius: 4,
        borderWidth: 2, borderColor: color,
      }} />
      {/* right arrow shaft */}
      <View style={{
        position: 'absolute', right: 0, top: 12,
        width: 12, height: 2, backgroundColor: color,
      }} />
      {/* right arrow head */}
      <View style={{
        position: 'absolute', right: 0, top: 8,
        width: 7, height: 7,
        borderTopWidth: 2, borderRightWidth: 2, borderColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}

function IconWatchlist({ color }: { color: string }) {
  return (
    <View style={{ width: 32, height: 26, justifyContent: 'space-between' }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
          <View style={{ flex: 1, height: 2, backgroundColor: color, borderRadius: 1 }} />
        </View>
      ))}
    </View>
  );
}

function IconPortfolio({ color }: { color: string }) {
  const bars: [number, number][] = [[14, 8], [22, 8], [16, 8], [26, 8]];
  return (
    <View style={{ width: 32, height: 28, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
      {bars.map(([h, w], i) => (
        <View key={i} style={{ width: w - 2, height: h, backgroundColor: color, borderRadius: 3 }} />
      ))}
      {/* baseline */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function IconExplore({ color }: { color: string }) {
  return (
    <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 30, height: 30, borderRadius: 15,
        borderWidth: 2, borderColor: color,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* crosshair */}
        <View style={{ width: 2, height: 14, backgroundColor: color }} />
        <View style={{ position: 'absolute', width: 14, height: 2, backgroundColor: color }} />
        {/* center dot */}
        <View style={{
          position: 'absolute', width: 6, height: 6,
          borderRadius: 3, backgroundColor: color,
        }} />
      </View>
    </View>
  );
}

function IconProfile({ color }: { color: string }) {
  return (
    <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 1 }}>
      {/* head */}
      <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: color }} />
      {/* shoulders arc */}
      <View style={{
        width: 26, height: 13,
        borderTopLeftRadius: 13, borderTopRightRadius: 13,
        borderWidth: 2, borderColor: color,
        borderBottomWidth: 0, marginTop: 3,
      }} />
    </View>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: 'bold', letterSpacing: 1 }}>
        {title}
      </Text>
    </View>
  );
}

function ProfileScreen() {
  const { signOut } = useAuth();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity
        onPress={signOut}
        style={{
          backgroundColor: '#7c6af7',
          paddingVertical: 14,
          paddingHorizontal: 40,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }}>
          Log Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const overlayLabelStyle = {
  fontSize: 42,
  fontWeight: 'bold' as const,
  letterSpacing: 4,
  padding: 12,
  borderRadius: 8,
  borderWidth: 4,
  overflow: 'hidden' as const,
};

const REPLENISH_THRESHOLD = 5;
const BATCH_SIZE = 20;

function SwipeScreen() {
  const { stocks, loading, error } = useStockData();
  const { tickers: watchlistTickers, addToWatchlist } = useWatchlist();
  const { getNextBatch, recordSwipe } = useRecommendation();
  const swiperRef = useRef<Swiper<StockWithLive>>(null);
  const [cards, setCards] = useState<StockWithLive[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [swiperHeight, setSwiperHeight] = useState(0);

  const BOTTOM_GAP = 16;
  const cardHeight = swiperHeight > 0 ? swiperHeight - CARD_MARGIN * 2 - BOTTOM_GAP : 0;

  // Build initial deck once stocks are loaded
  useEffect(() => {
    if (!loading && stocks.length > 0 && cards.length === 0) {
      const exclude = new Set(watchlistTickers);
      setCards(getNextBatch(exclude, BATCH_SIZE * 2));
    }
  }, [loading, stocks]);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ color: '#FF4458', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>{error}</Text>
      </View>
    );
  }

  if (loading || cards.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#7c6af7" />
        <Text style={{ color: '#7878a0', fontSize: 13, marginTop: 12, letterSpacing: 0.5 }}>
          Loading stocks…
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={{ height: 22, alignItems: 'center', justifyContent: 'center' }}>
        {lastAction ? (
          <Text style={[styles.lastAction, { color: lastAction === 'ADDED' ? '#4DED30' : '#FF4458' }]}>
            {lastAction}
          </Text>
        ) : null}
      </View>

      <View
        style={{ flex: 1, alignSelf: 'stretch', overflow: 'hidden' }}
        onLayout={e => setSwiperHeight(e.nativeEvent.layout.height)}
      >
        {swiperHeight > 0 && (
          <Swiper
            ref={swiperRef}
            cards={cards}
            cardIndex={0}
            renderCard={(card) => (
              <StockCard stock={card} cardHeight={cardHeight} />
            )}
            onSwipedRight={(cardIndex) => {
              const stock = cards[cardIndex];
              if (stock) {
                addToWatchlist(stock.ticker);
                recordSwipe(stock.ticker, 'right');
              }
              setLastAction('ADDED');
            }}
            onSwipedLeft={(cardIndex) => {
              const stock = cards[cardIndex];
              if (stock) recordSwipe(stock.ticker, 'left');
              setLastAction('PASSED');
            }}
            onSwiped={(index) => {
              if (index >= cards.length - REPLENISH_THRESHOLD) {
                const exclude = new Set([...watchlistTickers, ...cards.map(c => c.ticker)]);
                setCards(prev => [...prev, ...getNextBatch(exclude, BATCH_SIZE)]);
              }
            }}
            onSwipedAborted={() => setLastAction(null)}
            backgroundColor="transparent"
            stackSize={3}
            stackSeparation={12}
            cardVerticalMargin={CARD_MARGIN}
            cardHorizontalMargin={CARD_MARGIN}
            cardStyle={{ width: CARD_WIDTH, left: CARD_MARGIN, height: cardHeight }}
            horizontalThreshold={CONTAINER_WIDTH / 4}
            inputRotationRange={[-CONTAINER_WIDTH / 2, 0, CONTAINER_WIDTH / 2]}
            inputCardOpacityRangeX={[
              -CONTAINER_WIDTH / 2, -CONTAINER_WIDTH / 3,
              0,
              CONTAINER_WIDTH / 3, CONTAINER_WIDTH / 2,
            ]}
            overlayOpacityHorizontalThreshold={CONTAINER_WIDTH / 4}
            infinite={false}
            overlayLabels={{
              left: {
                title: 'NOPE',
                style: {
                  label: { ...overlayLabelStyle, color: '#FF4458', borderColor: '#FF4458' },
                  wrapper: {
                    flexDirection: 'column', alignItems: 'flex-end',
                    justifyContent: 'flex-start', marginTop: 30, marginLeft: -30,
                  },
                },
              },
              right: {
                title: 'LIKE',
                style: {
                  label: { ...overlayLabelStyle, color: '#4DED30', borderColor: '#4DED30' },
                  wrapper: {
                    flexDirection: 'column', alignItems: 'flex-start',
                    justifyContent: 'flex-start', marginTop: 30, marginLeft: 30,
                  },
                },
              },
            }}
            animateOverlayLabelsOpacity
            animateCardOpacity
            swipeBackCard
          />
        )}
      </View>
    </>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; Icon: React.FC<{ color: string }> }[] = [
  { id: 'swipe',     label: 'Swipe',     Icon: IconSwipe },
  { id: 'watchlist', label: 'Watchlist', Icon: IconWatchlist },
  { id: 'portfolio', label: 'Portfolio', Icon: IconPortfolio },
  { id: 'explore',   label: 'Explore',   Icon: IconExplore },
  { id: 'profile',   label: 'Profile',   Icon: IconProfile },
];

function TabBar({ active, onPress }: { active: Tab; onPress: (t: Tab) => void }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        const color = isActive ? '#7c6af7' : '#3d3d5c';
        return (
          <TouchableOpacity
            key={id}
            style={styles.tabItem}
            onPress={() => onPress(id)}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.tabActiveIndicator} />}
            <Icon color={color} />
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

const SCREEN_TITLES: Record<Tab, string> = {
  swipe: 'Stockr',
  watchlist: 'Watchlist',
  portfolio: 'Portfolio',
  explore: 'Explore',
  profile: 'Profile',
};

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('swipe');

  return (
    <View style={styles.pageWrapper}>
      <View style={styles.container}>
        <StatusBar style="light" />

        {activeTab !== 'portfolio' && activeTab !== 'explore' && (
          <Text style={styles.title}>{SCREEN_TITLES[activeTab]}</Text>
        )}

        {activeTab === 'swipe'     && <SwipeScreen />}
        {activeTab === 'watchlist' && <WatchlistScreen />}
        {activeTab === 'portfolio' && <PortfolioScreen />}
        {activeTab === 'explore'   && <ExploreScreen />}
        {activeTab === 'profile'   && <ProfileScreen />}

        <TabBar active={activeTab} onPress={setActiveTab} />
      </View>
    </View>
  );
}

function SplashScreen() {
  return (
    <View style={[styles.pageWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#7c6af7" />
    </View>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!session) return <AuthStack />;
  return <MainApp />;
}

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <StockDataProvider>
          <WatchlistProvider>
            <PortfolioProvider>
              <RecommendationProvider>
                <PostsProvider>
                  <PlanProvider>
                    <RootNavigator />
                  </PlanProvider>
                </PostsProvider>
              </RecommendationProvider>
            </PortfolioProvider>
          </WatchlistProvider>
        </StockDataProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: Platform.OS === 'web' ? 390 : undefined,
    height: Platform.OS === 'web' ? 844 : undefined,
    flex: Platform.OS === 'web' ? undefined : 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
    borderRadius: Platform.OS === 'web' ? 40 : 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 2,
  },
  lastAction: {
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  tabBar: {
    height: TAB_BAR_HEIGHT,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#12122a',
    borderTopWidth: 1,
    borderTopColor: '#22223a',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    position: 'relative',
    paddingBottom: 16,
  },
  tabActiveIndicator: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 3,
    backgroundColor: '#7c6af7',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
