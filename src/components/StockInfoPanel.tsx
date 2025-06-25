import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Info,
  Building2,
  Percent
} from 'lucide-react';

interface StockInfo {
  symbol: string;
  shortName: string;
  currentPrice: number;
  currency: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  beta: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  avgVolume: number;
  sector: string;
  industry: string;
  profitMargins: number;
  bookValue: number;
  priceToBook: number;
}

interface StockInfoPanelProps {
  stockInfo: StockInfo | null;
  loading: boolean;
}

export const StockInfoPanel = ({ stockInfo, loading }: StockInfoPanelProps) => {
  if (loading) {
    return (
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <BarChart3 size={20} />
            Stock Information
          </h3>
        </div>
        <div className="card-body">
          <div className="loading-container" style={{ minHeight: '120px' }}>
            <div className="spinner"></div>
            <div className="loading-text">Loading stock data...</div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!stockInfo) {
    return null;
  }

  const formatCurrency = (value: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stockInfo.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toFixed(0)}`;
  };

  const formatPercent = (value: number) => {
    if (!value && value !== 0) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  const currentPricePosition = stockInfo.fiftyTwoWeekHigh && stockInfo.fiftyTwoWeekLow 
    ? ((stockInfo.currentPrice - stockInfo.fiftyTwoWeekLow) / (stockInfo.fiftyTwoWeekHigh - stockInfo.fiftyTwoWeekLow)) * 100
    : 0;

  return (
    <motion.div 
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="card-header">
        <h3 className="card-title">
          <BarChart3 size={20} />
          {stockInfo.shortName} ({stockInfo.symbol})
        </h3>
      </div>
      <div className="card-body">
        {/* Current Price */}
        <div className="stock-price-section">
          <div className="current-price">
            <span className="price-value">{formatCurrency(stockInfo.currentPrice)}</span>
          </div>
          
          {/* 52-week range indicator */}
          {stockInfo.fiftyTwoWeekHigh && stockInfo.fiftyTwoWeekLow && (
            <div className="price-range">
              <div className="range-bar">
                <div 
                  className="range-indicator" 
                  style={{ left: `${currentPricePosition}%` }}
                />
                <div 
                  className="range-fill" 
                  style={{ width: `${currentPricePosition}%` }}
                />
              </div>
              <div className="range-labels">
                <span>52W Low: {formatCurrency(stockInfo.fiftyTwoWeekLow)}</span>
                <span>52W High: {formatCurrency(stockInfo.fiftyTwoWeekHigh)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-icon">
              <Building2 size={16} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Market Cap</div>
              <div className="metric-value">{formatLargeNumber(stockInfo.marketCap)}</div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">
              <BarChart3 size={16} />
            </div>
            <div className="metric-content">
              <div className="metric-label">P/E Ratio</div>
              <div className="metric-value">{stockInfo.peRatio?.toFixed(2) || 'N/A'}</div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">
              <Percent size={16} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Dividend Yield</div>
              <div className="metric-value">{formatPercent(stockInfo.dividendYield)}</div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">
              <TrendingUp size={16} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Beta</div>
              <div className="metric-value">{stockInfo.beta?.toFixed(2) || 'N/A'}</div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">
              <BarChart3 size={16} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Volume</div>
              <div className="metric-value">
                {stockInfo.volume ? (stockInfo.volume / 1e6).toFixed(1) + 'M' : 'N/A'}
              </div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">
              <Percent size={16} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Profit Margin</div>
              <div className="metric-value">{formatPercent(stockInfo.profitMargins)}</div>
            </div>
          </div>
        </div>

        {/* Sector & Industry */}
        {(stockInfo.sector || stockInfo.industry) && (
          <div className="sector-info">
            {stockInfo.sector && (
              <div className="sector-tag">
                <Building2 size={14} />
                {stockInfo.sector}
              </div>
            )}
            {stockInfo.industry && (
              <div className="industry-tag">
                {stockInfo.industry}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};