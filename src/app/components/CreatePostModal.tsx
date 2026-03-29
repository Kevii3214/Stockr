import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import { Stock, mockStocks } from '../data/mockStocks';
import { motion, AnimatePresence } from 'motion/react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stock: Stock, caption: string, sentiment: 'bullish' | 'bearish' | 'neutral') => void;
  preselectedStock?: Stock;
}

export function CreatePostModal({ isOpen, onClose, onSubmit, preselectedStock }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [sentiment, setSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(preselectedStock || null);
  const [showStockPicker, setShowStockPicker] = useState(!preselectedStock);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter stocks based on search
  const filteredStocks = mockStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (!selectedStock || !caption.trim()) return;
    
    onSubmit(selectedStock, caption, sentiment);
    setCaption('');
    setSentiment('neutral');
    setSelectedStock(null);
    setSearchQuery('');
    setShowStockPicker(!preselectedStock);
    onClose();
  };

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setShowStockPicker(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-slate-800 rounded-t-3xl sm:rounded-3xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
            <h2 className="text-xl font-bold text-white">Create Post</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Stock Selector / Display */}
            {showStockPicker ? (
              <div>
                <label className="block text-slate-300 font-medium mb-2 text-sm">
                  Select a Stock
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2C3863] focus:border-transparent"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 rounded-xl">
                  {filteredStocks.slice(0, 10).map((stock) => (
                    <button
                      key={stock.id}
                      onClick={() => handleStockSelect(stock)}
                      className="w-full bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 rounded-xl p-4 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold">{stock.symbol}</span>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                stock.change >= 0
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {stock.change >= 0 ? '+' : ''}
                              {stock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">${stock.price.toFixed(2)}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Selected Stock Display */}
                {selectedStock && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-slate-300 font-medium text-sm">Selected Stock</label>
                      <button
                        onClick={() => setShowStockPicker(true)}
                        className="text-[#2C3863] hover:text-[#3d4a7d] text-xs font-semibold"
                      >
                        Change
                      </button>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold text-lg">{selectedStock.symbol}</span>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                selectedStock.change >= 0
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {selectedStock.change >= 0 ? '+' : ''}
                              {selectedStock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">{selectedStock.name}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-xl">
                            ${selectedStock.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Caption Input */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2 text-sm">
                    What's on your mind?
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Share your thoughts about this stock..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2C3863] focus:border-transparent resize-none h-32"
                    maxLength={500}
                  />
                  <div className="mt-2 text-right text-xs text-slate-500">
                    {caption.length}/500
                  </div>
                </div>

                {/* Sentiment Selector */}
                <div>
                  <label className="block text-slate-300 font-medium mb-3 text-sm">
                    Your Sentiment
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSentiment('bullish')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        sentiment === 'bullish'
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-bold block">Bullish</span>
                    </button>
                    <button
                      onClick={() => setSentiment('neutral')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        sentiment === 'neutral'
                          ? 'bg-slate-500/20 border-slate-500 text-slate-300'
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Minus className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-bold block">Neutral</span>
                    </button>
                    <button
                      onClick={() => setSentiment('bearish')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        sentiment === 'bearish'
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <TrendingDown className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-bold block">Bearish</span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedStock || !caption.trim()}
                  className="w-full bg-[#2C3863] hover:bg-[#3d4a7d] disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg shadow-[#2C3863]/30 disabled:shadow-none"
                >
                  Post to Community
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}