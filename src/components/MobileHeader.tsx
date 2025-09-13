import React from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileHeaderProps {
  activeTab: string;
  onBackClick: () => void;
  onMenuClick: () => void;
  isOverview: boolean;
}

const tabTitles: Record<string, string> = {
  overview: 'Financier',
  stockDetails: 'Stock Details',
  investmentComparison: 'Investment Comparison',
  riskAnalysis: 'Risk Analysis',
  advancedAnalytics: 'Advanced Analytics'
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  onBackClick,
  onMenuClick,
  isOverview
}) => {
  const title = tabTitles[activeTab] || 'Financier';

  return (
    <motion.header 
      className="mobile-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mobile-header-content">
        {/* Left side - Back button or hamburger */}
        <motion.button
          className="mobile-header-button"
          onClick={isOverview ? onMenuClick : onBackClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isOverview ? (
            <Menu size={24} />
          ) : (
            <ArrowLeft size={24} />
          )}
        </motion.button>

        {/* Center - Title */}
        <motion.h1 
          className="mobile-header-title"
          key={activeTab} // Key ensures animation on tab change
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {title}
        </motion.h1>

        {/* Right side - Menu button (only show on non-overview pages) */}
        {!isOverview && (
          <motion.button
            className="mobile-header-button"
            onClick={onMenuClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={20} />
          </motion.button>
        )}
      </div>
    </motion.header>
  );
};