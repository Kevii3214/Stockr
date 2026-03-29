import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { usePortfolio } from '../context/PortfolioContext';
import { StockWithLive } from '../types/stock';

// ─── Dollar input helpers (mirrors DepositModal pattern) ─────────────────────

function formatDollars(cents: string): string {
  const digits = cents.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDollars(formatted: string): number {
  return parseFloat(formatted.replace(/,/g, '')) || 0;
}

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtShares(n: number): string {
  if (n === 0) return '0';
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 });
}

// ─── Logo component ───────────────────────────────────────────────────────────

function StockLogo({ stock, size = 40 }: { stock: StockWithLive; size?: number }) {
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
      <View style={{
        width: size, height: size, borderRadius: size / 5,
        backgroundColor: fallbackColor, alignItems: 'center', justifyContent: 'center',
      }}>
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

// ─── Types ────────────────────────────────────────────────────────────────────

type TradeMode = 'buy' | 'sell';
type InputMode = 'dollars' | 'shares';
type Step = 'input' | 'review' | 'success';

interface Props {
  visible: boolean;
  stock: StockWithLive | null;
  onClose: () => void;
  mode?: TradeMode;
}

const QUICK_AMOUNTS = [50, 100, 500, 1000];

// ─── Component ───────────────────────────────────────────────────────────────

export default function BuyModal({ visible, stock, onClose, mode: initialMode = 'buy' }: Props) {
  const { cashBalance, sharesOwned, buyStock, sellStock } = usePortfolio();
  const inputRef = useRef<TextInput>(null);

  const [step, setStep] = useState<Step>('input');
  const [tradeMode, setTradeMode] = useState<TradeMode>(initialMode);
  const [inputMode, setInputMode] = useState<InputMode>('dollars');
  const [rawCents, setRawCents] = useState('');
  const [sharesInput, setSharesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync tradeMode with prop when modal opens
  useEffect(() => {
    if (visible) {
      setTradeMode(initialMode);
      setStep('input');
      setRawCents('');
      setSharesInput('');
      setErrorMsg(null);
    }
  }, [visible, initialMode]);

  if (!stock) return null;

  const currentPrice = stock.live?.price ?? 0;
  const ownedShares = sharesOwned(stock.ticker);
  const changePercent = stock.live?.changePercent ?? 0;
  const positive = changePercent >= 0;

  // Derived amounts
  const dollarDisplay = rawCents ? formatDollars(rawCents) : '';
  const dollarAmount = parseDollars(dollarDisplay || '0');
  const sharesFromDollars = currentPrice > 0 ? dollarAmount / currentPrice : 0;

  const sharesNum = inputMode === 'shares' ? (parseFloat(sharesInput) || 0) : sharesFromDollars;
  const totalCost = inputMode === 'shares' ? sharesNum * currentPrice : dollarAmount;

  const canProceed = inputMode === 'dollars'
    ? (tradeMode === 'buy' ? dollarAmount > 0 && dollarAmount <= cashBalance : dollarAmount > 0 && sharesNum <= ownedShares)
    : (tradeMode === 'buy' ? sharesNum > 0 && totalCost <= cashBalance : sharesNum > 0 && sharesNum <= ownedShares);

  const handleDollarInput = (text: string) => {
    const digits = text.replace(/\D/g, '');
    setRawCents(digits);
  };

  const handleQuick = (amount: number) => {
    setRawCents(String(amount * 100));
  };

  const reset = () => {
    setStep('input');
    setRawCents('');
    setSharesInput('');
    setErrorMsg(null);
    setInputMode('dollars');
    setTradeMode(initialMode);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMsg(null);
    let result: { error: string | null };
    if (tradeMode === 'buy') {
      result = await buyStock(stock.ticker, sharesNum, currentPrice);
    } else {
      result = await sellStock(stock.ticker, sharesNum, currentPrice);
    }
    setLoading(false);
    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setStep('success');
    }
  };

  // ─── Success step ────────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.successContent}>
              {/* Checkmark circle */}
              <View style={styles.checkCircle}>
                <View style={styles.checkMark}>
                  <View style={[styles.checkLine, styles.checkLineShort]} />
                  <View style={[styles.checkLine, styles.checkLineLong]} />
                </View>
              </View>
              <Text style={styles.successTitle}>Order Placed!</Text>
              <Text style={styles.successSub}>
                You {tradeMode === 'buy' ? 'bought' : 'sold'}{' '}
                <Text style={{ color: '#7c6af7', fontWeight: '700' }}>
                  {fmtShares(sharesNum)} {sharesNum === 1 ? 'share' : 'shares'}
                </Text>
                {' '}of <Text style={{ color: '#ffffff', fontWeight: '700' }}>{stock.ticker}</Text>
              </Text>
              <Text style={styles.successAmount}>
                {tradeMode === 'buy' ? '−' : '+'}${fmt(totalCost)}
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleClose}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ─── Review step ─────────────────────────────────────────────────────────────

  if (step === 'review') {
    const buyingPowerAfter = cashBalance - totalCost;
    const sharesAfter = ownedShares - sharesNum;

    return (
      <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Review Order</Text>

            {/* Stock summary */}
            <View style={styles.reviewStockRow}>
              <StockLogo stock={stock} size={36} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.reviewStockName} numberOfLines={1}>{stock.company_name}</Text>
                <Text style={styles.reviewStockTicker}>{stock.ticker}</Text>
              </View>
              <Text style={[styles.reviewOrderType,
                tradeMode === 'buy' ? styles.buyBadge : styles.sellBadge]}>
                {tradeMode === 'buy' ? 'BUY' : 'SELL'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Order Type</Text>
              <Text style={styles.reviewValue}>Market Order</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Shares</Text>
              <Text style={styles.reviewValue}>{fmtShares(sharesNum)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Price Per Share</Text>
              <Text style={styles.reviewValue}>${fmt(currentPrice)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>
                {tradeMode === 'buy' ? 'Estimated Total' : 'Estimated Proceeds'}
              </Text>
              <Text style={[styles.reviewValue, { fontWeight: '700' }]}>${fmt(totalCost)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>
                {tradeMode === 'buy' ? 'Buying Power After' : 'Shares Remaining'}
              </Text>
              <Text style={styles.reviewValue}>
                {tradeMode === 'buy' ? `$${fmt(buyingPowerAfter)}` : fmtShares(sharesAfter)}
              </Text>
            </View>

            <Text style={styles.disclaimer}>
              Market orders execute at the next available price and may differ slightly.
            </Text>

            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, tradeMode === 'sell' && styles.sellBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>
                    Confirm {tradeMode === 'buy' ? 'Buy' : 'Sell'}
                  </Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={() => setStep('input')}>
              <Text style={styles.ghostBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ─── Input step ──────────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {tradeMode === 'buy' ? 'Buy' : 'Sell'} {stock.ticker}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Buy / Sell toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleOption, tradeMode === 'buy' && styles.toggleActiveBuy]}
                onPress={() => { setTradeMode('buy'); setRawCents(''); setSharesInput(''); }}
              >
                <Text style={[styles.toggleText, tradeMode === 'buy' && styles.toggleTextActive]}>
                  Buy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, tradeMode === 'sell' && styles.toggleActiveSell]}
                onPress={() => { setTradeMode('sell'); setRawCents(''); setSharesInput(''); }}
              >
                <Text style={[styles.toggleText, tradeMode === 'sell' && styles.toggleTextActiveSell]}>
                  Sell
                </Text>
              </TouchableOpacity>
            </View>

            {/* Stock info row */}
            <View style={styles.stockInfoRow}>
              <StockLogo stock={stock} size={40} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.stockInfoName} numberOfLines={1}>{stock.company_name}</Text>
                <Text style={styles.stockInfoTicker}>{stock.ticker}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.stockInfoPrice}>${fmt(currentPrice)}</Text>
                <Text style={[styles.stockInfoChange, { color: positive ? '#4DED30' : '#FF4458' }]}>
                  {positive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
                </Text>
              </View>
            </View>

            {/* Dollar / Shares toggle */}
            <View style={styles.inputModeToggle}>
              <TouchableOpacity
                style={[styles.inputModeBtn, inputMode === 'dollars' && styles.inputModeBtnActive]}
                onPress={() => { setInputMode('dollars'); setSharesInput(''); }}
              >
                <Text style={[styles.inputModeBtnText, inputMode === 'dollars' && styles.inputModeBtnTextActive]}>
                  $ Dollars
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputModeBtn, inputMode === 'shares' && styles.inputModeBtnActive]}
                onPress={() => { setInputMode('shares'); setRawCents(''); }}
              >
                <Text style={[styles.inputModeBtnText, inputMode === 'shares' && styles.inputModeBtnTextActive]}>
                  # Shares
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            {inputMode === 'dollars' ? (
              <TouchableOpacity
                style={styles.amountContainer}
                onPress={() => inputRef.current?.focus()}
                activeOpacity={1}
              >
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.amountInput}
                  value={rawCents ? formatDollars(rawCents) : ''}
                  onChangeText={handleDollarInput}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#3d3d5c"
                  selectionColor="#7c6af7"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.amountContainer}
                onPress={() => inputRef.current?.focus()}
                activeOpacity={1}
              >
                <TextInput
                  ref={inputRef}
                  style={styles.amountInput}
                  value={sharesInput}
                  onChangeText={setSharesInput}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#3d3d5c"
                  selectionColor="#7c6af7"
                />
                <Text style={styles.sharesLabel}>shares</Text>
              </TouchableOpacity>
            )}

            {/* Estimate */}
            <Text style={styles.estimateText}>
              {inputMode === 'dollars'
                ? (dollarAmount > 0 ? `≈ ${fmtShares(sharesFromDollars)} shares` : '')
                : (sharesNum > 0 ? `≈ $${fmt(totalCost)} total` : '')}
            </Text>

            {/* Available */}
            <Text style={styles.availableText}>
              {tradeMode === 'buy'
                ? `$${fmt(cashBalance)} buying power available`
                : `${fmtShares(ownedShares)} shares available to sell`}
            </Text>

            {/* Error */}
            {inputMode === 'dollars' && tradeMode === 'buy' && dollarAmount > cashBalance && dollarAmount > 0 && (
              <Text style={styles.errorText}>Amount exceeds buying power</Text>
            )}
            {tradeMode === 'sell' && sharesNum > ownedShares && sharesNum > 0 && (
              <Text style={styles.errorText}>
                {ownedShares === 0 ? 'You have no shares to sell' : 'Exceeds shares owned'}
              </Text>
            )}

            {/* Quick chips (buy + dollar mode only) */}
            {tradeMode === 'buy' && inputMode === 'dollars' && (
              <View style={styles.quickRow}>
                {QUICK_AMOUNTS.map(amt => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.quickChip}
                    onPress={() => handleQuick(amt)}
                  >
                    <Text style={styles.quickChipText}>
                      {amt >= 1000 ? `$${amt / 1000}K` : `$${amt}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Review button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                tradeMode === 'sell' && styles.sellBtn,
                !canProceed && styles.primaryBtnDisabled,
              ]}
              onPress={() => { setErrorMsg(null); setStep('review'); }}
              disabled={!canProceed}
            >
              <Text style={styles.primaryBtnText}>Review Order</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '92%',
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
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12122a',
    borderRadius: 20,
  },
  backArrow: {
    color: '#ffffff',
    fontSize: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActiveBuy: {
    backgroundColor: '#7c6af7',
  },
  toggleActiveSell: {
    backgroundColor: '#FF4458',
  },
  toggleText: {
    color: '#7878a0',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  toggleTextActiveSell: {
    color: '#ffffff',
  },
  stockInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22223a',
  },
  stockInfoName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  stockInfoTicker: {
    color: '#7c6af7',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  stockInfoPrice: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  stockInfoChange: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  inputModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#12122a',
    borderRadius: 10,
    padding: 3,
    marginBottom: 4,
    alignSelf: 'center',
  },
  inputModeBtn: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  inputModeBtnActive: {
    backgroundColor: '#2a2a4a',
  },
  inputModeBtnText: {
    color: '#7878a0',
    fontSize: 13,
    fontWeight: '600',
  },
  inputModeBtnTextActive: {
    color: '#ffffff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  dollarSign: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '300',
    marginRight: 4,
    paddingBottom: 2,
  },
  amountInput: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '700',
    minWidth: 80,
    letterSpacing: -1,
  },
  sharesLabel: {
    color: '#7878a0',
    fontSize: 20,
    fontWeight: '400',
    marginLeft: 8,
    alignSelf: 'flex-end',
    paddingBottom: 10,
  },
  estimateText: {
    color: '#7878a0',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    minHeight: 18,
  },
  availableText: {
    color: '#3d3d5c',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  errorText: {
    color: '#FF4458',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
  quickChip: {
    backgroundColor: '#12122a',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#22223a',
  },
  quickChipText: {
    color: '#7c6af7',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#7c6af7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  sellBtn: {
    backgroundColor: '#FF4458',
  },
  primaryBtnDisabled: {
    backgroundColor: '#3d3d5c',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ghostBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  ghostBtnText: {
    color: '#7878a0',
    fontSize: 15,
    fontWeight: '600',
  },
  // Review step
  sheetTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  reviewStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewStockName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  reviewStockTicker: {
    color: '#7c6af7',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  reviewOrderType: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  buyBadge: {
    backgroundColor: '#7c6af722',
    color: '#7c6af7',
  },
  sellBadge: {
    backgroundColor: '#FF445822',
    color: '#FF4458',
  },
  divider: {
    height: 1,
    backgroundColor: '#22223a',
    marginVertical: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewLabel: {
    color: '#7878a0',
    fontSize: 14,
  },
  reviewValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    color: '#3d3d5c',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  // Success step
  successContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7c6af722',
    borderWidth: 2,
    borderColor: '#7c6af7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  checkMark: {
    width: 28,
    height: 22,
    position: 'relative',
  },
  checkLine: {
    position: 'absolute',
    backgroundColor: '#7c6af7',
    borderRadius: 2,
    height: 3,
  },
  checkLineShort: {
    width: 10,
    bottom: 0,
    left: 0,
    transform: [{ rotate: '45deg' }, { translateY: -4 }],
  },
  checkLineLong: {
    width: 18,
    bottom: 6,
    right: 0,
    transform: [{ rotate: '-55deg' }],
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  successSub: {
    color: '#7878a0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  successAmount: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
});
