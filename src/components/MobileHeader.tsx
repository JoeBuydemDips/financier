import React from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileHeaderProps {
  activeTab: string;
  onBackClick: () => void;
  onMenuClick: () => void;
  isOverview: boolean;
  beginnerMode?: boolean;
  toggleBeginnerMode?: () => void;
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
  isOverview,
  beginnerMode,
  toggleBeginnerMode
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

        {/* Right side - Beginner toggle + Menu (non-overview) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {typeof beginnerMode === 'boolean' && toggleBeginnerMode && (
            <button
              onClick={toggleBeginnerMode}
              aria-pressed={beginnerMode}
              aria-label="Toggle beginner mode"
              style={{
                background: beginnerMode ? 'rgba(0,211,149,0.18)' : 'rgba(255,255,255,0.08)',
                border: beginnerMode ? '1px solid var(--accent-green)' : '1px solid rgba(255,255,255,0.15)',
                color: beginnerMode ? 'var(--accent-green)' : 'var(--text-secondary)',
                fontSize: '0.55rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {beginnerMode ? 'BEGINNER: ON' : 'BEGINNER: OFF'}
            </button>
          )}
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
      </div>
    </motion.header>
  );
};