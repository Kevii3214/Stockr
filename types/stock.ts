export interface Stock {
  id: string;
  ticker: string;
  company_name: string;
  sector: string | null;
  description: string | null;
  logo_url: string | null;
  finnhub_symbol?: string;  // Only for crypto: e.g. "BINANCE:BTCUSDT"
  yahoo_symbol?: string;    // Only for crypto: e.g. "BTC-USD"
}

export interface StockLiveData {
  price: number;
  prevClose: number;
  changePercent: number;
  candles: number[];
  lastUpdated: number;
  open?: number;     // today's open price (undefined when market closed)
  dayHigh?: number;  // today's high (undefined when market closed)
  dayLow?: number;   // today's low (undefined when market closed)
}

export interface StockFundamentals {
  weekHigh52: number | null;
  weekLow52: number | null;
  peRatio: number | null;
  marketCap: number | null;       // in millions (Finnhub units)
  eps: number | null;
  beta: number | null;
  dividendYield: number | null;   // in % (Finnhub units)
  avgVolume10d: number | null;    // in millions (Finnhub units)
  updatedAt: string;              // ISO timestamp
}

export type StockWithLive = Stock & {
  live: StockLiveData | null;
  fundamentals: StockFundamentals | null;
};
