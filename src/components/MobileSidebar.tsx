import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Building2, 
  AlertTriangle,
  X
} from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileSidebar = ({ isOpen, onClose, activeTab, onTabChange }: MobileSidebarProps) => {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 size={24} />,
      description: 'Investment results and key metrics'
    },
    {
      id: 'analytics',
      label: 'Investment Comparison',
      icon: <TrendingUp size={24} />,
      description: 'Compare stocks and strategies'
    },
    {
      id: 'stock',
      label: 'Stock Details',
      icon: <Building2 size={24} />,
      description: 'Company information and financials'
    },
    {
      id: 'risk',
      label: 'Risk Analysis',
      icon: <AlertTriangle size={24} />,
      description: 'Detailed risk metrics'
    }
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            className="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            {/* Header */}
            <div className="mobile-sidebar-header">
              <div className="mobile-sidebar-title">
                <BarChart3 size={24} />
                <span>Navigation</span>
              </div>
              <button 
                className="mobile-sidebar-close"
                onClick={onClose}
                aria-label="Close navigation"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="mobile-sidebar-content">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  className={`mobile-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mobile-sidebar-item-icon">
                    {tab.icon}
                  </div>
                  <div className="mobile-sidebar-item-content">
                    <div className="mobile-sidebar-item-label">{tab.label}</div>
                    <div className="mobile-sidebar-item-description">{tab.description}</div>
                  </div>
                  {activeTab === tab.id && (
                    <motion.div
                      className="mobile-sidebar-item-indicator"
                      layoutId="mobileSidebarIndicator"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="mobile-sidebar-footer">
              <div className="mobile-sidebar-footer-text">
                Swipe or tap outside to close
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};