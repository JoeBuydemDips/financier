import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Target, 
  Building2, 
  AlertTriangle
} from 'lucide-react';

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const NavigationTabs = ({ activeTab, onTabChange }: NavigationTabsProps) => {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 size={18} />,
      description: 'Investment results and key metrics'
    },
    {
      id: 'analytics',
      label: 'Advanced Analytics',
      icon: <Target size={18} />,
      description: 'Monte Carlo & scenario analysis'
    },
    {
      id: 'stock',
      label: 'Stock Details',
      icon: <Building2 size={18} />,
      description: 'Company information and financials'
    },
    {
      id: 'risk',
      label: 'Risk Analysis',
      icon: <AlertTriangle size={18} />,
      description: 'Detailed risk metrics'
    }
  ];

  return (
    <div className="navigation-tabs">
      <div className="tabs-container">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="tab-icon">
              {tab.icon}
            </div>
            <div className="tab-content">
              <div className="tab-label">{tab.label}</div>
              <div className="tab-description">{tab.description}</div>
            </div>
            {activeTab === tab.id && (
              <motion.div
                className="tab-indicator"
                layoutId="tabIndicator"
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
    </div>
  );
};