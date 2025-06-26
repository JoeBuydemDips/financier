import { motion } from 'framer-motion';
import { 
  AlertTriangle,
  TrendingDown,
  Shield,
  Activity,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { FinancialTerm } from '../EducationalTooltip';

interface RiskAnalysisPageProps {
  riskMetrics: any;
  stockInfo: any;
}

export const RiskAnalysisPage = ({
  riskMetrics,
  stockInfo
}: RiskAnalysisPageProps) => {
  if (!riskMetrics) {
    return (
      <motion.div 
        className="risk-analysis-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass-card empty-state">
          <div className="empty-state-content">
            <div className="empty-state-icon">
              <AlertTriangle size={48} />
            </div>
            <h2 className="empty-state-title">Risk Analysis Center</h2>
            <p className="empty-state-description">
              Calculate investment returns to access comprehensive risk metrics and analysis tools.
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '2rem',
              marginTop: '3rem',
              width: '100%',
              maxWidth: '900px'
            }}>
              <div className="highlight-card">
                <Activity size={24} />
                <div>
                  <h5>Volatility Analysis</h5>
                  <p>Measure price fluctuation and market sensitivity with annual volatility metrics</p>
                </div>
              </div>
              <div className="highlight-card">
                <TrendingDown size={24} />
                <div>
                  <h5>Drawdown Assessment</h5>
                  <p>Understand worst-case scenarios and maximum peak-to-trough declines</p>
                </div>
              </div>
              <div className="highlight-card">
                <BarChart3 size={24} />
                <div>
                  <h5>Risk-Adjusted Returns</h5>
                  <p>Evaluate Sharpe ratio and beta to measure risk-adjusted performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Risk level assessment
  const getRiskLevel = () => {
    const volatility = riskMetrics.volatility * 100;
    if (volatility > 30) return { level: 'Very High', color: 'var(--accent-red)', icon: <AlertTriangle size={20} /> };
    if (volatility > 20) return { level: 'High', color: '#ff9500', icon: <TrendingDown size={20} /> };
    if (volatility > 15) return { level: 'Moderate', color: 'var(--accent-blue)', icon: <Activity size={20} /> };
    if (volatility > 10) return { level: 'Low', color: 'var(--accent-green)', icon: <Shield size={20} /> };
    return { level: 'Very Low', color: '#00ff88', icon: <Shield size={20} /> };
  };

  const riskLevel = getRiskLevel();

  return (
    <motion.div 
      className="risk-analysis-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Risk Level Overview */}
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <AlertTriangle size={20} />
            Risk Assessment Overview
          </h3>
        </div>
        <div className="card-body">
          <div className="risk-overview">
            <div className="risk-level-indicator" style={{ borderColor: riskLevel.color }}>
              <div className="risk-icon" style={{ color: riskLevel.color }}>
                {riskLevel.icon}
              </div>
              <div className="risk-content">
                <div className="risk-level-title">Overall Risk Level</div>
                <div className="risk-level-value" style={{ color: riskLevel.color }}>
                  {riskLevel.level}
                </div>
                <div className="risk-level-description">
                  Based on {((riskMetrics.volatility * 100).toFixed(1))}% annual volatility
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Risk Metrics */}
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <Activity size={20} />
            Detailed Risk Metrics
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="metric-label">
                <FinancialTerm term="Volatility">Volatility (Annual)</FinancialTerm>
              </div>
              <div className="metric-value">
                {(riskMetrics.volatility * 100).toFixed(1)}%
              </div>
              <div className="metric-change">
                Price variation from average
              </div>
              <div className="risk-explanation">
                {riskMetrics.volatility > 0.3 ? 'Very volatile - expect large price swings' :
                 riskMetrics.volatility > 0.2 ? 'High volatility - significant price movements' :
                 riskMetrics.volatility > 0.15 ? 'Moderate volatility - normal market fluctuations' :
                 'Low volatility - relatively stable price movements'}
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="metric-label">
                <FinancialTerm term="Maximum Drawdown">Maximum Drawdown</FinancialTerm>
              </div>
              <div className="metric-value negative">
                -{(riskMetrics.maxDrawdown * 100).toFixed(1)}%
              </div>
              <div className="metric-change">
                Worst peak-to-trough decline
              </div>
              <div className="risk-explanation">
                {riskMetrics.maxDrawdown > 0.5 ? 'Severe losses possible during downturns' :
                 riskMetrics.maxDrawdown > 0.3 ? 'Significant losses possible in bear markets' :
                 riskMetrics.maxDrawdown > 0.2 ? 'Moderate losses during market corrections' :
                 'Limited downside risk historically'}
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="metric-label">
                <FinancialTerm term="Sharpe Ratio">Sharpe Ratio</FinancialTerm>
              </div>
              <div className={`metric-value ${riskMetrics.sharpeRatio > 1 ? 'positive' : riskMetrics.sharpeRatio > 0 ? '' : 'negative'}`}>
                {riskMetrics.sharpeRatio.toFixed(2)}
              </div>
              <div className="metric-change">
                Risk-adjusted return efficiency
              </div>
              <div className="risk-explanation">
                {riskMetrics.sharpeRatio > 2 ? 'Excellent risk-adjusted returns' :
                 riskMetrics.sharpeRatio > 1 ? 'Good risk-adjusted returns' :
                 riskMetrics.sharpeRatio > 0 ? 'Adequate compensation for risk' :
                 'Poor risk-adjusted returns'}
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="metric-label">
                <FinancialTerm term="Beta">Beta vs S&P 500</FinancialTerm>
              </div>
              <div className="metric-value">
                {riskMetrics.beta.toFixed(2)}
              </div>
              <div className="metric-change">
                Market correlation and sensitivity
              </div>
              <div className="risk-explanation">
                {riskMetrics.beta > 1.5 ? 'Highly sensitive to market movements' :
                 riskMetrics.beta > 1.2 ? 'More volatile than the market' :
                 riskMetrics.beta > 0.8 ? 'Similar volatility to the market' :
                 'Less volatile than the market'}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Risk Recommendations */}
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <Shield size={20} />
            Risk Management Recommendations
          </h3>
        </div>
        <div className="card-body">
          <div className="recommendations-grid">
            <div className="recommendation-card">
              <div className="recommendation-header">
                <Shield size={16} style={{ color: 'var(--accent-blue)' }} />
                <span>Diversification</span>
              </div>
              <div className="recommendation-content">
                {riskMetrics.volatility > 0.25 ? 
                  'High volatility detected. Consider diversifying across multiple stocks or sectors to reduce risk.' :
                  'Current volatility is manageable. Maintain diversification across asset classes.'
                }
              </div>
            </div>

            <div className="recommendation-card">
              <div className="recommendation-header">
                <Activity size={16} style={{ color: 'var(--accent-green)' }} />
                <span>Position Sizing</span>
              </div>
              <div className="recommendation-content">
                {riskMetrics.maxDrawdown > 0.3 ? 
                  'High drawdown risk. Consider smaller position sizes or stop-loss strategies.' :
                  'Drawdown risk is moderate. Current position sizing appears reasonable.'
                }
              </div>
            </div>

            <div className="recommendation-card">
              <div className="recommendation-header">
                <TrendingDown size={16} style={{ color: '#ff9500' }} />
                <span>Market Timing</span>
              </div>
              <div className="recommendation-content">
                {riskMetrics.beta > 1.3 ? 
                  'High market sensitivity. Consider market timing or hedging strategies during volatile periods.' :
                  'Market sensitivity is reasonable. Dollar-cost averaging helps reduce timing risk.'
                }
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};