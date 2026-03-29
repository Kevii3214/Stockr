import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useStockData } from '../context/StockDataContext';
import { StockFundamentals, StockWithLive } from '../types/stock';
import Sparkline from './Sparkline';

const FINNHUB_KEY = process.env.EXPO_PUBLIC_FINNHUB_API_KEY ?? '';

interface StockCardProps {
  stock: StockWithLive;
  cardHeight: number;
  initialShowDetails?: boolean;
  onClose?: () => void;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBar({ width, height = 14 }: { width: number | string; height?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    return () => opacity.stopAnimation();
  }, []);
  return (
    <Animated.View
      style={{ width, height, borderRadius: 6, backgroundColor: '#2a2a4a', opacity } as any}
    />
  );
}

// ─── Logo fallback ────────────────────────────────────────────────────────────

function LogoFallback({ ticker }: { ticker: string }) {
  const palette = ['#7c6af7', '#4a90e2', '#50c878', '#e8657a', '#f4a234', '#6bcb77'];
  const color = palette[ticker.charCodeAt(0) % palette.length];
  return (
    <View style={[styles.logo, { backgroundColor: color, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{ticker[0]}</Text>
    </View>
  );
}

// ─── Range bar ────────────────────────────────────────────────────────────────

function RangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const range = high - low;
  const pct = range > 0 ? Math.max(0, Math.min(1, (current - low) / range)) : 0.5;
  return (
    <View style={detailStyles.rangeTrack}>
      <View style={[detailStyles.rangeFill, { width: `${pct * 100}%` as any }]} />
      <View style={[detailStyles.rangeDot, { left: `${pct * 100}%` as any }]} />
    </View>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────

const fmtPrice = (v: number | undefined | null) =>
  v == null ? '—' : `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtMarketCap = (v: number | null) => {
  if (v == null) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}T`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}B`;
  return `$${v.toFixed(0)}M`;
};

const fmtDecimal = (v: number | null, d = 1) => v == null ? '—' : v.toFixed(d);
const fmtPct     = (v: number | null)         => v == null ? '—' : `${v.toFixed(2)}%`;
const fmtVolume  = (v: number | null)         => v == null ? '—' : `${v.toFixed(1)}M`;

const fmtUpdated = (iso: string) => {
  try {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days === 0) return 'Updated today';
    if (days === 1) return 'Updated yesterday';
    return `Updated ${days}d ago`;
  } catch { return ''; }
};

function marketCapLabel(mc: number | null): string {
  if (mc == null) return '';
  if (mc >= 200_000) return 'Mega Cap';
  if (mc >= 10_000)  return 'Large Cap';
  if (mc >= 2_000)   return 'Mid Cap';
  if (mc >= 300)     return 'Small Cap';
  return 'Micro Cap';
}

function betaLabel(beta: number | null): { label: string; color: string } {
  if (beta == null) return { label: '', color: '#7878a0' };
  if (beta < 0.8)   return { label: 'Low Volatility', color: '#4DED30' };
  if (beta <= 1.2)  return { label: 'Market-Like', color: '#f4a234' };
  return { label: 'High Volatility', color: '#FF4458' };
}

// ─── Detail section header ────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={detailStyles.sectionHeader}>{title}</Text>;
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function InfoRow({
  label, value, hint, valueColor,
}: {
  label: string; value: string; hint: string; valueColor?: string;
}) {
  return (
    <View style={detailStyles.infoRow}>
      <View style={detailStyles.infoRowLeft}>
        <Text style={detailStyles.infoRowLabel}>{label}</Text>
        <Text style={detailStyles.infoRowHint}>{hint}</Text>
      </View>
      <Text style={[detailStyles.infoRowValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Details tab content ──────────────────────────────────────────────────────

function DetailsContent({
  live, fundamentals, description,
}: {
  live: StockWithLive['live'];
  fundamentals: StockFundamentals | null;
  description: string | null;
}) {
  const hasDayRange = live?.dayLow != null && live?.dayHigh != null && live.dayLow > 0 && live.dayHigh > 0;
  const has52Range  = fundamentals?.weekLow52 != null && fundamentals?.weekHigh52 != null;
  const betaInfo    = betaLabel(fundamentals?.beta ?? null);

  return (
    <View>
      {/* ── Price Action ── */}
      <SectionHeader title="Price Action" />

      {hasDayRange && live ? (
        <View style={detailStyles.rangeBlock}>
          <View style={detailStyles.rangeLabelRow}>
            <Text style={detailStyles.rangeSublabel}>Today's Range</Text>
            <Text style={detailStyles.rangeEnds}>{fmtPrice(live.dayLow)} — {fmtPrice(live.dayHigh)}</Text>
          </View>
          <RangeBar low={live.dayLow!} high={live.dayHigh!} current={live.price} />
          <Text style={detailStyles.rangeHint}>Where the price has moved so far today.</Text>
        </View>
      ) : null}

      {has52Range && fundamentals ? (
        <View style={detailStyles.rangeBlock}>
          <View style={detailStyles.rangeLabelRow}>
            <Text style={detailStyles.rangeSublabel}>52-Week Range</Text>
            <Text style={detailStyles.rangeEnds}>
              {fmtPrice(fundamentals.weekLow52)} — {fmtPrice(fundamentals.weekHigh52)}
            </Text>
          </View>
          <RangeBar low={fundamentals.weekLow52!} high={fundamentals.weekHigh52!} current={live?.price ?? 0} />
          <Text style={detailStyles.rangeHint}>Highest and lowest price over the past year.</Text>
        </View>
      ) : null}

      <View style={detailStyles.rowGroup}>
        <InfoRow label="Open" value={fmtPrice(live?.open)} hint="Price when the market opened today." />
        <InfoRow label="Prev. Close" value={fmtPrice(live?.prevClose)} hint="Yesterday's close — used to calculate today's % change." />
      </View>

      <View style={detailStyles.divider} />

      {/* ── Valuation ── */}
      <SectionHeader title="Valuation" />
      <View style={detailStyles.rowGroup}>
        <InfoRow
          label="Market Cap"
          value={fundamentals
            ? `${fmtMarketCap(fundamentals.marketCap)}${marketCapLabel(fundamentals.marketCap) ? `  (${marketCapLabel(fundamentals.marketCap)})` : ''}`
            : '—'}
          hint="Total market value of all shares. Large-cap = more stable; small-cap = more risk/growth."
        />
        <InfoRow
          label="P/E Ratio"
          value={fundamentals ? fmtDecimal(fundamentals.peRatio) : '—'}
          hint="How much you pay for $1 of profit. Compare within the same industry."
        />
        <InfoRow
          label="EPS"
          value={fundamentals ? fmtPrice(fundamentals.eps) : '—'}
          hint="Earnings Per Share — profit divided by shares outstanding. Higher is better."
        />
        <InfoRow
          label="Dividend Yield"
          value={fundamentals ? fmtPct(fundamentals.dividendYield) : '—'}
          hint="Annual dividend as % of price. Income paid just for holding the stock."
          valueColor={fundamentals?.dividendYield != null && fundamentals.dividendYield > 0 ? '#4DED30' : undefined}
        />
      </View>

      <View style={detailStyles.divider} />

      {/* ── Risk & Activity ── */}
      <SectionHeader title="Risk & Activity" />
      <View style={detailStyles.rowGroup}>
        <InfoRow
          label="Beta"
          value={fundamentals?.beta != null ? `${fmtDecimal(fundamentals.beta, 2)}  ${betaInfo.label}` : '—'}
          hint="Volatility vs the market. < 1 = calmer than S&P 500. > 1 = more volatile."
          valueColor={betaInfo.color}
        />
        <InfoRow
          label="Avg. Volume (10d)"
          value={fundamentals ? `${fmtVolume(fundamentals.avgVolume10d)}M shares` : '—'}
          hint="Average daily shares traded. High volume = easier to buy or sell quickly."
        />
      </View>

      {/* ── About ── */}
      {description ? (
        <>
          <View style={detailStyles.divider} />
          <SectionHeader title="About" />
          <Text style={detailStyles.aboutText}>{description}</Text>
        </>
      ) : null}

      {fundamentals?.updatedAt ? (
        <Text style={detailStyles.freshness}>{fmtUpdated(fundamentals.updatedAt)}</Text>
      ) : null}

      <View style={{ height: 16 }} />
    </View>
  );
}

// ─── StockCard ────────────────────────────────────────────────────────────────

export default function StockCard({ stock, cardHeight, initialShowDetails = false, onClose }: StockCardProps) {
  const [logoError, setLogoError] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);
  const [showDetails, setShowDetails] = useState(initialShowDetails);
  const [fetchedFundamentals, setFetchedFundamentals] = useState<StockFundamentals | null>(null);
  const fetchedRef = useRef(false);

  const { stocks: liveStocks } = useStockData();
  const liveEntry    = liveStocks.find(s => s.ticker === stock.ticker);
  const live         = liveEntry?.live ?? stock.live;
  const fundamentals = liveEntry?.fundamentals ?? stock.fundamentals ?? fetchedFundamentals;
  const positive     = live ? live.changePercent >= 0 : true;
  const priceColor   = positive ? '#4DED30' : '#FF4458';

  const chartHeight = Math.max(Math.floor(cardHeight * 0.22), 55);

  // Overview section animates between a "full card" height and a compact height
  const overviewExpanded  = cardHeight - 80;
  const overviewCollapsed = Math.floor(cardHeight * 0.44);
  const overviewAnim = useRef(new Animated.Value(
    initialShowDetails ? overviewCollapsed : overviewExpanded
  )).current;

  // When the details tab is opened and no fundamentals are in the DB, fetch from Finnhub directly
  useEffect(() => {
    if (!showDetails || fundamentals || fetchedRef.current || !FINNHUB_KEY) return;
    fetchedRef.current = true;
    fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${stock.ticker}&metric=all&token=${FINNHUB_KEY}`)
      .then(r => r.json())
      .then(json => {
        const m = json?.metric ?? {};
        const n = (v: unknown): number | null => (typeof v === 'number' && isFinite(v)) ? v : null;
        setFetchedFundamentals({
          weekHigh52:    n(m['52WeekHigh']),
          weekLow52:     n(m['52WeekLow']),
          peRatio:       n(m['peNormalizedAnnual']),
          marketCap:     n(m['marketCapitalization']),
          eps:           n(m['epsNormalizedAnnual']),
          beta:          n(m['beta']),
          dividendYield: n(m['dividendYieldIndicatedAnnual']),
          avgVolume10d:  n(m['10DayAverageTradingVolume']),
          updatedAt:     new Date().toISOString(),
        });
      })
      .catch(() => {});
  }, [showDetails]);

  const handleInfoPress = () => {
    // If onClose is provided and details are showing, ✕ exits the whole view
    if (showDetails && onClose) {
      onClose();
      return;
    }
    setShowDetails(v => !v);
    Animated.spring(overviewAnim, {
      toValue: showDetails ? overviewExpanded : overviewCollapsed,
      useNativeDriver: false,
      friction: 9,
      tension: 60,
    }).start();
  };

  return (
    <View style={[styles.card, { height: cardHeight }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          {!logoError && stock.logo_url ? (
            <Image
              source={{ uri: stock.logo_url }}
              style={styles.logo}
              onError={() => setLogoError(true)}
              resizeMode="contain"
            />
          ) : (
            <LogoFallback ticker={stock.ticker} />
          )}
        </View>

        <View style={styles.headerText}>
          <Text style={styles.companyName} numberOfLines={1}>{stock.company_name}</Text>
          <Text style={styles.ticker}>{stock.ticker}</Text>
        </View>

        {stock.sector ? (
          <View style={styles.sectorBadge}>
            <Text style={styles.sectorText} numberOfLines={1}>{stock.sector}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Overview ── */}
      <Animated.View style={[styles.overviewSection, { height: overviewAnim, overflow: 'hidden' }]}>

        {/* Price */}
        <View style={styles.priceSection}>
          {live ? (
            <>
              <Text style={styles.price}>
                ${live.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={styles.changeRow}>
                <Text style={[styles.changePct, { color: priceColor }]}>
                  {positive ? '▲' : '▼'} {Math.abs(live.changePercent).toFixed(2)}%
                </Text>
                <Text style={[styles.changeAbs, { color: priceColor }]}>
                  ({live.changePercent >= 0 ? '+' : ''}{(live.price - live.prevClose).toFixed(2)})
                </Text>
              </View>
            </>
          ) : (
            <View style={{ gap: 10 }}>
              <SkeletonBar width={130} height={38} />
              <SkeletonBar width={90} height={18} />
            </View>
          )}
        </View>

        {/* Chart */}
        <View
          style={{ height: chartHeight, borderRadius: 8, overflow: 'hidden' }}
          onLayout={e => setChartWidth(e.nativeEvent.layout.width)}
        >
          {live && chartWidth > 0 ? (
            <Sparkline data={live.candles} width={chartWidth} height={chartHeight} positive={positive} />
          ) : (
            <SkeletonBar width="100%" height={chartHeight} />
          )}
        </View>

        {/* Description */}
        <View>
          {stock.description ? (
            <Text style={styles.description} numberOfLines={3}>{stock.description}</Text>
          ) : (
            <View style={{ gap: 7 }}>
              <SkeletonBar width="100%" height={12} />
              <SkeletonBar width="82%" height={12} />
              <SkeletonBar width="65%" height={12} />
            </View>
          )}
        </View>

      </Animated.View>

      {/* ── Details (dedicated scroll area filling remaining card space) ── */}
      {showDetails && (
        <>
          <View style={styles.detailsDivider} />
          <ScrollView
            style={styles.detailsScroll}
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            <DetailsContent
              live={live}
              fundamentals={fundamentals}
              description={stock.description}
            />
          </ScrollView>
        </>
      )}

      {/* ── Info button ── */}
      <TouchableOpacity
        style={styles.infoBtn}
        onPress={handleInfoPress}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.infoBtnText}>{showDetails ? '✕' : 'i'}</Text>
      </TouchableOpacity>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#16162a',
    borderWidth: 1,
    borderColor: '#22223a',
    padding: 20,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#1e1e38',
  },
  logo: {
    width: 48,
    height: 48,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  companyName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ticker: {
    color: '#7c6af7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  sectorBadge: {
    backgroundColor: '#22223a',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    maxWidth: 100,
  },
  sectorText: {
    color: '#7878a0',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  // ── Details scroll area ──
  detailsScroll: {
    flex: 1,
  },
  detailsScrollContent: {
    paddingBottom: 44,
  },
  overviewSection: {
    gap: 14,
    paddingTop: 16,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#22223a',
    marginVertical: 20,
  },
  // ── Info button ──
  infoBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e1e38',
    borderWidth: 1,
    borderColor: '#7c6af7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: {
    color: '#7c6af7',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  // ── Overview content ──
  priceSection: {
    gap: 4,
  },
  price: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 46,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changePct: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  changeAbs: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.75,
  },
  description: {
    color: '#7878a0',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
});

// ─── Detail tab styles ────────────────────────────────────────────────────────

const detailStyles = StyleSheet.create({
  sectionHeader: {
    color: '#7878a0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#22223a',
    marginVertical: 16,
  },
  // ── Range ──
  rangeBlock: {
    marginBottom: 14,
    gap: 6,
  },
  rangeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeSublabel: {
    color: '#a0a0c0',
    fontSize: 13,
    fontWeight: '600',
  },
  rangeEnds: {
    color: '#7878a0',
    fontSize: 11,
    fontWeight: '500',
  },
  rangeHint: {
    color: '#44445a',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  rangeTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2a2a4a',
    position: 'relative',
    overflow: 'visible',
  },
  rangeFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
    backgroundColor: '#7c6af7',
  },
  rangeDot: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7c6af7',
    marginLeft: -6,
    borderWidth: 2,
    borderColor: '#16162a',
  },
  // ── Info rows ──
  rowGroup: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e38',
    gap: 12,
  },
  infoRowLeft: {
    flex: 1,
    gap: 3,
  },
  infoRowLabel: {
    color: '#c0c0e0',
    fontSize: 13,
    fontWeight: '600',
  },
  infoRowHint: {
    color: '#44445a',
    fontSize: 11,
    lineHeight: 15,
  },
  infoRowValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: 150,
    flexShrink: 0,
  },
  // ── About ──
  aboutText: {
    color: '#8080a0',
    fontSize: 13,
    lineHeight: 20,
  },
  freshness: {
    color: '#44445a',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 0.3,
  },
});
