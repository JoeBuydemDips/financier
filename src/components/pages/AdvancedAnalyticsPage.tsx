import { motion } from 'framer-motion';
import { MonteCarloSimulation } from '../MonteCarloSimulation';
import { ScenarioAnalysis } from '../ScenarioAnalysis';

interface AdvancedAnalyticsPageProps {
  results: any;
  riskMetrics: any;
  stockInfo: any;
  contribution: string;
  cadence: string;
  startDate: string;
  endDate: string;
}

export const AdvancedAnalyticsPage = ({
  results,
  riskMetrics,
  stockInfo,
  contribution,
  cadence,
  startDate,
  endDate
}: AdvancedAnalyticsPageProps) => {
  const years = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 365));

  if (!results) {
    return (
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Calculate investment returns to view advanced analytics
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="advanced-analytics-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Monte Carlo Simulation */}
      <MonteCarloSimulation 
        results={results}
        riskMetrics={riskMetrics}
        contribution={contribution}
        cadence={cadence}
        years={years}
      />

      {/* Scenario Analysis */}
      <ScenarioAnalysis 
        results={results}
        stockInfo={stockInfo}
        contribution={contribution}
        cadence={cadence}
        years={years}
      />
    </motion.div>
  );
};