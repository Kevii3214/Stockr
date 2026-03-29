import { useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Stock } from '../data/mockStocks';
import { StockDetailModal } from '../components/StockDetailModal';
import { motion } from 'motion/react';

interface PassedPageProps {
  passed: Stock[];
  onRemoveFromPassed: (stock: Stock) => void;
}

export function PassedPage({ passed, onRemoveFromPassed }: PassedPageProps) {
  const [detailModalStock, setDetailModalStock] = useState<Stock | null>(null);

  return (
    <div className="px-3 sm:px-4 py-3 sm:py-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Passed</h1>
        <p className="text-slate-400 text-sm sm:text-base font-medium">Stocks you've skipped</p>
      </div>

      {passed.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <X className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-sm sm:text-base">No passed stocks yet</p>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Swipe left on stocks you want to skip</p>
        </div>
      ) : (
        <div className="space-y-3">
          {passed.map((stock, index) => (
            <motion.div 
              key={stock.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02, opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              className="bg-slate-800/30 rounded-2xl p-4 sm:p-5 border border-slate-700/50 opacity-60 hover:border-slate-600/70 transition-all duration-300 cursor-pointer hover:shadow-xl relative overflow-hidden group"
              onClick={() => setDetailModalStock(stock)}
            >
              {/* Subtle red tint on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/0 to-red-900/0 group-hover:from-red-900/5 group-hover:to-red-900/10 transition-all duration-500 rounded-2xl" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-white truncate mb-0.5">{stock.symbol}</h3>
                    <p className="text-slate-400 text-sm sm:text-base truncate font-medium">{stock.name}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 ml-2 transition-all duration-300 group-hover:scale-105 ${
                    stock.change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {stock.change >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">${stock.price.toFixed(2)}</span>
                  <span className={`text-sm sm:text-base font-bold mb-1 ${ // ... existing code ...
                    stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div className="truncate">
                    <span className="text-slate-500 block font-medium mb-1">Market Cap</span>
                    <span className="text-slate-200 font-semibold">${stock.marketCap}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium mb-1">P/E Ratio</span>
                    <span className="text-slate-200 font-semibold">{stock.pe.toFixed(1)}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500 block font-medium mb-1">Sector</span>
                    <span className="text-slate-200 truncate block font-semibold">{stock.sector}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stock Detail Modal */}
      {detailModalStock && (
        <StockDetailModal
          stock={detailModalStock}
          isOpen={!!detailModalStock}
          onClose={() => setDetailModalStock(null)}
        />
      )}
    </div>
  );
}