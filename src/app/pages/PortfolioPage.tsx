import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Award } from 'lucide-react';
import { Stock } from '../data/mockStocks';
import { Holding } from '../App';
import { motion } from 'motion/react';

interface PortfolioPageProps {
  watchlist: Stock[];
  portfolio?: Holding[];
}

export function PortfolioPage({ watchlist, portfolio = [] }: PortfolioPageProps) {
  // Calculate portfolio stats from actual holdings
  const totalValue = portfolio.reduce((sum, holding) => sum + (holding.stock.price * holding.shares), 0);
  const totalCost = portfolio.reduce((sum, holding) => sum + (holding.purchasePrice * holding.shares), 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const isPositive = totalGain >= 0;

  // Sector allocation data from portfolio
  const sectorData = portfolio.reduce((acc, holding) => {
    const value = holding.stock.price * holding.shares;
    const existing = acc.find(item => item.name === holding.stock.sector);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: holding.stock.sector, value });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="px-3 sm:px-4 py-3 sm:py-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Portfolio</h1>
        <p className="text-slate-400 text-sm sm:text-base">Track your investments</p>
      </div>

      {portfolio.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <Award className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-sm sm:text-base">No stocks in your portfolio yet</p>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Buy stocks from your watchlist to start investing</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Portfolio Summary Card */}
          <div className="bg-gradient-to-br from-[#2C3863] to-[#1f2847] rounded-2xl p-4 sm:p-5 shadow-xl shadow-[#2C3863]/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-100 text-sm">Total Portfolio Value</span>
              <DollarSign className="w-5 h-5 text-blue-100" />
            </div>
            <div className="mb-4">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                ${totalValue.toFixed(2)}
              </div>
              <div className={`flex items-center gap-2 ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-semibold">
                  {isPositive ? '+' : ''}{totalGain.toFixed(2)} ({isPositive ? '+' : ''}{totalGainPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#3d4a7d]/50">
              <div>
                <span className="text-blue-100 text-xs block mb-1">Total Invested</span>
                <span className="text-white font-semibold text-lg">${totalCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-blue-100 text-xs block mb-1">Total Stocks</span>
                <span className="text-white font-semibold text-lg">{portfolio.length}</span>
              </div>
            </div>
          </div>

          {/* Sector Allocation */}
          {sectorData.length > 0 && (
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Sector Allocation
              </h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {sectorData.map((sector, index) => (
                  <div key={sector.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-slate-300 truncate">{sector.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holdings List */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
            <h3 className="text-base font-semibold text-white mb-3">Holdings</h3>
            <div className="space-y-2">
              {portfolio.map((holding, index) => {
                const holdingValue = holding.stock.price * holding.shares;
                const holdingCost = holding.purchasePrice * holding.shares;
                const holdingGain = holdingValue - holdingCost;
                const holdingGainPercent = holdingCost > 0 ? (holdingGain / holdingCost) * 100 : 0;
                
                return (
                  <motion.div 
                    key={holding.stock.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors duration-200 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-white text-sm">{holding.stock.symbol}</div>
                        <div className={`text-xs font-semibold ${holdingGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {holdingGain >= 0 ? '+' : ''}{holdingGainPercent.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 font-medium">{holding.shares} shares @ ${holding.purchasePrice.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-sm">${holdingValue.toFixed(2)}</div>
                      <div className={`text-xs font-semibold ${holdingGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {holdingGain >= 0 ? '+' : ''}{holdingGain.toFixed(2)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}