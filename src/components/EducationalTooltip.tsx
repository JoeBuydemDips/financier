import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, HelpCircle } from 'lucide-react';

interface EducationalTooltipProps {
  term: string;
  explanation: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const EducationalTooltip = ({ 
  term, 
  explanation, 
  icon = <Info size={16} />, 
  children 
}: EducationalTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="educational-tooltip-container">
      <div 
        className="educational-trigger"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children || (
          <div className="tooltip-icon">
            {icon}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="educational-tooltip"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tooltip-header">
              <HelpCircle size={16} />
              <span className="tooltip-term">{term}</span>
            </div>
            <div className="tooltip-explanation">
              {explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Pre-defined financial term explanations
export const financialTerms = {
  'Dollar-Cost Averaging': 'A strategy where you invest a fixed amount at regular intervals, regardless of market conditions. This helps reduce the impact of market volatility by spreading purchases over time.',
  
  'Annualized Return': 'The average annual return of an investment over a specific period, expressed as a percentage. It shows what you would earn per year if the rate of return stayed constant.',
  
  'Total Return': 'The overall percentage gain or loss on an investment, including both capital appreciation and any dividends or interest received.',
  
  'Sharpe Ratio': 'A measure of risk-adjusted return. Higher values indicate better risk-adjusted performance. Values above 1.0 are generally considered good.',
  
  'Beta': 'A measure of how much a stock moves relative to the market. A beta of 1.0 means it moves with the market, above 1.0 means more volatile, below 1.0 means less volatile.',
  
  'P/E Ratio': 'Price-to-Earnings ratio compares a company\'s stock price to its earnings per share. Lower values may indicate the stock is undervalued, but context matters.',
  
  'Market Cap': 'The total value of a company\'s shares in the stock market. Calculated by multiplying share price by number of outstanding shares.',
  
  'Volatility': 'A measure of how much an investment\'s price fluctuates over time. Higher volatility means larger price swings and potentially higher risk.',
  
  'Maximum Drawdown': 'The largest peak-to-trough decline in portfolio value during a specific period. It measures the worst-case scenario for your investment.',
  
  'Dividend Yield': 'The annual dividend payment as a percentage of the stock price. It shows how much income you receive relative to your investment.',
  
  'Profit Margin': 'The percentage of revenue that becomes profit after all expenses. Higher margins indicate more efficient operations.',
  
  'Compound Interest': 'Interest earned on both the initial investment and previously earned interest. It\'s the reason why long-term investing can be so powerful.'
};

export const FinancialTerm = ({ term, children }: { term: keyof typeof financialTerms; children: React.ReactNode }) => {
  return (
    <EducationalTooltip
      term={term}
      explanation={financialTerms[term]}
    >
      <span className="financial-term-link">
        {children}
        <Info size={14} className="term-icon" />
      </span>
    </EducationalTooltip>
  );
};