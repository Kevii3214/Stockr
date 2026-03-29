import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BuyModal from '../components/BuyModal';
import DepositModal from '../components/DepositModal';
import PieChart, { PieSlice } from '../components/PieChart';
import { HoldingWithLive, usePortfolio } from '../context/PortfolioContext';
import { useStockData } from '../context/StockDataContext';
import { StockWithLive } from '../types/stock';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtShares(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

const HOLDING_COLORS = [
  '#4DED30', '#4a90e2', '#f5a623', '#e74c3c',
  '#50c878', '#8e44ad', '#f39c12', '#16a085', '#2980b9',
];

// ─── Empty state icon ─────────────────────────────────────────────────────────

function ChartIcon() {
  return (
    <View style={{ width: 64, height: 52, flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginBottom: 4 }}>
      {([20, 36, 28, 44, 32] as number[]).map((h, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: h,
            backgroundColor: i === 3 ? '#7c6af7' : '#22223a',
            borderRadius: 4,
            opacity: i === 3 ? 1 : 0.6,
          }}
        />
      ))}
    </View>
  );
}

// ─── Stock Logo ───────────────────────────────────────────────────────────────

function StockLogo({ holding, size = 40 }: { holding: HoldingWithLive; size?: number }) {
  const [failed, setFailed] = useState(false);
  const sectorColors = ['#4a90e2', '#50c878', '#f5a623', '#e74c3c', '#f39c12'];
  const fallbackColor = sectorColors[holding.ticker.charCodeAt(0) % sectorColors.length];

  if (!holding.logoUrl || failed) {
    return (
      <View style={{
        width: size, height: size, borderRadius: size / 5,
        backgroundColor: fallbackColor, alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: 'bold' }}>
          {holding.ticker[0]}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: holding.logoUrl }}
      style={{ width: size, height: size, borderRadius: size / 5 }}
      onError={() => setFailed(true)}
    />
  );
}

// ─── Position Row ─────────────────────────────────────────────────────────────

function PositionRow({
  holding,
  onSell,
}: {
  holding: HoldingWithLive;
  onSell: () => void;
}) {
  const plPositive = holding.plDollar >= 0;
  return (
    <View style={styles.positionRow}>
      <StockLogo holding={holding} size={42} />
      <View style={styles.positionInfo}>
        <Text style={styles.positionCompany} numberOfLines={1}>{holding.companyName}</Text>
        <Text style={styles.positionTicker}>{holding.ticker}</Text>
        <Text style={styles.positionCost}>
          {fmtShares(holding.shares)} shares · avg ${fmt(holding.avgCost)}
        </Text>
      </View>
      <View style={styles.positionRight}>
        <Text style={styles.positionValue}>${fmt(holding.currentValue)}</Text>
        <Text style={[styles.positionPL, { color: plPositive ? '#4DED30' : '#FF4458' }]}>
          {plPositive ? '+' : ''}${fmt(holding.plDollar)} ({plPositive ? '+' : ''}{fmt(holding.plPercent)}%)
        </Text>
        <TouchableOpacity style={styles.sellBtn} onPress={onSell} activeOpacity={0.8}>
          <Text style={styles.sellBtnText}>Sell</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PortfolioScreen() {
  const {
    cashBalance,
    holdings,
    holdingsLoading,
    totalInvested,
    totalCurrentValue,
    totalPortfolioValue,
    totalPLDollar,
    totalPLPercent,
    getAllHoldingsWithLive,
  } = usePortfolio();

  const [depositVisible, setDepositVisible] = useState(false);
  const [sellStock, setSellStock] = useState<StockWithLive | null>(null);
  const { stocks } = useStockData();

  const holdingsWithLive = getAllHoldingsWithLive();
  const isEmpty = cashBalance === 0 && holdings.length === 0;
  const hasHoldings = holdingsWithLive.length > 0;
  const plPositive = totalPLDollar >= 0;

  // ─── Build pie slices ──────────────────────────────────────────────────────

  const pieSlices: PieSlice[] = [];
  if (cashBalance > 0) {
    pieSlices.push({ label: 'Cash', value: cashBalance, color: '#7c6af7' });
  }
  [...holdingsWithLive]
    .sort((a, b) => b.currentValue - a.currentValue)
    .forEach((h, i) => {
      pieSlices.push({
        label: h.ticker,
        value: h.currentValue,
        color: HOLDING_COLORS[i % HOLDING_COLORS.length],
      });
    });

  // ─── Empty state ───────────────────────────────────────────────────────────

  if (isEmpty) {
    return (
      <View style={styles.emptyRoot}>
        <View style={styles.emptyContent}>
          <View style={styles.iconWrapper}>
            <ChartIcon />
          </View>
          <Text style={styles.emptyTitle}>No positions yet</Text>
          <Text style={styles.emptySubtitle}>
            Deposit money to start paper trading{'\n'}with real market prices
          </Text>
          <TouchableOpacity style={styles.bigDepositBtn} onPress={() => setDepositVisible(true)}>
            <Text style={styles.bigDepositBtnText}>Deposit Money</Text>
          </TouchableOpacity>
        </View>
        <DepositModal visible={depositVisible} onClose={() => setDepositVisible(false)} />
      </View>
    );
  }

  // ─── Main portfolio view ───────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <TouchableOpacity style={styles.smallDepositBtn} onPress={() => setDepositVisible(true)}>
          <Text style={styles.smallDepositBtnText}>+ Deposit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, width: '100%' }} showsVerticalScrollIndicator={false}>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Value</Text>
          <Text style={styles.balanceAmount}>${fmt(totalPortfolioValue)}</Text>
          <View style={styles.balanceMeta}>
            <View style={styles.balanceMetaItem}>
              <Text style={styles.balanceMetaLabel}>Cash</Text>
              <Text style={styles.balanceMetaValue}>${fmt(cashBalance)}</Text>
            </View>
            <View style={styles.balanceMetaDivider} />
            <View style={styles.balanceMetaItem}>
              <Text style={styles.balanceMetaLabel}>Invested</Text>
              <Text style={styles.balanceMetaValue}>${fmt(totalInvested)}</Text>
            </View>
            <View style={styles.balanceMetaDivider} />
            <View style={styles.balanceMetaItem}>
              <Text style={styles.balanceMetaLabel}>Total P&L</Text>
              {hasHoldings ? (
                <Text style={[styles.balanceMetaValue, { color: plPositive ? '#4DED30' : '#FF4458' }]}>
                  {plPositive ? '+' : ''}${fmt(Math.abs(totalPLDollar))}
                </Text>
              ) : (
                <Text style={[styles.balanceMetaValue, { color: '#7878a0' }]}>—</Text>
              )}
            </View>
          </View>
        </View>

        {/* Pie chart */}
        {hasHoldings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allocation</Text>
            <View style={styles.chartCard}>
              <PieChart slices={pieSlices} size={220} innerRadius={64} />
            </View>
          </View>
        )}

        {/* Positions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Positions</Text>

          {holdingsLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#7c6af7" />
            </View>
          ) : !hasHoldings ? (
            <View style={styles.emptyPositions}>
              <Text style={styles.emptyPositionsText}>
                No open positions.{'\n'}Start buying stocks from the Watchlist tab.
              </Text>
            </View>
          ) : (
            holdingsWithLive.map(h => {
              const liveStock = stocks.find(s => s.ticker === h.ticker) ?? null;
              return (
                <PositionRow
                  key={h.ticker}
                  holding={h}
                  onSell={() => setSellStock(liveStock)}
                />
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <DepositModal visible={depositVisible} onClose={() => setDepositVisible(false)} />
      <BuyModal
        visible={!!sellStock}
        stock={sellStock}
        onClose={() => setSellStock(null)}
        mode="sell"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  emptyRoot: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#12122a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#22223a',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  emptySubtitle: {
    color: '#7878a0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  bigDepositBtn: {
    backgroundColor: '#7c6af7',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 56,
    shadowColor: '#7c6af7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  bigDepositBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: '100%',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  smallDepositBtn: {
    backgroundColor: '#7c6af7',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  smallDepositBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  balanceCard: {
    backgroundColor: '#12122a',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#22223a',
  },
  balanceLabel: {
    color: '#7878a0',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  balanceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceMetaLabel: {
    color: '#7878a0',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  balanceMetaValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceMetaDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#22223a',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  chartCard: {
    backgroundColor: '#12122a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22223a',
  },
  emptyPositions: {
    backgroundColor: '#12122a',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#22223a',
  },
  emptyPositionsText: {
    color: '#7878a0',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  // Position row
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16162a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  positionInfo: {
    flex: 1,
    gap: 2,
  },
  positionCompany: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  positionTicker: {
    color: '#7c6af7',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  positionCost: {
    color: '#7878a0',
    fontSize: 11,
    marginTop: 2,
  },
  positionRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  positionValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  positionPL: {
    fontSize: 11,
    fontWeight: '600',
  },
  sellBtn: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: '#FF4458',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  sellBtnText: {
    color: '#FF4458',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
