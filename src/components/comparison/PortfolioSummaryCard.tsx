import { motion } from 'framer-motion';
import { PieChart } from 'lucide-react';
import React from 'react';

interface PortfolioSummaryCardProps {
  portfolio: {
    totalInvested: number;
    finalValue: number;
    profitLoss: number;
    totalReturn: number;
  };
}

const PortfolioSummaryCard: React.FC<PortfolioSummaryCardProps> = ({ portfolio }) => {
  return (
    <motion.div 
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="card-header">
        <h3 className="card-title">
          <PieChart size={20} />
          Portfolio Summary
        </h3>
      </div>
      <div className="card-body">
        <div className="investment-strategy-grid">
          <motion.div 
            className="metric-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="metric-label">Total Invested</div>
            <div className="metric-value">
              ${portfolio.totalInvested.toLocaleString()}
            </div>
          </motion.div>

          <motion.div 
            className="metric-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="metric-label">Portfolio Value</div>
            <div className="metric-value">
              ${portfolio.finalValue.toLocaleString()}
            </div>
          </motion.div>

            <motion.div 
            className="metric-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="metric-label">Total Profit/Loss</div>
            <div className={`metric-value ${portfolio.profitLoss >= 0 ? 'positive' : 'negative'}`}>
              {portfolio.profitLoss >= 0 ? '+' : ''}${portfolio.profitLoss.toLocaleString()}
            </div>
          </motion.div>

          <motion.div 
            className="metric-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="metric-label">Total Return</div>
            <div className={`metric-value ${portfolio.totalReturn >= 0 ? 'positive' : 'negative'}`}>
              {portfolio.totalReturn.toFixed(1)}%
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default PortfolioSummaryCard;
