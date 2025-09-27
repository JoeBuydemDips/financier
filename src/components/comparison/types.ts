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

// Aggregated portfolio level result
export interface PortfolioResult {
  totalInvested: number;
  finalValue: number;
  profitLoss: number;
  totalReturn: number; // percent
  assets: number; // asset count
}

// Request payload shape for calculate-dca
export interface DCARequest {
  assets: { symbol: string; name: string; allocation: number }[];
  startDate: string;
  endDate: string;
  initialAmount: number;
  contributionAmount: number;
  contributionFrequency: string; // 'monthly' | 'weekly' | etc.
}

// Response from calculate-dca Netlify function
export interface DCAResponse {
  assets: DCAResult[];
  benchmark: DCAResult & { symbol: string; name: string; dataSource: string };
  portfolio: PortfolioResult;
  timeline?: TimelinePoint[];
  success: boolean;
  dataSources: {
    primary: string;
    fallback: string;
    usedFallback: boolean;
  };
}
