import { motion } from 'framer-motion';
import { StockInfoPanel } from '../StockInfoPanel';

interface StockDetailsPageProps {
  stockInfo: any;
  stockInfoLoading: boolean;
}

export const StockDetailsPage = ({
  stockInfo,
  stockInfoLoading
}: StockDetailsPageProps) => {
  return (
    <motion.div 
      className="stock-details-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Enhanced Stock Information */}
      <StockInfoPanel stockInfo={stockInfo} loading={stockInfoLoading} />
      
      {/* Additional stock details can be added here in the future */}
      {stockInfo && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <h3 className="card-title">
              Company Overview
            </h3>
          </div>
          <div className="card-body">
            <div style={{ 
              display: 'grid', 
              gap: '2rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
            }}>
              <div>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Financial Metrics</h4>
                <div className="metrics-list">
                  <div className="metric-row">
                    <span className="metric-label">Market Capitalization</span>
                    <span className="metric-value">
                      {stockInfo.marketCap ? 
                        `$${(stockInfo.marketCap / 1e9).toFixed(1)}B` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Price-to-Earnings Ratio</span>
                    <span className="metric-value">
                      {stockInfo.peRatio?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Book Value</span>
                    <span className="metric-value">
                      {stockInfo.bookValue ? `$${stockInfo.bookValue.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Price-to-Book Ratio</span>
                    <span className="metric-value">
                      {stockInfo.priceToBook?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Trading Information</h4>
                <div className="metrics-list">
                  <div className="metric-row">
                    <span className="metric-label">Daily Volume</span>
                    <span className="metric-value">
                      {stockInfo.volume ? 
                        `${(stockInfo.volume / 1e6).toFixed(1)}M` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Average Volume (10D)</span>
                    <span className="metric-value">
                      {stockInfo.avgVolume ? 
                        `${(stockInfo.avgVolume / 1e6).toFixed(1)}M` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Beta (Volatility)</span>
                    <span className="metric-value">
                      {stockInfo.beta?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">52-Week Range</span>
                    <span className="metric-value">
                      {stockInfo.fiftyTwoWeekLow && stockInfo.fiftyTwoWeekHigh ? 
                        `$${stockInfo.fiftyTwoWeekLow.toFixed(2)} - $${stockInfo.fiftyTwoWeekHigh.toFixed(2)}` : 
                        'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};