import { motion, AnimatePresence } from 'motion/react';
import { Stock } from '../data/mockStocks';
import { X, TrendingUp, TrendingDown, Building2, DollarSign, BarChart3, Activity, Percent, TrendingDown as VolatilityIcon, ShoppingCart, Coins } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo, useState } from 'react';

interface StockDetailModalProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
  onBuy?: (stock: Stock, shares: number) => void;
  onSell?: (stock: Stock, shares: number) => void;
}

interface TradeModalProps {
  stock: Stock;
  type: 'buy' | 'sell';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shares: number) => void;
  maxShares?: number;
}

function TradeModal({ stock, type, isOpen, onClose, onConfirm, maxShares }: TradeModalProps) {
  const [shares, setShares] = useState(1);
  const totalCost = shares * stock.price;
  
  const handleConfirm = () => {
    if (shares > 0 && (!maxShares || shares <= maxShares)) {
      onConfirm(shares);
      onClose();
      setShares(1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 z-[60]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[60] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 max-w-md mx-auto"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-slate-700/50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {type === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5">{stock.name}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-300" />
                </button>
              </div>
              
              <div className="flex items-end gap-2 mt-3">
                <span className="text-2xl font-bold text-white font-mono">${stock.price.toFixed(2)}</span>
                <span className={`text-sm font-semibold mb-0.5 ${
                  stock.change >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              {/* Shares Input */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Number of Shares
                  {maxShares && <span className="text-slate-500 font-normal ml-1">(Max: {maxShares})</span>}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShares(Math.max(1, shares - 1))}
                    className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-xl transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxShares}
                    value={shares}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setShares(maxShares ? Math.min(maxShares, Math.max(1, value)) : Math.max(1, value));
                    }}
                    className="flex-1 h-12 text-center text-xl font-bold bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-[#2C3863] focus:ring-2 focus:ring-[#2C3863]/50 outline-none transition-all"
                  />
                  <button
                    onClick={() => setShares(maxShares ? Math.min(maxShares, shares + 1) : shares + 1)}
                    disabled={maxShares !== undefined && shares >= maxShares}
                    className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Select */}
              <div className="mb-5">
                <div className="flex gap-2">
                  {[1, 5, 10, 25].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setShares(maxShares ? Math.min(maxShares, qty) : qty)}
                      disabled={maxShares !== undefined && qty > maxShares}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-700 active:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-slate-800/50 rounded-xl p-4 mb-5 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-sm">Total {type === 'buy' ? 'Cost' : 'Value'}</span>
                  <DollarSign className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">
                  ${totalCost.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  {shares} share{shares !== 1 ? 's' : ''} × ${stock.price.toFixed(2)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={shares <= 0 || (maxShares !== undefined && shares > maxShares)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    type === 'buy'
                      ? 'bg-success hover:bg-success/90 active:bg-success/80 text-white'
                      : 'bg-destructive hover:bg-destructive/90 active:bg-destructive/80 text-white'
                  }`}
                >
                  {type === 'buy' ? 'Buy' : 'Sell'} {shares} Share{shares !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Generate more detailed chart data
function generateDetailedChartData(stock: Stock) {
  const dataPoints = 90; // 90 days of data
  const data = [];
  const currentPrice = stock.price;
  const volatility = Math.abs(stock.changePercent) / 100;
  
  let price = currentPrice / (1 + stock.changePercent / 100);
  
  for (let i = 0; i < dataPoints; i++) {
    const randomChange = (Math.random() - 0.5) * volatility * price;
    const trendTowardsCurrent = (currentPrice - price) * 0.01;
    price = price + randomChange + trendTowardsCurrent;
    
    const timestamp = Date.now() - (dataPoints - i) * 24 * 60 * 60 * 1000;
    data.push({
      id: `${stock.id}-day-${i}-${timestamp}`, // Add unique ID for each data point
      day: i,
      price: parseFloat(price.toFixed(2)),
      date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: timestamp
    });
  }
  
  data[dataPoints - 1].price = currentPrice;
  
  return data;
}

export function StockDetailModal({ stock, isOpen, onClose, onBuy, onSell }: StockDetailModalProps) {
  const isPositive = stock.change >= 0;
  const chartData = useMemo(() => generateDetailedChartData(stock), [stock.id, stock.price, stock.changePercent]);
  // Create a stable unique gradient ID
  const gradientId = useMemo(() => `modal-gradient-${stock.id}`, [stock.id]);
  
  // Trade modal state
  const [tradeModalState, setTradeModalState] = useState<{ type: 'buy' | 'sell' } | null>(null);
  
  // Calculate additional metrics
  const priceFromLow = ((stock.price - stock.week52Low) / stock.week52Low * 100).toFixed(2);
  const priceFromHigh = ((stock.price - stock.week52High) / stock.week52High * 100).toFixed(2);
  const avgVolume = stock.volume;
  const dividendYield = (Math.random() * 3).toFixed(2); // Mock data
  const beta = (0.8 + Math.random() * 0.8).toFixed(2); // Mock data
  const eps = (stock.price / stock.pe).toFixed(2);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            {/* Drag Handle */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 z-10">
              <div className="flex justify-center pt-2 pb-2">
                <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="px-4 pb-3 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{stock.symbol}</h2>
                  <p className="text-slate-400 text-sm">{stock.name}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-slate-800 active:bg-slate-600 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              {/* Current Price */}
              <div className="px-4 pb-3">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-white font-mono">${stock.price.toFixed(2)}</span>
                  <div className={`flex items-center gap-1 mb-1 ${
                    isPositive ? 'text-success' : 'text-destructive'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-base font-semibold">
                      {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="px-4 py-5 border-b border-slate-700/50" key={`chart-container-${stock.id}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white">Price History</h3>
                <span className="text-xs text-slate-400">Last 90 days</span>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-2" style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop 
                          key={`${gradientId}-start`}
                          offset="0%" 
                          stopColor={isPositive ? '#10b981' : '#ef4444'} 
                          stopOpacity={0.4}
                        />
                        <stop 
                          key={`${gradientId}-end`}
                          offset="100%" 
                          stopColor={isPositive ? '#10b981' : '#ef4444'} 
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day"
                      stroke="#64748b" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      ticks={[0, 45, 89]}
                      tickFormatter={(value) => chartData[value]?.date || ''}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={['dataMin - 10', 'dataMax + 10']}
                      tickFormatter={(value) => `$${value}`}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                      labelFormatter={(value) => chartData[value]?.date || ''}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    />
                    <Area
                      key={`area-${stock.id}`}
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? '#10b981' : '#ef4444'}
                      strokeWidth={2}
                      fill={`url(#${gradientId})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="px-4 py-5 border-b border-slate-700/50">
              <h3 className="text-base font-semibold text-white mb-3">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-slate-400">Market Cap</span>
                  </div>
                  <p className="text-lg font-bold text-white">${stock.marketCap}</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-slate-400">Volume</span>
                  </div>
                  <p className="text-lg font-bold text-white">{stock.volume}</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-slate-400">P/E Ratio</span>
                  </div>
                  <p className="text-lg font-bold text-white">{stock.pe.toFixed(2)}</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-slate-400">EPS</span>
                  </div>
                  <p className="text-lg font-bold text-white">${eps}</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-slate-400">Dividend Yield</span>
                  </div>
                  <p className="text-lg font-bold text-white">{dividendYield}%</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <VolatilityIcon className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-slate-400">Beta</span>
                  </div>
                  <p className="text-lg font-bold text-white">{beta}</p>
                </div>
              </div>
            </div>

            {/* 52 Week Range */}
            <div className="px-4 py-5 border-b border-slate-700/50">
              <h3 className="text-base font-semibold text-white mb-3">52 Week Range</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Low: ${stock.week52Low}</span>
                    <span className="text-slate-400">High: ${stock.week52High}</span>
                  </div>
                  <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                      style={{
                        width: `${((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100}%`
                      }}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-xs text-slate-400">
                      Current: ${stock.price.toFixed(2)} 
                      <span className={`ml-1 ${parseFloat(priceFromLow) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        (+{priceFromLow}% from low, {priceFromHigh}% from high)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="px-4 py-5 border-b border-slate-700/50">
              <h3 className="text-base font-semibold text-white mb-3">About {stock.symbol}</h3>
              <div className="mb-3">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#2C3863]/30 text-[#8b9dc3] mb-3 border border-[#2C3863]/50">
                  {stock.sector}
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {stock.description}
              </p>
            </div>

            {/* Additional Stats */}
            <div className="px-4 py-5">
              <h3 className="text-base font-semibold text-white mb-3">Additional Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-slate-700/50">
                  <span className="text-sm text-slate-400">Avg. Volume</span>
                  <span className="text-sm text-white font-semibold">{avgVolume}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-700/50">
                  <span className="text-sm text-slate-400">Previous Close</span>
                  <span className="text-sm text-white font-semibold">${(stock.price - stock.change).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-700/50">
                  <span className="text-sm text-slate-400">Day Range</span>
                  <span className="text-sm text-white font-semibold">
                    ${(stock.price * 0.98).toFixed(2)} - ${(stock.price * 1.02).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-sm text-slate-400">Market Status</span>
                  <span className="text-sm text-green-400 font-semibold">● Market Open</span>
                </div>
              </div>
            </div>

            {/* Bottom padding for safe area */}
            <div className="h-20" />
          </motion.div>

          {/* Trade Actions - Sticky at bottom */}
          {(onBuy || onSell) && (
            <div className="fixed inset-x-0 bottom-0 z-[51] bg-gradient-to-t from-slate-900 via-slate-900 to-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-4 py-4 pb-6 shadow-2xl">
              <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                {onBuy && (
                  <button
                    onClick={() => setTradeModalState({ type: 'buy' })}
                    className="w-full py-4 px-4 rounded-xl bg-success/20 hover:bg-success/30 active:bg-success/40 border-2 border-success text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ShoppingCart className="w-5 h-5 text-success" />
                    <span className="text-success">Buy Stock</span>
                  </button>
                )}
                {onSell && (
                  <button
                    onClick={() => setTradeModalState({ type: 'sell' })}
                    className="w-full py-4 px-4 rounded-xl bg-destructive/20 hover:bg-destructive/30 active:bg-destructive/40 border-2 border-destructive text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Coins className="w-5 h-5 text-destructive" />
                    <span className="text-destructive">Sell Stock</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Trade Modal */}
          {tradeModalState && (
            <TradeModal
              stock={stock}
              type={tradeModalState.type}
              isOpen={!!tradeModalState}
              onClose={() => setTradeModalState(null)}
              onConfirm={(shares) => {
                if (tradeModalState.type === 'buy' && onBuy) {
                  onBuy(stock, shares);
                } else if (tradeModalState.type === 'sell' && onSell) {
                  onSell(stock, shares);
                }
                setTradeModalState(null);
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}