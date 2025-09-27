// Shared types for Investment Comparison feature
export interface Asset {
  symbol: string;
  name: string;
  allocation: number; // fraction (0-1)
  quoteType?: string;
  exchange?: string;
}

export interface DCAResult {
  symbol: string;
  name: string;
  allocation: number;
  totalInvested: number;
  finalValue: number;
  totalShares: number;
  profitLoss: number;
  totalReturn: number; // percent
  annualizedReturn: number; // percent
  averageCost: number;
  currentPrice: number;
}

// Timeline point returned from backend for performance charting.
// Contains date plus dynamic keys for each asset symbol, plus portfolio & benchmark values.
export interface TimelinePoint {
  date: string; // ISO date string (yyyy-mm-dd)
  portfolio: number;
  benchmark: number;
  // Additional dynamic keys like [symbol]: number are allowed.
  [symbol: string]: string | number; // date string or numeric values
}
