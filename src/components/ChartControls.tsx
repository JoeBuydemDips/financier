import { motion } from 'framer-motion';
import { 
  AreaChart as AreaChartIcon, 
  TrendingUp, 
  Eye, 
  EyeOff,
  BarChart3,
  Activity
} from 'lucide-react';

interface ChartControlsProps {
  chartType: 'area' | 'line';
  onChartTypeChange: (type: 'area' | 'line') => void;
  visibleSeries: {
    contributions: boolean;
    portfolioValue: boolean;
    benchmarkValue: boolean;
  };
  onSeriesToggle: (series: keyof ChartControlsProps['visibleSeries']) => void;
}

export const ChartControls = ({ 
  chartType, 
  onChartTypeChange, 
  visibleSeries, 
  onSeriesToggle 
}: ChartControlsProps) => {
  const seriesConfig = [
    {
      key: 'contributions' as const,
      label: 'Total Invested',
      color: '#58a6ff',
      icon: <TrendingUp size={16} />
    },
    {
      key: 'portfolioValue' as const,
      label: 'Portfolio Value',
      color: '#00d395',
      icon: <Activity size={16} />
    },
    {
      key: 'benchmarkValue' as const,
      label: 'S&P 500 Benchmark',
      color: '#a5a3ff',
      icon: <BarChart3 size={16} />
    }
  ];

  return (
    <motion.div 
      className="chart-controls"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="chart-controls-section">
        <span className="chart-controls-label">Chart Type</span>
        <div className="chart-type-buttons">
          <motion.button
            className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => onChartTypeChange('area')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AreaChartIcon size={16} />
            Area
          </motion.button>
          <motion.button
            className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => onChartTypeChange('line')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <TrendingUp size={16} />
            Line
          </motion.button>
        </div>
      </div>

      <div className="chart-controls-section">
        <span className="chart-controls-label">Data Series</span>
        <div className="series-toggles">
          {seriesConfig.map((series) => (
            <motion.button
              key={series.key}
              className={`series-toggle ${visibleSeries[series.key] ? 'active' : 'inactive'}`}
              onClick={() => onSeriesToggle(series.key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                borderColor: visibleSeries[series.key] ? series.color : 'var(--border-primary)',
                backgroundColor: visibleSeries[series.key] 
                  ? `${series.color}15` 
                  : 'transparent'
              }}
            >
              <div className="series-toggle-icon" style={{ color: series.color }}>
                {series.icon}
              </div>
              <span className="series-toggle-label">{series.label}</span>
              <div className="series-toggle-visibility">
                {visibleSeries[series.key] ? (
                  <Eye size={14} style={{ color: series.color }} />
                ) : (
                  <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};