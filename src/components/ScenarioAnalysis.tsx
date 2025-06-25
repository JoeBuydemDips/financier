import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertCircle,
  CheckCircle,
  MinusCircle
} from 'lucide-react';

interface ScenarioAnalysisProps {
  results: any;
  stockInfo: any;
  contribution: string;
  cadence: string;
  years: number;
}

export const ScenarioAnalysis = ({ 
  results, 
  stockInfo, 
  contribution, 
  cadence, 
  years 
}: ScenarioAnalysisProps) => {
  const [scenarios, setScenarios] = useState(null);

  useEffect(() => {
    if (results) {
      calculateScenarios();
    }
  }, [results, contribution, cadence, years]);

  const calculateScenarios = () => {
    const monthlyContribution = parseFloat(contribution) * (
      cadence === 'monthly' ? 1 : 
      cadence === 'weekly' ? 4.33 : 
      30
    );
    const totalMonths = years * 12;
    const totalContributed = monthlyContribution * totalMonths;

    // Historical market scenarios based on real events
    const scenarioReturns = {
      bear: -0.15, // -15% annual (2008 financial crisis level)
      recession: -0.05, // -5% annual (mild recession)
      base: results.annualizedRoi / 100, // Current calculated return
      bull: 0.15, // 15% annual (strong bull market)
      exceptional: 0.25 // 25% annual (tech boom level)
    };

    const calculateScenarioValue = (annualReturn) => {
      let portfolioValue = 0;
      const monthlyReturn = annualReturn / 12;

      for (let month = 0; month < totalMonths; month++) {
        portfolioValue += monthlyContribution;
        portfolioValue *= (1 + monthlyReturn);
      }

      return portfolioValue;
    };

    const scenarioData = Object.entries(scenarioReturns).map(([key, annualReturn]) => {
      const finalValue = calculateScenarioValue(annualReturn);
      const profit = finalValue - totalContributed;
      const totalReturn = (profit / totalContributed) * 100;

      return {
        key,
        name: {
          bear: 'Bear Market',
          recession: 'Recession',
          base: 'Base Case',
          bull: 'Bull Market',
          exceptional: 'Exceptional Growth'
        }[key],
        description: {
          bear: 'Severe market downturn (-15% annually)',
          recession: 'Mild economic contraction (-5% annually)',
          base: `Historical performance (${(annualReturn * 100).toFixed(1)}% annually)`,
          bull: 'Strong economic growth (15% annually)',
          exceptional: 'Tech boom conditions (25% annually)'
        }[key],
        annualReturn: annualReturn * 100,
        finalValue,
        profit,
        totalReturn,
        totalContributed,
        probability: {
          bear: 10,
          recession: 20,
          base: 40,
          bull: 25,
          exceptional: 5
        }[key]
      };
    });

    setScenarios(scenarioData);
  };

  if (!scenarios) return null;

  const getScenarioIcon = (key) => {
    switch (key) {
      case 'bear':
      case 'recession':
        return <TrendingDown size={20} />;
      case 'bull':
      case 'exceptional':
        return <TrendingUp size={20} />;
      default:
        return <Activity size={20} />;
    }
  };

  const getScenarioColor = (key) => {
    switch (key) {
      case 'bear':
        return 'var(--accent-red)';
      case 'recession':
        return '#ff9500';
      case 'base':
        return 'var(--accent-blue)';
      case 'bull':
        return 'var(--accent-green)';
      case 'exceptional':
        return '#00ff88';
      default:
        return 'var(--text-primary)';
    }
  };

  const getOutcomeIcon = (totalReturn) => {
    if (totalReturn >= 100) return <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />;
    if (totalReturn >= 0) return <MinusCircle size={16} style={{ color: '#ff9500' }} />;
    return <AlertCircle size={16} style={{ color: 'var(--accent-red)' }} />;
  };

  return (
    <motion.div 
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="card-header">
        <h3 className="card-title">
          <Activity size={20} />
          Scenario Analysis ({years} Year Investment)
        </h3>
      </div>
      <div className="card-body">
        <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <motion.div
              key={scenario.key}
              className={`scenario-card ${scenario.key}`}
              whileHover={{ scale: 1.02 }}
              style={{ 
                borderLeft: `4px solid ${getScenarioColor(scenario.key)}`,
              }}
            >
              <div className="scenario-header">
                <div className="scenario-icon" style={{ color: getScenarioColor(scenario.key) }}>
                  {getScenarioIcon(scenario.key)}
                </div>
                <div className="scenario-title">
                  <h4>{scenario.name}</h4>
                  <div className="scenario-probability">
                    {scenario.probability}% probability
                  </div>
                </div>
                <div className="scenario-outcome">
                  {getOutcomeIcon(scenario.totalReturn)}
                </div>
              </div>

              <div className="scenario-description">
                {scenario.description}
              </div>

              <div className="scenario-metrics">
                <div className="scenario-metric">
                  <span className="metric-label">Final Value</span>
                  <span className="metric-value">
                    ${scenario.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="scenario-metric">
                  <span className="metric-label">Profit/Loss</span>
                  <span className={`metric-value ${scenario.profit >= 0 ? 'positive' : 'negative'}`}>
                    {scenario.profit >= 0 ? '+' : ''}${scenario.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="scenario-metric">
                  <span className="metric-label">Total Return</span>
                  <span className={`metric-value ${scenario.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                    {scenario.totalReturn >= 0 ? '+' : ''}{scenario.totalReturn.toFixed(1)}%
                  </span>
                </div>

                <div className="scenario-metric">
                  <span className="metric-label">Annual Return</span>
                  <span className={`metric-value ${scenario.annualReturn >= 0 ? 'positive' : 'negative'}`}>
                    {scenario.annualReturn >= 0 ? '+' : ''}{scenario.annualReturn.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Risk Level Indicator */}
              <div className="scenario-risk">
                <div className="risk-indicator">
                  <span className="risk-label">Risk Level:</span>
                  <span className={`risk-badge ${
                    scenario.key === 'bear' ? 'high' :
                    scenario.key === 'recession' ? 'medium-high' :
                    scenario.key === 'base' ? 'medium' :
                    scenario.key === 'bull' ? 'medium-low' :
                    'low'
                  }`}>
                    {scenario.key === 'bear' ? 'Very High' :
                     scenario.key === 'recession' ? 'High' :
                     scenario.key === 'base' ? 'Moderate' :
                     scenario.key === 'bull' ? 'Low' :
                     'Very Low'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="scenario-summary">
          <h4>Key Insights</h4>
          <div className="insights-grid">
            <div className="insight-card">
              <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
              <div>
                <strong>Upside Potential:</strong> In bull market conditions, your investment could grow to 
                ${scenarios.find(s => s.key === 'bull')?.finalValue.toLocaleString()} 
                ({scenarios.find(s => s.key === 'bull')?.totalReturn.toFixed(0)}% return)
              </div>
            </div>
            
            <div className="insight-card">
              <AlertCircle size={16} style={{ color: 'var(--accent-red)' }} />
              <div>
                <strong>Downside Risk:</strong> In bear market conditions, you could face losses up to 
                ${Math.abs(scenarios.find(s => s.key === 'bear')?.profit || 0).toLocaleString()}
              </div>
            </div>
            
            <div className="insight-card">
              <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
              <div>
                <strong>Most Likely:</strong> Based on historical patterns, expect returns between 
                {scenarios.find(s => s.key === 'recession')?.annualReturn.toFixed(0)}% and 
                {scenarios.find(s => s.key === 'bull')?.annualReturn.toFixed(0)}% annually
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};