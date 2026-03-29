import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BuyModal from '../components/BuyModal';
import StockDetailModal from '../components/StockDetailModal';
import { useStockData } from '../context/StockDataContext';
import { useWatchlist } from '../context/WatchlistContext';
import { Stock, StockWithLive } from '../types/stock';

// ─── Logo ─────────────────────────────────────────────────────────────────────

function StockLogo({ stock, size = 40 }: { stock: Stock; size?: number }) {
  const [failed, setFailed] = useState(false);

  const sectorColors: Record<string, string> = {
    Technology: '#4a90e2',
    Healthcare: '#50c878',
    Financials: '#f5a623',
    'Consumer Discretionary': '#e74c3c',
    Energy: '#f39c12',
    Materials: '#8e44ad',
    Industrials: '#2980b9',
    'Communication Services': '#16a085',
    'Consumer Staples': '#27ae60',
  };
  const fallbackColor = sectorColors[stock.sector ?? ''] ?? '#7c6af7';

  if (!stock.logo_url || failed) {
    return (
      <View style={[styles.logoFallback, { width: size, height: size, borderRadius: size / 5, backgroundColor: fallbackColor }]}>
        <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: 'bold' }}>
          {stock.ticker[0]}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: stock.logo_url }}
      style={{ width: size, height: size, borderRadius: size / 5 }}
      onError={() => setFailed(true)}
    />
  );
}

// ─── Price display helpers ────────────────────────────────────────────────────

function formatPrice(price: number) {
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ChangeText({ changePercent }: { changePercent: number }) {
  const positive = changePercent >= 0;
  const color = positive ? '#4DED30' : '#FF4458';
  const arrow = positive ? '▲' : '▼';
  return (
    <Text style={[styles.changeText, { color }]}>
      {arrow} {Math.abs(changePercent).toFixed(2)}%
    </Text>
  );
}

// ─── Watchlist Row ────────────────────────────────────────────────────────────

function WatchlistRow({ stockWithLive, onPress, onRemove }: {
  stockWithLive: StockWithLive;
  onPress: () => void;
  onRemove: () => void;
}) {
  const { live } = stockWithLive;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <StockLogo stock={stockWithLive} size={44} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowCompany} numberOfLines={1}>{stockWithLive.company_name}</Text>
        <Text style={styles.rowTicker}>{stockWithLive.ticker}</Text>
      </View>
      <View style={styles.rowRight}>
        {live ? (
          <>
            <Text style={styles.rowPrice}>{formatPrice(live.price)}</Text>
            <ChangeText changePercent={live.changePercent} />
          </>
        ) : (
          <ActivityIndicator size="small" color="#3d3d5c" />
        )}
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <View style={styles.removeBtnInner}>
          {/* × icon using two rotated bars */}
          <View style={[styles.removeLine, { transform: [{ rotate: '45deg' }] }]} />
          <View style={[styles.removeLine, { transform: [{ rotate: '-45deg' }], position: 'absolute' }]} />
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Search Result Row ────────────────────────────────────────────────────────

function SearchResultRow({ stockWithLive, inWatchlist, onToggle }: {
  stockWithLive: StockWithLive;
  inWatchlist: boolean;
  onToggle: () => void;
}) {
  const { live } = stockWithLive;
  return (
    <View style={styles.searchRow}>
      <StockLogo stock={stockWithLive} size={38} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowCompany} numberOfLines={1}>{stockWithLive.company_name}</Text>
        <Text style={styles.rowTicker}>{stockWithLive.ticker}</Text>
      </View>
      {live && (
        <View style={styles.searchPriceBlock}>
          <Text style={styles.rowPrice}>{formatPrice(live.price)}</Text>
          <ChangeText changePercent={live.changePercent} />
        </View>
      )}
      <TouchableOpacity
        style={[styles.addBtn, inWatchlist && styles.addBtnAdded]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {inWatchlist ? (
          <Text style={styles.addBtnTextAdded}>✓</Text>
        ) : (
          <Text style={styles.addBtnText}>+</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      {/* Simple eye / binoculars icon using pure RN views */}
      <View style={styles.emptyIcon}>
        <View style={styles.emptyEye}>
          <View style={styles.emptyPupil} />
        </View>
        <View style={styles.emptyEyeDivider} />
        <View style={styles.emptyEye}>
          <View style={styles.emptyPupil} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
      <Text style={styles.emptySubtitle}>
        Search for a stock above{'\n'}or swipe to discover
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WatchlistScreen() {
  const { stocks } = useStockData();
  const { tickers, loading, addToWatchlist, removeFromWatchlist, clearWatchlist, isInWatchlist } = useWatchlist();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockWithLive | null>(null);
  const [buyStock, setBuyStock] = useState<StockWithLive | null>(null);

  const q = query.trim().toLowerCase();

  // Filter DJIA stocks by query (ticker or company name)
  const searchResults: StockWithLive[] = q.length > 0
    ? stocks.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.company_name.toLowerCase().includes(q)
      )
    : [];

  // Get watchlisted stocks in order they were added
  const watchlistedStocks: StockWithLive[] = tickers
    .map(ticker => stocks.find(s => s.ticker === ticker))
    .filter((s): s is StockWithLive => s !== undefined);

  const showSearch = q.length > 0;
  const showEmpty = !showSearch && watchlistedStocks.length === 0;
  const showList = !showSearch && watchlistedStocks.length > 0;

  return (
    <View style={styles.container}>
      <StockDetailModal
        stock={selectedStock}
        onClose={() => setSelectedStock(null)}
        onBuy={s => { setSelectedStock(null); setBuyStock(s); }}
      />
      <BuyModal
        visible={!!buyStock}
        stock={buyStock}
        onClose={() => setBuyStock(null)}
        mode="buy"
      />
      {/* Search bar */}
      <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
        <View style={styles.searchIcon}>
          {/* magnifying glass: circle + handle */}
          <View style={styles.searchCircle} />
          <View style={styles.searchHandle} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stocks..."
          placeholderTextColor="#3d3d5c"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.searchClearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="small" color="#7c6af7" />
        </View>
      )}

      {/* Empty state */}
      {!loading && showEmpty && <EmptyState />}

      {/* Search results */}
      {showSearch && (
        <ScrollView
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {searchResults.length === 0 ? (
            <Text style={styles.noResults}>No stocks match "{query}"</Text>
          ) : (
            searchResults.map(stock => (
              <SearchResultRow
                key={stock.ticker}
                stockWithLive={stock}
                inWatchlist={isInWatchlist(stock.ticker)}
                onToggle={() =>
                  isInWatchlist(stock.ticker)
                    ? removeFromWatchlist(stock.ticker)
                    : addToWatchlist(stock.ticker)
                }
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Watchlist */}
      {!loading && showList && (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>{tickers.length} stock{tickers.length !== 1 ? 's' : ''}</Text>
          {watchlistedStocks.map(stock => (
            <WatchlistRow
              key={stock.ticker}
              stockWithLive={stock}
              onPress={() => setSelectedStock(stock)}
              onRemove={() => removeFromWatchlist(stock.ticker)}
            />
          ))}
          <TouchableOpacity style={styles.clearBtn} onPress={clearWatchlist} activeOpacity={0.7}>
            <Text style={styles.clearBtnText}>Clear Watchlist</Text>
          </TouchableOpacity>
          <View style={{ height: 12 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 18,
    paddingTop: 8,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122a',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#22223a',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    marginBottom: 16,
    gap: 10,
  },
  searchBarFocused: {
    borderColor: '#7c6af7',
  },
  searchIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  searchCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3d3d5c',
  },
  searchHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 6,
    height: 2,
    backgroundColor: '#3d3d5c',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    letterSpacing: 0.2,
    padding: 0,
  },
  searchClearBtn: {
    color: '#3d3d5c',
    fontSize: 13,
    fontWeight: '600',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  sectionLabel: {
    color: '#3d3d5c',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  noResults: {
    color: '#3d3d5c',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    letterSpacing: 0.3,
  },

  // Watchlist row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16162a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rowInfo: {
    flex: 1,
    gap: 3,
  },
  rowCompany: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  rowTicker: {
    color: '#7c6af7',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  rowPrice: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  removeBtn: {
    padding: 4,
  },
  removeBtnInner: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLine: {
    width: 12,
    height: 2,
    backgroundColor: '#3d3d5c',
    borderRadius: 1,
  },

  // Search result row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16162a',
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
    gap: 11,
  },
  searchPriceBlock: {
    alignItems: 'flex-end',
    gap: 2,
    marginRight: 4,
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#7c6af722',
    borderWidth: 1.5,
    borderColor: '#7c6af7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnAdded: {
    backgroundColor: '#7c6af7',
    borderColor: '#7c6af7',
  },
  addBtnText: {
    color: '#7c6af7',
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 20,
    marginTop: -1,
  },
  addBtnTextAdded: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Logo fallback
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 14,
  },
  emptyIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    opacity: 0.35,
  },
  emptyEye: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#7878a0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPupil: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7878a0',
  },
  emptyEyeDivider: {
    width: 8,
    height: 2.5,
    backgroundColor: '#7878a0',
    borderRadius: 1,
    opacity: 0.6,
  },
  emptyTitle: {
    color: '#7878a0',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    color: '#3d3d5c',
    fontSize: 13,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 20,
  },
  centeredLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Clear watchlist button
  clearBtn: {
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FF4458',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#FF4458',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
