import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { usePosts } from '../context/PostsContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useWatchlist } from '../context/WatchlistContext';
import { useStockData } from '../context/StockDataContext';

const MAX_CHARS = 280;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ visible, onClose }: Props) {
  const { createPost } = usePosts();
  const { holdings } = usePortfolio();
  const { tickers: watchlistTickers } = useWatchlist();
  const { stocks } = useStockData();

  const [content, setContent] = useState('');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [tickerPickerOpen, setTickerPickerOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [tickerSearch, setTickerSearch] = useState('');

  // Reset when opened
  useEffect(() => {
    if (visible) {
      setContent('');
      setSelectedTicker(null);
      setTickerPickerOpen(false);
      setTickerSearch('');
      setPosting(false);
    }
  }, [visible]);

  // Build ordered ticker list: portfolio first, then watchlist, then rest
  const portfolioTickers = holdings.map(h => h.ticker);
  const seen = new Set<string>();
  const orderedTickers: string[] = [];

  for (const t of portfolioTickers) {
    if (!seen.has(t)) { seen.add(t); orderedTickers.push(t); }
  }
  for (const t of watchlistTickers) {
    if (!seen.has(t)) { seen.add(t); orderedTickers.push(t); }
  }
  for (const s of stocks) {
    if (!seen.has(s.ticker)) { seen.add(s.ticker); orderedTickers.push(s.ticker); }
  }

  const filteredTickers = tickerSearch.trim().length > 0
    ? orderedTickers.filter(t => t.toLowerCase().includes(tickerSearch.toLowerCase()))
    : orderedTickers;

  const canPost = content.trim().length > 0 && content.length <= MAX_CHARS;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      await createPost(selectedTicker, content.trim());
      onClose();
    } catch (err) {
      console.error('CreatePostModal:', err);
    } finally {
      setPosting(false);
    }
  };

  const getStockLabel = (ticker: string) => {
    const stock = stocks.find(s => s.ticker === ticker);
    return stock ? `${ticker} · ${stock.company_name}` : ticker;
  };

  const isPortfolio = (t: string) => portfolioTickers.includes(t);
  const isWatchlist = (t: string) => watchlistTickers.includes(t);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New Post</Text>
            <TouchableOpacity
              style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
              onPress={handlePost}
              disabled={!canPost || posting}
            >
              {posting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.postBtnText}>Post</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Stock tag */}
          <TouchableOpacity
            style={styles.tagRow}
            onPress={() => setTickerPickerOpen(v => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.tagLabel}>Stock tag</Text>
            {selectedTicker
              ? <Text style={styles.tagSelected}>${selectedTicker}</Text>
              : <Text style={styles.tagPlaceholder}>Optional</Text>
            }
            <Text style={styles.tagChevron}>{tickerPickerOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Ticker picker dropdown */}
          {tickerPickerOpen && (
            <View style={styles.pickerContainer}>
              <TextInput
                style={styles.pickerSearch}
                placeholder="Search ticker..."
                placeholderTextColor="#3d3d5c"
                value={tickerSearch}
                onChangeText={setTickerSearch}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <FlatList
                data={['__none__', ...filteredTickers]}
                keyExtractor={item => item}
                style={styles.pickerList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  if (item === '__none__') {
                    return (
                      <TouchableOpacity
                        style={[styles.pickerItem, !selectedTicker && styles.pickerItemActive]}
                        onPress={() => { setSelectedTicker(null); setTickerPickerOpen(false); }}
                      >
                        <Text style={[styles.pickerItemText, !selectedTicker && styles.pickerItemTextActive]}>
                          No stock tag
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  const active = selectedTicker === item;
                  const badge = isPortfolio(item) ? 'Portfolio' : isWatchlist(item) ? 'Watchlist' : null;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, active && styles.pickerItemActive]}
                      onPress={() => { setSelectedTicker(item); setTickerPickerOpen(false); }}
                    >
                      <Text style={[styles.pickerItemText, active && styles.pickerItemTextActive]}>
                        {getStockLabel(item)}
                      </Text>
                      {badge && (
                        <Text style={[styles.pickerBadge, badge === 'Portfolio' && styles.pickerBadgePortfolio]}>
                          {badge}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* Text input */}
          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind about the market?"
            placeholderTextColor="#3d3d5c"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={MAX_CHARS}
            autoFocus
            textAlignVertical="top"
          />

          {/* Char counter */}
          <Text style={[styles.charCount, content.length > MAX_CHARS * 0.9 && styles.charCountWarning]}>
            {MAX_CHARS - content.length}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3d3d5c',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  cancelText: {
    color: '#7878a0',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  postBtn: {
    backgroundColor: '#7c6af7',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    minWidth: 64,
    alignItems: 'center',
  },
  postBtnDisabled: {
    backgroundColor: '#3d3d5c',
  },
  postBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#22223a',
    gap: 8,
  },
  tagLabel: {
    color: '#7878a0',
    fontSize: 13,
    fontWeight: '600',
  },
  tagSelected: {
    flex: 1,
    color: '#7c6af7',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tagPlaceholder: {
    flex: 1,
    color: '#3d3d5c',
    fontSize: 13,
  },
  tagChevron: {
    color: '#7878a0',
    fontSize: 11,
  },
  pickerContainer: {
    backgroundColor: '#12122a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22223a',
    marginBottom: 12,
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerSearch: {
    color: '#ffffff',
    fontSize: 14,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#22223a',
  },
  pickerList: {
    maxHeight: 160,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#22223a',
  },
  pickerItemActive: {
    backgroundColor: '#7c6af715',
  },
  pickerItemText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  pickerItemTextActive: {
    color: '#7c6af7',
    fontWeight: '700',
  },
  pickerBadge: {
    color: '#7878a0',
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: '#22223a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pickerBadgePortfolio: {
    color: '#4DED30',
    backgroundColor: '#4DED3015',
  },
  textInput: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
    backgroundColor: '#12122a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#22223a',
    letterSpacing: 0.1,
  },
  charCount: {
    color: '#7878a0',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
  },
  charCountWarning: {
    color: '#FF4458',
  },
});
