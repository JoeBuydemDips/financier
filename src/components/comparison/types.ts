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
