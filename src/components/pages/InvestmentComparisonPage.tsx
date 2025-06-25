import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Zap,
  Clock,
  Target,
  Calculator,
  Award,
  AlertCircle
} from 'lucide-react';

interface InvestmentComparisonPageProps {
  results: any;
  contribution: string;
  cadence: string;
  startDate: string;
  endDate: string;
}

export const InvestmentComparisonPage = ({
  results,
  contribution,
  cadence,
  startDate,
  endDate
}: InvestmentComparisonPageProps) => {
  const [comparisonTicker, setComparisonTicker] = useState('AAPL');
  const [comparisonResults, setComparisonResults] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Calculate time periods
  const years = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
  const totalContributions = parseFloat(contribution) * (cadence === 'monthly' ? 12 : cadence === 'weekly' ? 52 : 365) * years;

  const runComparison = async () => {
    if (!comparisonTicker.trim()) return;
    
    setComparisonLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/history/${comparisonTicker}?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch comparison data');
      
      const data = await response.json();
      if (!data.stock || data.stock.length === 0) {
        throw new Error('No data found for comparison ticker');
      }

      // Calculate returns for comparison ticker (simplified calculation)
      const historicalData = data.stock;
      let totalShares = 0;
      let totalInvested = 0;
      const contributionAmount = parseFloat(contribution);
      
      // Simulate DCA for comparison stock
      for (let month = 0; month < years * 12; month++) {
        const dataIndex = Math.floor((month / (years * 12)) * historicalData.length);
        const priceAtMonth = historicalData[dataIndex]?.close || historicalData[0]?.close;
        if (priceAtMonth) {
          totalShares += contributionAmount / priceAtMonth;
          totalInvested += contributionAmount;
        }
      }
      
      const finalPrice = historicalData[historicalData.length - 1]?.close || 0;
      const finalValue = totalShares * finalPrice;
      const profitLoss = finalValue - totalInvested;
      const totalRoi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
      const annualizedRoi = totalInvested > 0 ? ((Math.pow(finalValue / totalInvested, 1 / years)) - 1) * 100 : 0;

      setComparisonResults({
        ticker: comparisonTicker,
        totalInvested,
        finalValue,
        profitLoss,
        totalRoi,
        annualizedRoi
      });
    } catch (error) {
      console.error('Comparison error:', error);
      setComparisonResults(null);
    } finally {
      setComparisonLoading(false);
    }
  };

  const getWinner = () => {
    if (!results || !comparisonResults) return null;
    return results.annualizedRoi > comparisonResults.annualizedRoi ? 'current' : 'comparison';
  };

  const getDifference = () => {
    if (!results || !comparisonResults) return 0;
    return Math.abs(results.annualizedRoi - comparisonResults.annualizedRoi);
  };

  if (!results) {
    return (
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Calculate investment returns to compare different strategies
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="investment-comparison-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Comparison Setup */}
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <BarChart3 size={20} />
            Compare Investment Strategies
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label className="form-label">
                Compare against another stock
              </label>
              <input
                type="text"
                className="form-input"
                value={comparisonTicker}
                onChange={(e) => setComparisonTicker(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, MSFT, GOOGL"
                style={{ textTransform: 'uppercase' }}
              />
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                See how your investment would perform with a different stock using the same strategy
              </div>
            </div>
            <motion.button
              className="btn-primary"
              onClick={runComparison}
              disabled={comparisonLoading || !comparisonTicker.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ height: 'fit-content', padding: '0.875rem 2rem' }}
            >
              {comparisonLoading ? 'Comparing...' : 'Compare'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Side-by-Side Comparison */}
      {comparisonResults && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <Award size={20} />
              Head-to-Head Comparison
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Current Investment */}
              <div style={{ 
                padding: '1.5rem', 
                background: getWinner() === 'current' ? 'rgba(0, 211, 149, 0.1)' : 'var(--bg-quaternary)', 
                border: getWinner() === 'current' ? '2px solid var(--accent-green)' : '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                position: 'relative'
              }}>
                {getWinner() === 'current' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-10px', 
                    left: '1rem', 
                    background: 'var(--accent-green)', 
                    color: 'white', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Winner
                  </div>
                )}
                
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Current Investment
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-green)' }}>
                    ${results.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Final portfolio value
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Return:</span>
                    <span style={{ fontWeight: '600', color: results.totalRoi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {results.totalRoi.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Annual Return:</span>
                    <span style={{ fontWeight: '600', color: results.annualizedRoi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {results.annualizedRoi.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Profit/Loss:</span>
                    <span style={{ fontWeight: '600', color: results.profitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      ${Math.abs(results.profitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparison Investment */}
              <div style={{ 
                padding: '1.5rem', 
                background: getWinner() === 'comparison' ? 'rgba(0, 211, 149, 0.1)' : 'var(--bg-quaternary)', 
                border: getWinner() === 'comparison' ? '2px solid var(--accent-green)' : '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                position: 'relative'
              }}>
                {getWinner() === 'comparison' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-10px', 
                    left: '1rem', 
                    background: 'var(--accent-green)', 
                    color: 'white', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Winner
                  </div>
                )}
                
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {comparisonResults.ticker}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-blue)' }}>
                    ${comparisonResults.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Final portfolio value
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Return:</span>
                    <span style={{ fontWeight: '600', color: comparisonResults.totalRoi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {comparisonResults.totalRoi.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Annual Return:</span>
                    <span style={{ fontWeight: '600', color: comparisonResults.annualizedRoi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {comparisonResults.annualizedRoi.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Profit/Loss:</span>
                    <span style={{ fontWeight: '600', color: comparisonResults.profitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      ${Math.abs(comparisonResults.profitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: 'var(--bg-tertiary)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Performance Summary
                </div>
                
                {getWinner() === 'current' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-green)' }}>
                    <TrendingUp size={20} />
                    <span style={{ fontSize: '1rem', fontWeight: '600' }}>
                      Your current investment outperformed {comparisonResults.ticker} by {getDifference().toFixed(1)}% annually
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-red)' }}>
                    <TrendingDown size={20} />
                    <span style={{ fontSize: '1rem', fontWeight: '600' }}>
                      {comparisonResults.ticker} outperformed your current investment by {getDifference().toFixed(1)}% annually
                    </span>
                  </div>
                )}
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Over {years} years with ${contribution} {cadence} contributions
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* What-If Scenarios */}
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <Calculator size={20} />
            What-If Scenarios
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Double Investment Scenario */}
            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
              style={{ padding: '1.5rem', textAlign: 'center' }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <Zap size={24} style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Double Your Contributions
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-green)', marginBottom: '0.5rem' }}>
                ${(results.finalValue * 2).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                If you invested ${(parseFloat(contribution) * 2)} {cadence}
              </div>
            </motion.div>

            {/* Earlier Start Scenario */}
            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
              style={{ padding: '1.5rem', textAlign: 'center' }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <Clock size={24} style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Start 1 Year Earlier
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-green)', marginBottom: '0.5rem' }}>
                ${(results.finalValue * 1.15).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Estimated value with 1 extra year
              </div>
            </motion.div>

            {/* Lump Sum Scenario */}
            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
              style={{ padding: '1.5rem', textAlign: 'center' }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <Target size={24} style={{ color: 'var(--accent-red)', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Lump Sum Instead
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-green)', marginBottom: '0.5rem' }}>
                ${(results.totalContributed * (1 + results.annualizedRoi/100) ** years).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                If you invested ${results.totalContributed.toLocaleString()} upfront
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Key Insights */}
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <AlertCircle size={20} />
            Key Insights
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ 
              padding: '1rem', 
              background: 'var(--bg-quaternary)', 
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--accent-blue)'
            }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                💡 Time in Market vs Timing the Market
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Dollar-cost averaging helps reduce the impact of market volatility by spreading your investment over time. 
                This strategy often outperforms trying to time the market perfectly.
              </div>
            </div>

            <div style={{ 
              padding: '1rem', 
              background: 'var(--bg-quaternary)', 
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--accent-green)'
            }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                📈 Compound Growth Power
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Your {results.annualizedRoi.toFixed(1)}% annual return shows the power of compound growth. 
                Even small, consistent contributions can grow significantly over time.
              </div>
            </div>

            <div style={{ 
              padding: '1rem', 
              background: 'var(--bg-quaternary)', 
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--accent-purple)'
            }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                🎯 Consistency Beats Perfection
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Regular {cadence} investments of ${contribution} created more wealth than most investors achieve 
                by trying to pick the perfect stock or timing.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};