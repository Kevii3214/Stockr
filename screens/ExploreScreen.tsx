import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BuyModal from '../components/BuyModal';
import CreatePostModal from '../components/CreatePostModal';
import PlanTab from '../components/PlanTab';
import PostCard from '../components/PostCard';
import StockDetailModal from '../components/StockDetailModal';
import { usePosts } from '../context/PostsContext';
import { useStockData } from '../context/StockDataContext';
import { Stock, StockWithLive } from '../types/stock';

type SubTab = 'foryou' | 'browse' | 'learn' | 'plan';

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

function formatPrice(price: number) {
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── For You Feed ─────────────────────────────────────────────────────────────

function ForYouFeed({ onTickerPress }: { onTickerPress: (ticker: string) => void }) {
  const { posts, loading, refresh, likePost, unlikePost } = usePosts();
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <CreatePostModal visible={showCreate} onClose={() => { setShowCreate(false); refresh(); }} />

      {loading && posts.length === 0 ? (
        <View style={styles.centeredLoader}>
          <ActivityIndicator color="#7c6af7" size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.feedList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7c6af7"
              colors={['#7c6af7']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedIcon}>📈</Text>
              <Text style={styles.emptyFeedTitle}>No posts yet</Text>
              <Text style={styles.emptyFeedSub}>Be the first to share a market take</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={() => item.liked ? unlikePost(item.id) : likePost(item.id)}
              onTickerPress={onTickerPress}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreate(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Browse Tab ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ['All', 'Stocks', 'ETFs', 'Crypto'] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

function BrowseTab({ onStockPress }: { onStockPress: (stock: StockWithLive) => void }) {
  const { stocks } = useStockData();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filter, setFilter] = useState<FilterOption>('All');

  const q = query.trim().toLowerCase();

  const filtered = stocks.filter(s => {
    const matchesQuery = q.length === 0 ||
      s.ticker.toLowerCase().includes(q) ||
      s.company_name.toLowerCase().includes(q);

    let matchesFilter = true;
    if (filter === 'ETFs') matchesFilter = s.sector === 'ETF';
    else if (filter === 'Crypto') matchesFilter = s.sector === 'Cryptocurrency';
    else if (filter === 'Stocks') matchesFilter = s.sector !== 'ETF' && s.sector !== 'Cryptocurrency';

    return matchesQuery && matchesFilter;
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Search bar */}
      <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
        <View style={styles.searchIcon}>
          <View style={styles.searchCircle} />
          <View style={styles.searchHandle} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stocks, ETFs, crypto..."
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

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.filterChip, filter === opt && styles.filterChipActive]}
            onPress={() => setFilter(opt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filter === opt && styles.filterChipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stock list */}
      <FlatList
        data={filtered}
        keyExtractor={s => s.ticker}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.browseList}
        ListEmptyComponent={
          <Text style={styles.noResults}>No stocks match "{query}"</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.stockRow} onPress={() => onStockPress(item)} activeOpacity={0.75}>
            <StockLogo stock={item} size={44} />
            <View style={styles.stockRowInfo}>
              <Text style={styles.stockRowName} numberOfLines={1}>{item.company_name}</Text>
              <Text style={styles.stockRowTicker}>{item.ticker}</Text>
            </View>
            <View style={styles.stockRowRight}>
              {item.live ? (
                <>
                  <Text style={styles.stockRowPrice}>{formatPrice(item.live.price)}</Text>
                  <Text style={[styles.stockRowChange, { color: item.live.changePercent >= 0 ? '#4DED30' : '#FF4458' }]}>
                    {item.live.changePercent >= 0 ? '▲' : '▼'} {Math.abs(item.live.changePercent).toFixed(2)}%
                  </Text>
                </>
              ) : (
                <ActivityIndicator size="small" color="#3d3d5c" />
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ─── Learn Tab ────────────────────────────────────────────────────────────────

interface Lesson {
  title: string;
  body: string;
  formula?: string;
  example?: string;
}

interface Module {
  id: string;
  title: string;
  color: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string[];
  lessons: Lesson[];
}

const MODULES: Module[] = [
  {
    id: 'risk',
    title: 'Risk & Volatility',
    color: '#e74c3c',
    icon: '⚡',
    difficulty: 'Intermediate',
    topics: ['Sharpe Ratio', 'Max Drawdown', 'Beta'],
    lessons: [
      {
        title: 'Sharpe & Sortino Ratios',
        body: 'The Sharpe ratio measures return per unit of total risk. It compares excess return (portfolio return minus risk-free rate) to the portfolio\'s standard deviation. A Sharpe above 1.0 is considered good; above 2.0 is excellent.\n\nThe Sortino ratio improves on Sharpe by penalizing only downside deviation — the volatility of negative returns — rather than all volatility. This matters because investors generally don\'t mind upside volatility. A high Sortino with a lower Sharpe suggests your portfolio has good upside-skewed volatility.\n\nFor practical use: compare Sharpe ratios across funds or strategies with similar time frames. Always annualize both return and volatility (multiply daily vol by √252).',
        formula: 'Sharpe = (Rp − Rf) / σp\nSortino = (Rp − Rf) / σ_downside',
        example: 'Portfolio returns 12% annually, risk-free rate is 5%, std dev is 10%.\nSharpe = (12% − 5%) / 10% = 0.7',
      },
      {
        title: 'Beta & Systematic Risk',
        body: 'Beta measures a stock\'s sensitivity to market movements. A beta of 1.0 moves in lockstep with the market. Beta > 1 amplifies moves; beta < 1 dampens them. Negative beta assets (e.g., gold, some bonds) tend to move opposite the market.\n\nBeta only captures systematic (market) risk — risk you can\'t diversify away. Unsystematic (idiosyncratic) risk is company-specific and can be reduced through diversification. The Capital Asset Pricing Model (CAPM) states that investors are only compensated for systematic risk.\n\nHigh-beta portfolios tend to outperform in bull markets and underperform sharply in bear markets. Knowing your portfolio\'s weighted-average beta gives you a quick read on market sensitivity.',
        formula: 'Expected Return = Rf + β × (Rm − Rf)',
        example: 'AAPL beta = 1.3. If market drops 10%, expect AAPL to drop ~13%.\nIf market rises 8%, expect AAPL to rise ~10.4%.',
      },
      {
        title: 'Max Drawdown & Value at Risk',
        body: 'Max drawdown (MDD) is the largest peak-to-trough decline in a portfolio\'s value over a given period. It\'s a critical risk metric for evaluating "how bad can it get?" A portfolio with a 30% MDD could require a ~43% recovery just to return to peak.\n\nValue at Risk (VaR) estimates the maximum loss over a time horizon at a given confidence level. A daily 95% VaR of $1,000 means there\'s a 5% chance of losing more than $1,000 in a single day. Conditional VaR (CVaR / Expected Shortfall) goes further: it averages the losses in that worst 5%, giving a better picture of tail risk.\n\nThese metrics are most useful when comparing strategies or stress-testing portfolio construction decisions.',
        formula: 'MDD = (Trough Value − Peak Value) / Peak Value',
        example: 'Portfolio peaks at $100K, drops to $65K.\nMDD = ($65K − $100K) / $100K = −35%\nRequired recovery to break even = 1/0.65 − 1 = +53.8%',
      },
    ],
  },
  {
    id: 'portfolio',
    title: 'Portfolio Theory',
    color: '#7c6af7',
    icon: '◎',
    difficulty: 'Advanced',
    topics: ['Efficient Frontier', 'Correlation', 'Factor Investing'],
    lessons: [
      {
        title: 'Modern Portfolio Theory',
        body: 'Harry Markowitz\'s Modern Portfolio Theory (MPT) argues that for any given level of return, there exists an optimal portfolio that minimizes risk — and vice versa. These optimal portfolios form the "efficient frontier."\n\nThe key insight is that combining assets with low or negative correlation reduces total portfolio volatility without proportionally reducing returns. Two assets each with 20% volatility can form a portfolio with less than 20% volatility if they don\'t move in lockstep.\n\nIn practice, MPT has limitations: correlations spike during crises (when diversification is needed most), and it assumes normally distributed returns (real returns have fat tails). Still, understanding MPT is the foundation for all modern risk-aware portfolio construction.',
        formula: 'Portfolio Variance = Σ wi²σi² + Σ Σ wi·wj·σi·σj·ρij',
        example: 'Stocks (σ=20%) + Bonds (σ=5%) with correlation −0.2:\nPortfolio vol is lower than a pure-stock portfolio.',
      },
      {
        title: 'Correlation & Diversification',
        body: 'Correlation (ρ) ranges from −1 (perfect inverse) to +1 (perfect alignment). Adding a zero-correlation asset always reduces portfolio variance. Adding a −1 correlation asset can theoretically eliminate all risk.\n\nThe practical challenge: correlations are unstable. During the 2008 financial crisis, almost all asset classes became highly correlated — stocks, corporate bonds, real estate, commodities all fell together. This is known as "correlation breakdown."\n\nTrue diversification requires assets that are uncorrelated in their fundamental drivers, not just historically uncorrelated. Think: equities vs. TIPS inflation bonds vs. managed futures vs. commodities. Geographic diversification also helps, but is increasingly limited by global market integration.',
        formula: 'Diversification benefit ↑ as ρ ↓',
        example: 'Adding a 20% allocation to gold (historically low correlation to stocks) typically reduces portfolio drawdowns during equity bear markets.',
      },
      {
        title: 'Factor Investing (Fama-French)',
        body: 'The Fama-French 3-factor model expanded CAPM by adding two factors beyond market beta: size (small-cap stocks historically outperform large-caps) and value (low P/B stocks outperform high P/B stocks).\n\nThe 5-factor model adds profitability (high operating profit firms outperform) and investment (firms that invest conservatively outperform aggressive investors). Momentum is a separate well-documented factor.\n\nFactor investing lets you tilt your portfolio toward historically rewarded risk premia. Smart beta ETFs implement this systematically. Key risk: factors can underperform for extended periods (value underperformed growth for a decade post-2010). Diversifying across multiple factors reduces factor-specific timing risk.',
        formula: 'E(R) = Rf + β_mkt·MKT + β_smb·SMB + β_hml·HML',
        example: 'A small-cap value tilt historically added ~2-3% annualized alpha vs. cap-weighted index, but with higher volatility and longer drawdown periods.',
      },
    ],
  },
  {
    id: 'valuation',
    title: 'Valuation Methods',
    color: '#f5a623',
    icon: '$',
    difficulty: 'Advanced',
    topics: ['DCF Analysis', 'EV/EBITDA', 'Margin of Safety'],
    lessons: [
      {
        title: 'Discounted Cash Flow (DCF)',
        body: 'DCF values a business by discounting its future free cash flows back to present value using a discount rate (WACC — weighted average cost of capital). The result is the intrinsic value of the business.\n\nThe process: (1) Project free cash flows (FCF) for 5-10 years. (2) Estimate a terminal value using a perpetuity growth rate. (3) Discount all cash flows back using WACC. (4) Divide by shares outstanding to get intrinsic value per share.\n\nDCF is highly sensitive to assumptions — a 1% change in WACC or terminal growth rate can dramatically change the output. Always run multiple scenarios (bear/base/bull). The margin of safety principle (Buffett/Graham) suggests only buying at a significant discount to intrinsic value to account for estimation error.',
        formula: 'IV = Σ FCFt/(1+WACC)^t + Terminal Value/(1+WACC)^n',
        example: 'Company with $100M FCF growing 10%/yr for 5 years, then 3% forever, WACC=9%:\nTerminal value dominates — shows how sensitive DCF is to long-term assumptions.',
      },
      {
        title: 'Relative Valuation Multiples',
        body: 'While DCF values a company in absolute terms, multiples compare it to peers. The most useful multiples depend on the company type.\n\nP/E (Price/Earnings): Good for mature, profitable companies. Beware: can be distorted by one-time items, accounting choices, or debt levels.\n\nEV/EBITDA (Enterprise Value / Earnings Before Interest, Taxes, Depreciation, Amortization): Capital-structure neutral — great for comparing companies with different debt levels. Better than P/E for capital-intensive industries.\n\nP/S (Price/Sales): Useful for high-growth companies with no earnings yet. Beware of bloated multiples in hype cycles.\n\nPEG Ratio (P/E ÷ Growth Rate): Adjusts P/E for expected growth. A PEG below 1.0 is often considered undervalued; above 2.0 expensive.',
        formula: 'EV = Market Cap + Total Debt − Cash\nEV/EBITDA = EV / EBITDA',
        example: 'AAPL EV/EBITDA of 20x vs. sector median of 15x suggests AAPL trades at a ~33% premium — justified if its growth, margins, or brand command it.',
      },
      {
        title: 'Margin of Safety',
        body: 'The margin of safety, popularized by Benjamin Graham, is the discount between a stock\'s intrinsic value and its market price. It acts as a buffer for estimation error, business deterioration, and unforeseen events.\n\nGraham recommended buying only when a stock traded at 2/3 or less of its net asset value (net-net investing). Buffett evolved this to buying wonderful businesses at fair prices, but the core principle remains: don\'t pay full price for uncertain future cash flows.\n\nA 30-40% margin of safety is a reasonable starting point for most equities. For highly uncertain businesses (pre-revenue biotech, early-stage tech) a larger margin is warranted. For high-quality, predictable businesses (consumer staples, regulated utilities) a smaller margin may be acceptable.',
        formula: 'Margin of Safety = (Intrinsic Value − Market Price) / Intrinsic Value',
        example: 'You calculate a stock\'s intrinsic value at $100/share.\nWith 30% MoS, you only buy at ≤$70.\nThis protects against a 30% estimation error while still generating returns.',
      },
    ],
  },
  {
    id: 'etfs',
    title: 'ETFs & Indexing',
    color: '#4a90e2',
    icon: '∑',
    difficulty: 'Beginner',
    topics: ['Expense Ratios', 'Tracking Error', 'Smart Beta'],
    lessons: [
      {
        title: 'Index Investing & Expense Ratio Drag',
        body: 'Index funds and ETFs track a market index (e.g., S&P 500) passively. Their core advantage is low cost — expense ratios as low as 0.03% for large index ETFs vs. 1-2%+ for active mutual funds.\n\nThe compounding effect of fees is enormous. A 1% annual fee on a $100K portfolio over 30 years costs roughly $170K in foregone returns at 7% growth. This is why Jack Bogle\'s case for indexing has empirically proven correct — the average active manager underperforms their index after fees over a 10+ year horizon.\n\nKey metrics to compare ETFs: expense ratio (lower is better), tracking error (how closely it mirrors the index), bid-ask spread (liquidity), and assets under management (bigger = more liquid).',
        formula: 'Net Return = Gross Return − Expense Ratio − Trading Costs',
        example: 'VOO (Vanguard S&P 500) expense ratio: 0.03%\nSPY (SPDR S&P 500) expense ratio: 0.0945%\nOver 20 years, that 0.0645% difference compounds to ~1.4% total drag.',
      },
      {
        title: 'Smart Beta & Factor ETFs',
        body: 'Smart beta (or strategic beta) ETFs use rules-based strategies that deviate from pure market-cap weighting. Instead of weighting by market cap, they weight by factors like value, quality, momentum, low volatility, or dividends.\n\nExamples: MTUM (momentum), QUAL (quality), VLUE (value), USMV (minimum volatility). These provide systematic factor exposure at a fraction of the cost of active management.\n\nThe trade-off: factor ETFs have higher expense ratios than pure index funds, can underperform for extended periods, and often have higher turnover (and associated tax drag). A barbell approach — core index + satellite factor tilts — is a popular implementation strategy.',
        formula: 'Factor tilt return = Market return + Factor premium − Costs',
        example: 'QUAL (iShares MSCI Quality ETF) has historically shown lower drawdowns than the broad market with similar long-run returns, due to its tilt toward profitable, low-leverage companies.',
      },
      {
        title: 'Bond & Sector ETFs',
        body: 'Bond ETFs offer exposure to fixed income with equity-like liquidity. Key types: short-term (BIL, SHY), intermediate (IEF), long-term (TLT), TIPS (inflation-protected, SCHP), and high-yield (HYG, JNK). Duration tells you interest rate sensitivity: a 10-year duration bond ETF falls ~10% for every 1% rise in rates.\n\nSector ETFs (XLK, XLF, XLE etc.) let you overweight or underweight specific sectors without individual stock risk. They\'re useful for tactical allocation — overweighting energy during commodity cycles, or reducing tech exposure when valuations stretch.\n\nInternational ETFs (VEA, VWO, EFA) add geographic diversification. Currency exposure is built in; hedged versions (HEDJ) remove it for those who don\'t want FX risk.',
        formula: 'Bond price change ≈ −Duration × Δrate',
        example: 'TLT (20+ year Treasury ETF) has duration ~18. If rates rise 1%, TLT falls ~18%. Use shorter-duration bond ETFs when rates are rising.',
      },
    ],
  },
  {
    id: 'dividends',
    title: 'Dividends & Income',
    color: '#4DED30',
    icon: '♣',
    difficulty: 'Beginner',
    topics: ['Yield on Cost', 'DRIP', 'Payout Ratio'],
    lessons: [
      {
        title: 'Dividend Yield vs. Dividend Growth',
        body: 'Two philosophies in dividend investing: high-yield (buy stocks paying 4-6%+ now) vs. dividend growth (buy lower-yielding stocks that grow their dividend 8-15% per year).\n\nDividend growth investing generates "yield on cost" that compounds over time. A stock bought at 2% yield growing dividends at 10%/year will yield 5% on your original cost after 10 years, and 13% after 20 years. This compounding effect makes dividend growers extremely powerful long-term holdings.\n\nHigh-yield stocks carry higher risk — they often sport elevated yields because the market is pricing in payout risk. Always check payout ratio before buying a high-yielder.',
        formula: 'Yield on Cost = Annual Dividend / Original Purchase Price',
        example: 'Buy stock at $50 with $1 dividend (2% yield).\nDividend grows 10%/yr. After 10 years: $2.59/share dividend.\nYield on cost = $2.59 / $50 = 5.2%',
      },
      {
        title: 'Payout Ratio & Dividend Safety',
        body: 'The payout ratio (dividends / earnings) tells you how much of profits are being returned as dividends. A ratio above 80-90% is a red flag — it leaves little room for earnings disappointment or reinvestment. Conversely, a very low ratio (10-20%) often signals room for aggressive dividend growth.\n\nFor capital-intensive businesses, look at free cash flow payout ratio instead (dividends / free cash flow), since earnings can be distorted by non-cash items. REITs use "funds from operations" (FFO) as their earnings base.\n\nDividend Aristocrats are S&P 500 companies that have raised dividends for 25+ consecutive years. This track record requires durable competitive advantages (wide moats). Examples include JNJ, PG, KO, and COKE.',
        formula: 'Payout Ratio = Dividends Per Share / Earnings Per Share',
        example: 'Company earns $5/share EPS, pays $2/share dividend.\nPayout ratio = 40% — healthy with room to grow the dividend.',
      },
      {
        title: 'DRIP & Compounding Power',
        body: 'Dividend Reinvestment Plans (DRIPs) automatically reinvest dividends into additional shares, creating a compounding effect. Over decades, reinvested dividends can account for the majority of total returns. Historically, reinvested dividends have contributed ~40% of the S&P 500\'s total return.\n\nThe mechanics: each dividend reinvestment buys fractional shares at current prices. In down markets, your DRIP buys more shares at lower prices — a form of dollar-cost averaging into the dip. During bull markets, fewer shares are bought per dividend dollar.\n\nTax consideration: DRIP dividends are still taxable in the year received (in taxable accounts), even if automatically reinvested. Holding dividend stocks in tax-advantaged accounts (IRA, 401k) maximizes compounding by deferring taxes.',
        formula: 'Total Return = Price Return + Dividend Return (with reinvestment)',
        example: '$10K in S&P 500 (1980-2023) price return only: ~$300K\nWith reinvested dividends: ~$1.1M — dividends account for most of the gains.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Analysis',
    color: '#50c878',
    icon: '∿',
    difficulty: 'Intermediate',
    topics: ['Moving Averages', 'RSI', 'MACD'],
    lessons: [
      {
        title: 'Moving Averages: SMA vs. EMA',
        body: 'A Simple Moving Average (SMA) gives equal weight to all periods. A 200-day SMA is the most widely watched — stocks above it are broadly considered in uptrends; below it, downtrends. The 50-day SMA is used for medium-term trend assessment.\n\nExponential Moving Average (EMA) weights recent prices more heavily, making it more responsive to recent price action. The 12-day and 26-day EMAs are used in the MACD indicator.\n\nGolden Cross (50-day SMA crosses above 200-day SMA) is a bullish signal; Death Cross (50-day crosses below 200-day) is bearish. These are lagging indicators — they confirm trends rather than predict reversals. Use them with volume and other indicators for better signal quality.',
        formula: 'SMA(n) = (P1 + P2 + ... + Pn) / n\nEMA = Previous EMA × (1 − k) + Today\'s Price × k\nwhere k = 2/(n+1)',
        example: 'A stock trading above its 200-day SMA with a recent golden cross is in a confirmed uptrend. If volume is also expanding, the signal is stronger.',
      },
      {
        title: 'RSI & Momentum Divergence',
        body: 'The Relative Strength Index (RSI) oscillates between 0-100 and measures the speed and magnitude of recent price changes. Readings above 70 are traditionally considered overbought; below 30, oversold. However, in strong trends, RSI can stay in overbought/oversold territory for extended periods.\n\nDivergence is the most powerful RSI signal: Bearish divergence occurs when price makes a new high but RSI fails to (lower high on RSI). This suggests weakening momentum and potential reversal. Bullish divergence is the opposite — new price low but RSI makes a higher low.\n\nUse RSI as a confirmation tool, not in isolation. Combine with trend direction — in a downtrend, RSI bounces to 50-60 are often better sell signals than the classic 70 threshold.',
        formula: 'RSI = 100 − 100/(1 + RS)\nwhere RS = Average Gain / Average Loss over n periods',
        example: 'Stock hits new 52-week high but RSI makes a lower high than the previous peak → bearish divergence → consider reducing position or tightening stop-loss.',
      },
      {
        title: 'MACD & Volume Analysis',
        body: 'MACD (Moving Average Convergence/Divergence) is calculated by subtracting the 26-period EMA from the 12-period EMA. The result is the MACD line. The 9-period EMA of MACD is the "signal line." The histogram shows the difference between them.\n\nBullish signal: MACD line crosses above the signal line. Bearish: crosses below. Zero-line crossings (MACD crossing 0) indicate trend changes. Histogram shrinking toward zero can warn of a crossover before it happens.\n\nVolume confirms price moves: a breakout on high volume is far more reliable than one on low volume. Volume precedes price — increasing volume during a consolidation period often precedes a breakout. On Balance Volume (OBV) tracks cumulative volume flow to confirm trends.',
        formula: 'MACD = EMA(12) − EMA(26)\nSignal = EMA(9) of MACD\nHistogram = MACD − Signal',
        example: 'Bullish: MACD histogram turns from negative to positive while price breaks above resistance on 2× average volume → high-conviction long setup.',
      },
    ],
  },
  {
    id: 'options',
    title: 'Options & Hedging',
    color: '#e91e63',
    icon: '⬦',
    difficulty: 'Advanced',
    topics: ['Covered Calls', 'The Greeks', 'Hedging'],
    lessons: [
      {
        title: 'Covered Calls for Yield Enhancement',
        body: 'A covered call involves holding 100 shares of a stock and selling a call option against it. You collect the premium immediately in exchange for capping your upside at the strike price until expiration.\n\nThis strategy works best in sideways-to-slightly-bullish markets. It generates income (lowering your cost basis over time) at the cost of capping appreciation. If the stock rockets past your strike, you forfeit the gains above the strike but keep the premium.\n\nRule of thumb: sell calls at strikes 5-10% above current price with 30-45 days to expiration. This balances premium income with room for normal price appreciation. The "wheel strategy" combines covered calls with cash-secured puts to continuously generate premium income.',
        formula: 'Breakeven = Stock Purchase Price − Premium Received\nMax Profit = Strike Price − Stock Price + Premium',
        example: 'Own 100 shares of AAPL at $180. Sell $195 call for $3 premium.\nMax gain: ($195 − $180) + $3 = $18/share. If AAPL stays below $195, keep the $3 premium and repeat.',
      },
      {
        title: 'Understanding the Greeks',
        body: 'Option pricing is driven by "the Greeks" — measures of sensitivity to various inputs.\n\nDelta (Δ): How much option price changes per $1 move in underlying. A 0.50 delta call gains $0.50 for every $1 stock rise. At-the-money options have ~0.50 delta.\n\nGamma (Γ): Rate of change of delta. High gamma = delta changes rapidly. Gamma risk is highest near expiration and at-the-money.\n\nTheta (Θ): Time decay — how much option loses per day due to passage of time. Options are wasting assets; theta accelerates in the final 30 days. Option sellers profit from theta.\n\nVega (V): Sensitivity to implied volatility (IV) changes. When IV spikes (e.g., earnings, market panic), options get more expensive. Selling options during high IV environments captures elevated premium.',
        formula: 'Option Price ≈ Intrinsic Value + Time Value\nTime Value decays exponentially near expiration',
        example: 'Sell a put with IV rank at 80th percentile (IV is historically high).\nWhen IV reverts to normal after the event, your short option profits even if the stock barely moves — this is "IV crush."',
      },
      {
        title: 'Portfolio Hedging with Puts',
        body: 'Protective puts work like insurance: buy a put option on a position (or index) to limit downside. You pay a premium for the right to sell at the strike price regardless of how far the stock falls.\n\nFor portfolio-level hedging, buying SPY or SPX puts hedges broad market exposure. The cost (theta decay + premium) is the "insurance premium" you pay. Many institutional investors buy tail-risk hedges (far out-of-the-money puts) to protect against black swan events.\n\nA more capital-efficient hedge: buy put spreads (buy a put, sell a further out-of-the-money put). This reduces cost but also reduces the protection range. For a $500K equity portfolio, spending 0.5-1% annually on put spreads can reduce max drawdown significantly during crashes.',
        formula: 'Effective Floor = Put Strike − Premium Paid\nNet Downside Protected = Put Strike − Current Price − Premium',
        example: 'Own $100K in SPY at $500. Buy 2× $480 puts expiring in 3 months for $5 each ($1,000 total). If SPY crashes to $400, your puts gain ~$80 each → $16,000 gain offsets equity losses.',
      },
    ],
  },
  {
    id: 'tax',
    title: 'Tax Strategy',
    color: '#00bcd4',
    icon: '%',
    difficulty: 'Intermediate',
    topics: ['Tax-Loss Harvesting', 'Wash Sale Rule', 'Capital Gains'],
    lessons: [
      {
        title: 'Tax-Loss Harvesting',
        body: 'Tax-loss harvesting (TLH) involves selling positions at a loss to realize the loss for tax purposes, then buying a similar (but not identical) investment to maintain market exposure. The realized loss offsets capital gains elsewhere, reducing your tax bill.\n\nCapital losses first offset capital gains dollar-for-dollar. If losses exceed gains, up to $3,000 of net losses can offset ordinary income annually. Excess losses carry forward indefinitely.\n\nTLH is most valuable in taxable accounts with highly appreciated gains elsewhere. The benefit is tax deferral, not permanent elimination — your new position has a lower cost basis, so gains will be larger when you eventually sell. The time value of deferring taxes is the true benefit.',
        formula: 'Tax Savings = Loss Amount × Marginal Tax Rate\nNet benefit = Tax Savings now − Higher Tax Later (discounted)',
        example: 'Sell MSFT at $10K loss, buy QQQ to maintain tech exposure (avoids wash sale). Offset against $10K NVDA gain → save $2,380 in federal taxes (at 23.8% long-term rate).',
      },
      {
        title: 'Wash Sale Rule',
        body: 'The wash sale rule disallows a tax loss if you buy the "substantially identical" security within 30 days before or after the sale. The disallowed loss is added to the basis of the new position, so it\'s deferred rather than permanently lost.\n\nWatch out for: repurchasing the same ETF, different share classes of the same fund, or options on the sold stock within the 61-day window. The rule applies per account — selling in a taxable account and buying in an IRA also triggers the wash sale.\n\nSolutions: buy a different fund in the same sector (sell VTI, buy ITOT), or wait the full 31 days before repurchasing. Automated TLH tools (offered by roboadvisors) are designed to navigate this automatically.',
        formula: '61-day window: 30 days before + day of sale + 30 days after',
        example: 'Sell SPY at a $5K loss on March 1. Buy VOO on March 15 (16 days later). This is NOT a wash sale since VOO and SPY track the same index but are not "substantially identical" — the IRS has not ruled explicitly, but most tax professionals treat them as different.',
      },
      {
        title: 'Capital Gains Management',
        body: 'Long-term capital gains (assets held >1 year) are taxed at 0%, 15%, or 20% depending on income, plus 3.8% Net Investment Income Tax (NIIT) for high earners. Short-term gains are taxed as ordinary income (up to 37%).\n\nThe 1-year holding rule is one of the most powerful tax strategies available: by simply holding past the 12-month mark, you reduce the tax rate on gains by potentially 20-25 percentage points.\n\nTax-advantaged account placement: put high-dividend stocks, REITs, and bonds (which generate ordinary income) in IRAs/401ks. Hold long-term growth stocks in taxable accounts where you can control the timing of gains realization and get preferential long-term rates.',
        formula: 'After-tax return = Gross Return × (1 − Tax Rate)\nBond in taxable: 5% × (1 − 0.37) = 3.15%\nSame bond in IRA: 5% full compounding',
        example: 'High earner with $200K in AAPL gains held 11 months: pay ordinary rates (~37%) = $74K tax. Wait 2 more months (13 months total): pay LTCG rate (23.8%) = $47,600. Patience saves $26,400.',
      },
    ],
  },
  {
    id: 'psychology',
    title: 'Market Psychology',
    color: '#ff9800',
    icon: '◉',
    difficulty: 'Intermediate',
    topics: ['Behavioral Biases', 'Market Cycles', 'Contrarian Thinking'],
    lessons: [
      {
        title: 'Behavioral Finance Biases',
        body: 'The biggest threat to investor returns is often the investor themselves. Several well-documented cognitive biases systematically destroy returns:\n\nAnchoring: Over-weighting an arbitrary reference price (e.g., refusing to sell a stock below your purchase price when fundamentals have deteriorated).\n\nRecency Bias: Extrapolating recent performance into the future — buying at peaks because the last 3 years were great.\n\nDisposition Effect: The painful tendency to sell winners too early (to "lock in gains") and hold losers too long (avoiding the emotional pain of realizing a loss).\n\nOverconfidence: Most investors believe they are above-average. Studies show active trading driven by overconfidence destroys 1-2% in returns annually.\n\nSolution: rules-based, systematic investing with pre-committed processes removes in-the-moment emotional decisions.',
        formula: 'Behavior Gap = Market Return − Investor Return\n(typically 1-3% annually due to poor timing)',
        example: 'DALBAR studies consistently show that while the S&P 500 averages ~10%/year, average equity mutual fund investors earn ~6% due to buying high and selling low during volatility.',
      },
      {
        title: 'Market Cycle Phases',
        body: 'Markets move in cycles, typically driven by the credit cycle and corporate earnings cycles. The classic four phases: Accumulation (smart money buys after a bear market bottom), Markup (broad rally as public piles in), Distribution (smart money sells into strength), Markdown (bear market as fundamentals deteriorate).\n\nThe economic cycle (expansion → peak → contraction → trough) drives sector rotation. Defensives (staples, utilities, healthcare) tend to outperform in late-cycle and early recession. Cyclicals (industrials, materials, energy) lead in early expansion. Financials and tech tend to lead in the early-to-mid bull phase.\n\nRecognizing the phase you\'re in doesn\'t guarantee short-term accuracy but improves portfolio tilts over multi-year horizons.',
        formula: 'Sector Rotation: Consumer Discretionary → Tech → Industrials → Energy → Materials → Utilities',
        example: 'In 2022 (rate hike cycle, late expansion → contraction): energy (+60%), defensives outperformed. In 2023-2024 (disinflation, soft landing): tech, growth re-led. Positioning for the cycle\'s next phase adds alpha.',
      },
      {
        title: 'Contrarian Thinking & Sentiment',
        body: 'The best buying opportunities often feel like the worst times to invest. When sentiment indicators are at extreme fear — CNN Fear & Greed index near 0, VIX above 40, AAII bearish sentiment at multi-decade highs — historically forward 12-month returns are significantly above average.\n\nContrarian investing isn\'t about always doing the opposite of the crowd. It\'s about recognizing when sentiment has become so extreme that it\'s priced into valuations. "Be fearful when others are greedy, and greedy when others are fearful" (Buffett) is the principle.\n\nTools: VIX (volatility "fear gauge"), AAII sentiment survey, put/call ratio, short interest ratios, fund flow data, and market breadth indicators. When all these align at extremes, the asymmetry of potential outcomes shifts significantly in the contrarian\'s favor.',
        formula: 'High VIX (>30) + high put/call ratio + AAII bears >50% = historically strong forward returns',
        example: 'March 2020: VIX hit 82, AAII sentiment showed 52% bears. S&P 500 12-month forward return from that point: +75%. The panic was the signal — those who bought into extreme fear were rewarded.',
      },
    ],
  },
];

// ─── Learn: Lesson Modal ──────────────────────────────────────────────────────

function LessonModal({
  module,
  lessonIndex,
  onClose,
}: {
  module: Module;
  lessonIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(lessonIndex);
  const lesson = module.lessons[current];

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent>
      <View style={styles.lessonOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.lessonSheet}>
          <View style={styles.lessonHandle} />

          {/* Module badge */}
          <View style={[styles.lessonModuleBadge, { backgroundColor: module.color + '22' }]}>
            <Text style={[styles.lessonModuleBadgeText, { color: module.color }]}>
              {module.icon}  {module.title}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.lessonBody}>{lesson.body}</Text>

            {lesson.formula && (
              <View style={styles.lessonFormulaBox}>
                <Text style={styles.lessonFormulaLabel}>Formula</Text>
                <Text style={styles.lessonFormulaText}>{lesson.formula}</Text>
              </View>
            )}

            {lesson.example && (
              <View style={styles.lessonExampleBox}>
                <Text style={styles.lessonExampleLabel}>Example</Text>
                <Text style={styles.lessonExampleText}>{lesson.example}</Text>
              </View>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Lesson navigation */}
          <View style={styles.lessonNav}>
            <TouchableOpacity
              style={[styles.lessonNavBtn, current === 0 && styles.lessonNavBtnDisabled]}
              onPress={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              <Text style={[styles.lessonNavText, current === 0 && styles.lessonNavTextDisabled]}>
                ← Prev
              </Text>
            </TouchableOpacity>

            <Text style={styles.lessonNavCounter}>
              {current + 1} / {module.lessons.length}
            </Text>

            {current < module.lessons.length - 1 ? (
              <TouchableOpacity
                style={styles.lessonNavBtn}
                onPress={() => setCurrent(c => c + 1)}
              >
                <Text style={styles.lessonNavText}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.lessonNavBtn, { backgroundColor: module.color + '22' }]} onPress={onClose}>
                <Text style={[styles.lessonNavText, { color: module.color }]}>Done ✓</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Learn: Module Card ───────────────────────────────────────────────────────

function ModuleCard({ module }: { module: Module }) {
  const [openLesson, setOpenLesson] = useState<number | null>(null);

  const difficultyColor =
    module.difficulty === 'Beginner' ? '#4DED30' :
    module.difficulty === 'Intermediate' ? '#f5a623' : '#FF4458';

  const totalMinutes = module.lessons.length * 4;

  return (
    <>
      {openLesson !== null && (
        <LessonModal
          module={module}
          lessonIndex={openLesson}
          onClose={() => setOpenLesson(null)}
        />
      )}

      <View style={styles.moduleCard}>
        {/* Color header strip */}
        <View style={[styles.moduleCardHeader, { backgroundColor: module.color }]}>
          <Text style={styles.moduleIcon}>{module.icon}</Text>
        </View>

        <View style={styles.moduleCardBody}>
          <View style={styles.moduleCardTitleRow}>
            <Text style={styles.moduleCardTitle} numberOfLines={2}>{module.title}</Text>
            <View style={[styles.diffBadge, { backgroundColor: difficultyColor + '20' }]}>
              <Text style={[styles.diffBadgeText, { color: difficultyColor }]}>
                {module.difficulty}
              </Text>
            </View>
          </View>

          {/* Topics */}
          <View style={styles.moduleTopics}>
            {module.topics.map(t => (
              <View key={t} style={styles.topicPill}>
                <Text style={styles.topicPillText} numberOfLines={1}>{t}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.moduleMeta}>
            {module.lessons.length} lessons · ~{totalMinutes} min
          </Text>

          {/* Lesson list */}
          {module.lessons.map((lesson, i) => (
            <TouchableOpacity
              key={i}
              style={styles.lessonRow}
              onPress={() => setOpenLesson(i)}
              activeOpacity={0.7}
            >
              <View style={[styles.lessonDot, { backgroundColor: module.color }]} />
              <Text style={styles.lessonRowText} numberOfLines={1}>{lesson.title}</Text>
              <Text style={styles.lessonRowArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
}

function LearnTab() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.learnList}
    >
      <Text style={styles.learnHeading}>Your Learning Path</Text>
      <Text style={styles.learnSubheading}>
        From risk management to tax strategy — master the tools experienced investors use.
      </Text>

      {/* Module grid (2 columns) */}
      <View style={styles.moduleGrid}>
        {MODULES.map(m => (
          <View key={m.id} style={styles.moduleGridItem}>
            <ModuleCard module={m} />
          </View>
        ))}
      </View>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

// ─── Main ExploreScreen ───────────────────────────────────────────────────────

export default function ExploreScreen() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('foryou');
  const { stocks } = useStockData();
  const [selectedStock, setSelectedStock] = useState<StockWithLive | null>(null);
  const [buyStock, setBuyStock] = useState<StockWithLive | null>(null);

  const handleTickerPress = (ticker: string) => {
    const stock = stocks.find(s => s.ticker === ticker);
    if (stock) setSelectedStock(stock);
  };

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

      {/* Sub-tab bar */}
      <View style={styles.subTabBar}>
        {([
          { id: 'foryou', label: 'For You' },
          { id: 'browse', label: 'Browse' },
          { id: 'learn',  label: 'Learn'   },
          { id: 'plan',   label: 'Plan'    },
        ] as { id: SubTab; label: string }[]).map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.subTabBtn, activeSubTab === tab.id && styles.subTabBtnActive]}
            onPress={() => setActiveSubTab(tab.id)}
            activeOpacity={0.75}
          >
            <Text style={[styles.subTabText, activeSubTab === tab.id && styles.subTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1, width: '100%', paddingHorizontal: activeSubTab === 'plan' ? 0 : 16, paddingTop: activeSubTab === 'plan' ? 0 : 12 }}>
        {activeSubTab === 'foryou' && <ForYouFeed onTickerPress={handleTickerPress} />}
        {activeSubTab === 'browse' && <BrowseTab onStockPress={setSelectedStock} />}
        {activeSubTab === 'learn'  && <LearnTab />}
        {activeSubTab === 'plan'   && <PlanTab />}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },

  // Sub-tab bar
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 4,
    gap: 4,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  subTabBtnActive: {
    backgroundColor: '#7c6af7',
  },
  subTabText: {
    color: '#7878a0',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  subTabTextActive: {
    color: '#ffffff',
  },

  // For You feed
  feedList: {
    paddingBottom: 80,
  },
  centeredLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeed: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyFeedIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyFeedTitle: {
    color: '#7878a0',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyFeedSub: {
    color: '#3d3d5c',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 0,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7c6af7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c6af7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -2,
  },

  // Browse tab
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122a',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#22223a',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    marginBottom: 10,
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
  filterRow: {
    gap: 8,
    paddingBottom: 10,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#12122a',
    borderWidth: 1.5,
    borderColor: '#22223a',
  },
  filterChipActive: {
    backgroundColor: '#7c6af7',
    borderColor: '#7c6af7',
  },
  filterChipText: {
    color: '#7878a0',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  browseList: {
    paddingBottom: 20,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16162a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  stockRowInfo: {
    flex: 1,
    gap: 3,
  },
  stockRowName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  stockRowTicker: {
    color: '#7c6af7',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  stockRowRight: {
    alignItems: 'flex-end',
    gap: 3,
    minWidth: 70,
  },
  stockRowPrice: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  stockRowChange: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  noResults: {
    color: '#3d3d5c',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    letterSpacing: 0.3,
  },

  // Learn tab
  learnList: {
    paddingBottom: 20,
  },
  learnHeading: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  learnSubheading: {
    color: '#7878a0',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleGridItem: {
    width: '47%',
  },
  moduleCard: {
    backgroundColor: '#16162a',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#22223a',
  },
  moduleCardHeader: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIcon: {
    fontSize: 26,
  },
  moduleCardBody: {
    padding: 12,
    gap: 6,
  },
  moduleCardTitleRow: {
    gap: 6,
  },
  moduleCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  moduleTopics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 2,
  },
  topicPill: {
    backgroundColor: '#12122a',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  topicPillText: {
    color: '#7878a0',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  moduleMeta: {
    color: '#3d3d5c',
    fontSize: 10,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#22223a',
  },
  lessonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  lessonRowText: {
    flex: 1,
    color: '#c0c0e0',
    fontSize: 11,
    lineHeight: 15,
  },
  lessonRowArrow: {
    color: '#3d3d5c',
    fontSize: 16,
  },

  // Lesson Modal
  lessonOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  lessonSheet: {
    backgroundColor: '#0d0d1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  lessonHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3d3d5c',
    alignSelf: 'center',
    marginBottom: 16,
  },
  lessonModuleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  lessonModuleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  lessonTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  lessonBody: {
    color: '#c8c8e8',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.1,
    marginBottom: 16,
  },
  lessonFormulaBox: {
    backgroundColor: '#12122a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7c6af7',
  },
  lessonFormulaLabel: {
    color: '#7c6af7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  lessonFormulaText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    lineHeight: 20,
  },
  lessonExampleBox: {
    backgroundColor: '#0a1a0a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4DED30',
  },
  lessonExampleLabel: {
    color: '#4DED30',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  lessonExampleText: {
    color: '#c8e8c8',
    fontSize: 13,
    lineHeight: 20,
  },
  lessonNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#22223a',
  },
  lessonNavBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#12122a',
  },
  lessonNavBtnDisabled: {
    opacity: 0.3,
  },
  lessonNavText: {
    color: '#7c6af7',
    fontSize: 14,
    fontWeight: '700',
  },
  lessonNavTextDisabled: {
    color: '#7878a0',
  },
  lessonNavCounter: {
    color: '#7878a0',
    fontSize: 13,
    fontWeight: '600',
  },
});
