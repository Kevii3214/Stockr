import React from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StockWithLive } from '../types/stock';
import StockCard from './StockCard';

const { height: SCREEN_H } = Dimensions.get('window');
const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
const TOP_PEEK = Platform.OS === 'ios' ? 54 : STATUS_H + 12;

// Handle bar area height
const HEADER_H = 24;
// Buy footer height (only shown when onBuy is provided)
const BUY_FOOTER_H = 68;
// Height of the card inside the sheet
const CARD_H = SCREEN_H - TOP_PEEK - HEADER_H;

interface Props {
  stock: StockWithLive | null;
  onClose: () => void;
  onBuy?: (stock: StockWithLive) => void;
}

export default function StockDetailModal({ stock, onClose, onBuy }: Props) {
  const cardHeight = onBuy ? CARD_H - BUY_FOOTER_H : CARD_H;

  return (
    <Modal
      visible={!!stock}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Tap backdrop (strip above the sheet) to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Sheet — absorbs taps so they don't reach the backdrop */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Drag handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {stock && (
            <StockCard
              stock={stock}
              cardHeight={cardHeight}
              initialShowDetails
              onClose={onClose}
            />
          )}

          {stock && onBuy && (
            <View style={styles.buyFooter}>
              <TouchableOpacity
                style={styles.buyBtn}
                onPress={() => onBuy(stock)}
                activeOpacity={0.85}
              >
                <Text style={styles.buyBtnText}>Buy {stock.ticker}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    height: SCREEN_H - TOP_PEEK,
    backgroundColor: '#0d0d1a',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    height: HEADER_H,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3d3d5c',
  },
  buyFooter: {
    paddingTop: 12,
  },
  buyBtn: {
    backgroundColor: '#7c6af7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#7c6af7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
