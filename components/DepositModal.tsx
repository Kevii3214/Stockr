import React, { useRef, useState } from 'react';
import {
  Animated,
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

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Mode = 'deposit' | 'withdraw';

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

function formatDollars(cents: string): string {
  const digits = cents.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDollars(formatted: string): number {
  return parseFloat(formatted.replace(/,/g, '')) || 0;
}

export default function DepositModal({ visible, onClose }: Props) {
  const { cashBalance, deposit, withdraw } = usePortfolio();
  const [mode, setMode] = useState<Mode>('deposit');
  const [rawCents, setRawCents] = useState('');
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const displayAmount = rawCents ? formatDollars(rawCents) : '0.00';
  const numericAmount = parseDollars(displayAmount);

  const handleInput = (text: string) => {
    const digits = text.replace(/\D/g, '');
    setRawCents(digits);
  };

  const handleQuick = (amount: number) => {
    setRawCents(String(amount * 100));
  };

  const reset = () => {
    setRawCents('');
    setConfirming(false);
    setMode('deposit');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleReview = () => {
    if (numericAmount <= 0) return;
    setConfirming(true);
  };

  const handleConfirm = async () => {
    if (mode === 'deposit') {
      await deposit(numericAmount);
    } else {
      await withdraw(numericAmount);
    }
    reset();
    onClose();
  };

  const handleQuickDeposit = async () => {
    await deposit(25000);
    reset();
    onClose();
  };

  const arrival = mode === 'deposit' ? '1–3 business days' : '3–5 business days';
  const canConfirm = numericAmount > 0 && (mode === 'deposit' || numericAmount <= cashBalance);

  if (confirming) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>Review Transfer</Text>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>{mode === 'deposit' ? 'Deposit' : 'Withdrawal'}</Text>
              <Text style={styles.reviewValue}>${displayAmount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>From</Text>
              <Text style={styles.reviewValue}>Chase Bank ••••1234</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>To</Text>
              <Text style={styles.reviewValue}>Stockr Account</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Estimated Arrival</Text>
              <Text style={styles.reviewValue}>{arrival}</Text>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm}>
              <Text style={styles.primaryBtnText}>
                Confirm {mode === 'deposit' ? 'Deposit' : 'Withdrawal'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={() => setConfirming(false)}>
              <Text style={styles.ghostBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

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
            <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Transfer Money</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Mode toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleOption, mode === 'deposit' && styles.toggleActive]}
                onPress={() => setMode('deposit')}
              >
                <Text style={[styles.toggleText, mode === 'deposit' && styles.toggleTextActive]}>
                  Deposit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, mode === 'withdraw' && styles.toggleActive]}
                onPress={() => setMode('withdraw')}
              >
                <Text style={[styles.toggleText, mode === 'withdraw' && styles.toggleTextActive]}>
                  Withdraw
                </Text>
              </TouchableOpacity>
            </View>

            {/* Transfer cards */}
            <View style={styles.transferSection}>
              <Text style={styles.transferLabel}>FROM</Text>
              <View style={styles.transferCard}>
                <View style={styles.bankIcon}>
                  <Text style={styles.bankIconText}>$</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transferCardTitle}>Chase Bank</Text>
                  <Text style={styles.transferCardSub}>Checking ••••1234</Text>
                </View>
                <View style={styles.chevron}>
                  <Text style={styles.chevronText}>›</Text>
                </View>
              </View>
            </View>

            <View style={[styles.transferSection, { marginTop: 8 }]}>
              <Text style={styles.transferLabel}>TO</Text>
              <View style={styles.transferCard}>
                <View style={[styles.bankIcon, { backgroundColor: '#2a2a4a' }]}>
                  <Text style={[styles.bankIconText, { color: '#7c6af7' }]}>S</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transferCardTitle}>Stockr Account</Text>
                  <Text style={styles.transferCardSub}>
                    Available: ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.chevron}>
                  <Text style={styles.chevronText}>›</Text>
                </View>
              </View>
            </View>

            {/* Amount input */}
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
                onChangeText={handleInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#3d3d5c"
                selectionColor="#7c6af7"
              />
            </TouchableOpacity>

            {mode === 'withdraw' && numericAmount > cashBalance && numericAmount > 0 && (
              <Text style={styles.errorText}>Amount exceeds available balance</Text>
            )}

            {/* Quick amounts */}
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

            {/* Arrival info */}
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>⏱</Text>
              <Text style={styles.infoText}>Estimated arrival: {arrival}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔒</Text>
              <Text style={styles.infoText}>Secured by 256-bit encryption</Text>
            </View>

            {/* Primary button */}
            <TouchableOpacity
              style={[styles.primaryBtn, !canConfirm && styles.primaryBtnDisabled]}
              onPress={handleReview}
              disabled={!canConfirm}
            >
              <Text style={styles.primaryBtnText}>Review Transfer</Text>
            </TouchableOpacity>

            {/* Dev testing button */}
            <TouchableOpacity style={styles.devBtn} onPress={handleQuickDeposit}>
              <Text style={styles.devBtnText}>Add $25,000 (Testing)</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
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
    marginBottom: 24,
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
  sheetTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: '#7c6af7',
  },
  toggleText: {
    color: '#7878a0',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  transferSection: {
    marginBottom: 4,
  },
  transferLabel: {
    color: '#7878a0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 2,
  },
  transferCard: {
    backgroundColor: '#12122a',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#22223a',
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankIconText: {
    color: '#4da6ff',
    fontSize: 18,
    fontWeight: '700',
  },
  transferCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  transferCardSub: {
    color: '#7878a0',
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    paddingLeft: 8,
  },
  chevronText: {
    color: '#3d3d5c',
    fontSize: 22,
    fontWeight: '300',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 8,
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
  errorText: {
    color: '#FF4458',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  quickChip: {
    backgroundColor: '#12122a',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#22223a',
  },
  quickChipText: {
    color: '#7c6af7',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoText: {
    color: '#7878a0',
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: '#7c6af7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
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
    marginTop: 8,
  },
  ghostBtnText: {
    color: '#7878a0',
    fontSize: 15,
    fontWeight: '600',
  },
  devBtn: {
    marginTop: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22223a',
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  devBtnText: {
    color: '#3d3d5c',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#22223a',
    marginVertical: 14,
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
});
