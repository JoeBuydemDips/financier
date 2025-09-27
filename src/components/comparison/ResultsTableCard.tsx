import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import React from 'react';
import type { DCAResult } from './types';

interface ResultsTableCardProps {
  results: {
    assets: DCAResult[];
    benchmark: DCAResult;
    portfolio: any;
  };
  startDate: string;
  endDate: string;
}

const ResultsTableCard: React.FC<ResultsTableCardProps> = ({ results, startDate, endDate }) => {
  return (
    <motion.div 
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="card-header">
        <h3 className="card-title">
          <Activity size={20} />
          Detailed Results
        </h3>
      </div>
      <div className="card-body">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Asset</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Allocation</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Invested</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Final Value</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Profit/Loss</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Annual Return</th>
              </tr>
            </thead>
            <tbody>
              {results.assets.map(asset => (
                <tr key={asset.symbol} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.symbol}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{asset.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>{(asset.allocation * 100).toFixed(1)}%</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>${asset.totalInvested.toLocaleString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>${asset.finalValue.toLocaleString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: asset.profitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                    {asset.profitLoss >= 0 ? '+' : ''}${asset.profitLoss.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: asset.annualizedReturn >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                    {asset.annualizedReturn.toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr style={{ borderBottom: '2px solid var(--accent-green)', backgroundColor: 'rgba(0, 211, 149, 0.1)', fontWeight: 600 }}>
                <td style={{ padding: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: '1.1rem' }}>🎯 Portfolio Total</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Combined Performance</div>
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-green)' }}>100%</td>
                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-green)' }}>${results.assets.reduce((s, a) => s + a.totalInvested, 0).toLocaleString()}</td>
                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-green)' }}>${results.assets.reduce((s, a) => s + a.finalValue, 0).toLocaleString()}</td>
                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-green)', fontWeight: 700 }}>
                  +${(results.assets.reduce((s, a) => s + a.finalValue, 0) - results.assets.reduce((s, a) => s + a.totalInvested, 0)).toLocaleString()}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-green)', fontWeight: 700 }}>
                  {(
                    (results.assets.reduce((s, a) => s + a.finalValue, 0) - results.assets.reduce((s, a) => s + a.totalInvested, 0)) /
                    results.assets.reduce((s, a) => s + a.totalInvested, 0) *
                    100 /
                    (new Date(endDate).getFullYear() - new Date(startDate).getFullYear() || 1)
                  ).toFixed(1)}%
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-quaternary)' }}>
                <td style={{ padding: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>SPY (Benchmark)</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>S&P 500 ETF</div>
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>100%</td>
                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>${results.benchmark.totalInvested.toLocaleString()}</td>
                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>${results.benchmark.finalValue.toLocaleString()}</td>
                <td style={{ padding: '1rem', textAlign: 'right', color: results.benchmark.profitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                  {results.benchmark.profitLoss >= 0 ? '+' : ''}${results.benchmark.profitLoss.toLocaleString()}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', color: results.benchmark.annualizedReturn >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                  {results.benchmark.annualizedReturn.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultsTableCard;
