import { TrendingUp, TrendingDown, Building2, DollarSign, BarChart3, Activity, ChevronUp, Coins, TrendingUpIcon } from 'lucide-react';
import { Stock } from '../data/mockStocks';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useMemo } from 'react';

interface StockCardProps {
  stock: Stock;
}

// Generate historical price data for the chart
function generateChartData(stock: Stock) {
  const dataPoints = 30; // 30 days of data
  const data = [];
  const currentPrice = stock.price;
  const volatility = Math.abs(stock.changePercent) / 100;
  
  // Start from a price 30 days ago
  let price = currentPrice / (1 + stock.changePercent / 100);
  
  for (let i = 0; i < dataPoints; i++) {
    // Random walk with tendency towards current price
    const randomChange = (Math.random() - 0.5) * volatility * price;
    const trendTowardsCurrent = (currentPrice - price) * 0.03;
    price = price + randomChange + trendTowardsCurrent;
    
    const timestamp = Date.now() - (dataPoints - i) * 24 * 60 * 60 * 1000;
    data.push({
      id: `${stock.id}-day-${i}-${timestamp}`, // Add unique ID for each data point
      day: i,
      price: parseFloat(price.toFixed(2))
    });
  }
  
  // Ensure the last point is the current price
  data[dataPoints - 1].price = currentPrice;
  
  return data;
}

export function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.change >= 0;
  const chartData = useMemo(() => generateChartData(stock), [stock.id, stock.price, stock.changePercent]);
  const gradientId = useMemo(() => `card-gradient-${stock.id}`, [stock.id]);
  
  const assetType = stock.type || 'stock';
  const assetTypeLabel = assetType === 'etf' ? 'ETF' : assetType === 'crypto' ? 'CRYPTO' : 'STOCK';
  const assetTypeColor = assetType === 'etf' ? 'bg-secondary/20 text-secondary' : 
                         assetType === 'crypto' ? 'bg-accent/20 text-accent' : 
                         'bg-slate-500/20 text-slate-400';
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
      {/* Swipe Up Indicator */}
      <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 animate-bounce">
        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        <span className="text-xs text-slate-400 bg-slate-900/70 px-2 py-1 rounded-full">Swipe up for details</span>
      </div>

      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white truncate">{stock.symbol}</h2>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 ${assetTypeColor}`}>
                {assetTypeLabel}
              </span>
            </div>
            <p className="text-slate-400 text-sm line-clamp-1 font-medium">{stock.name}</p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ml-2 ${
            isPositive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          }`}>
            {stock.sector}
          </div>
        </div>
      </div>

      {/* Chart Section - Like Tinder's profile image */}
      <div className="relative flex-shrink-0" style={{ height: '144px', width: '100%' }}>
        <ResponsiveContainer width="100%" height={144}>
          <LineChart data={chartData} margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="0%" 
                  stopColor={isPositive ? '#10b981' : '#ef4444'} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="100%" 
                  stopColor={isPositive ? '#10b981' : '#ef4444'} 
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2.5}
              dot={false}
              fill={`url(#${gradientId})`}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Chart overlay with time period label */}
        <div className="absolute top-2 sm:top-3 left-3 sm:left-4">
          <span className="text-xs text-slate-400 bg-slate-900/70 px-2 py-1 rounded">30D</span>
        </div>
      </div>

      {/* Price Info */}
      <div className="p-3 sm:p-4 flex-shrink-0 border-b border-slate-700/50">
        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
            ${stock.price >= 1 ? stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : stock.price.toFixed(stock.price < 0.01 ? 4 : 2)}
          </span>
          <div className={`flex items-center gap-1 mb-0.5 sm:mb-1 ${
            isPositive ? 'text-success' : 'text-destructive'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="text-xs sm:text-sm font-semibold">
              {isPositive ? '+' : ''}{stock.change >= 1 ? stock.change.toFixed(2) : stock.change.toFixed(4)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-700/50 flex-shrink-0">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400">Market Cap</span>
          </div>
          <p className="text-base font-semibold text-white">${stock.marketCap}</p>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400">Volume</span>
          </div>
          <p className="text-base font-semibold text-white">{stock.volume}</p>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400">P/E Ratio</span>
          </div>
          <p className="text-base font-semibold text-white">{stock.pe.toFixed(1)}</p>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400">52W Range</span>
          </div>
          <p className="text-xs font-semibold text-white">
            ${stock.week52Low >= 1 ? stock.week52Low.toFixed(0) : stock.week52Low.toFixed(stock.week52Low < 0.01 ? 4 : 2)} - ${stock.week52High >= 1 ? stock.week52High.toFixed(0) : stock.week52High.toFixed(stock.week52High < 0.01 ? 4 : 2)}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-xs font-semibold text-slate-400 mb-2">About</h3>
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
          {stock.description}
        </p>
      </div>
    </div>
  );
}