import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface MonteCarloProps {
  results: any;
  riskMetrics: any;
  contribution: string;
  cadence: string;
  years: number;
}

export const MonteCarloSimulation = ({ 
  results, 
  riskMetrics, 
  contribution, 
  cadence,
  years 
}: MonteCarloProps) => {
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (results && riskMetrics) {
      runSimulation();
    }
  }, [results, riskMetrics, contribution, cadence, years]);

  const runSimulation = () => {
    setLoading(true);
    
    // Simulation parameters
    const numSimulations = 1000;
    const timeSteps = years * 12; // Monthly steps
    const monthlyContribution = parseFloat(contribution) * (cadence === 'monthly' ? 1 : cadence === 'weekly' ? 4.33 : 30);
    const annualReturn = results.annualizedRoi / 100;
    const monthlyReturn = annualReturn / 12;
    const monthlyVolatility = (riskMetrics.volatility || 0.2) / Math.sqrt(12);

    const simulations = [];
    const finalValues = [];

    for (let sim = 0; sim < numSimulations; sim++) {
      let portfolioValue = 0;
      let totalContributed = 0;
      const path = [];

      for (let month = 0; month < timeSteps; month++) {
        // Add monthly contribution
        portfolioValue += monthlyContribution;
        totalContributed += monthlyContribution;

        // Apply random return (normal distribution approximation)
        const randomReturn = monthlyReturn + monthlyVolatility * (Math.random() - 0.5) * 2 * Math.sqrt(3);
        portfolioValue *= (1 + randomReturn);

        // Store every 6 months for chart
        if (month % 6 === 0) {
          path.push({
            month: month / 12,
            value: portfolioValue,
            simulation: sim
          });
        }
      }

      finalValues.push(portfolioValue);
      simulations.push(path);
    }

    // Calculate percentiles
    finalValues.sort((a, b) => a - b);
    const percentiles = {
      p10: finalValues[Math.floor(numSimulations * 0.1)],
      p25: finalValues[Math.floor(numSimulations * 0.25)],
      p50: finalValues[Math.floor(numSimulations * 0.5)],
      p75: finalValues[Math.floor(numSimulations * 0.75)],
      p90: finalValues[Math.floor(numSimulations * 0.9)]
    };

    // Create chart data with percentile bands
    const chartData = [];
    const maxTimeSteps = Math.floor(timeSteps / 6);
    
    for (let i = 0; i <= maxTimeSteps; i++) {
      const timePoint = i * 0.5; // Every 6 months
      const valuesAtTime = simulations
        .map(sim => sim[i]?.value || 0)
        .filter(val => val > 0)
        .sort((a, b) => a - b);

      if (valuesAtTime.length > 0) {
        chartData.push({
          year: timePoint,
          p10: valuesAtTime[Math.floor(valuesAtTime.length * 0.1)] || 0,
          p25: valuesAtTime[Math.floor(valuesAtTime.length * 0.25)] || 0,
          p50: valuesAtTime[Math.floor(valuesAtTime.length * 0.5)] || 0,
          p75: valuesAtTime[Math.floor(valuesAtTime.length * 0.75)] || 0,
          p90: valuesAtTime[Math.floor(valuesAtTime.length * 0.9)] || 0,
          contributions: monthlyContribution * i * 6
        });
      }
    }

    setSimulationData({
      percentiles,
      chartData,
      totalContributed: monthlyContribution * timeSteps,
      numSimulations
    });
    
    setLoading(false);
  };

  if (!simulationData) {
    return (
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <Target size={20} />
            Monte Carlo Simulation
          </h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <div className="loading-text">Running 1,000 simulations...</div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              Calculate returns to see simulation results
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  const { percentiles, chartData, totalContributed } = simulationData;

  return (
    <motion.div 
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="card-header">
        <h3 className="card-title">
          <Target size={20} />
          Monte Carlo Simulation ({years} Year Projection)
        </h3>
      </div>
      <div className="card-body">
        {/* Outcome Probabilities */}
        <div className="simulation-outcomes">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="outcome-card pessimistic">
              <div className="outcome-header">
                <TrendingDown size={16} />
                <span>Pessimistic (10%)</span>
              </div>
              <div className="outcome-value">
                ${percentiles.p10.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="outcome-change">
                {(((percentiles.p10 - totalContributed) / totalContributed) * 100).toFixed(1)}% return
              </div>
            </div>

            <div className="outcome-card conservative">
              <div className="outcome-header">
                <BarChart3 size={16} />
                <span>Conservative (25%)</span>
              </div>
              <div className="outcome-value">
                ${percentiles.p25.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="outcome-change">
                {(((percentiles.p25 - totalContributed) / totalContributed) * 100).toFixed(1)}% return
              </div>
            </div>

            <div className="outcome-card median">
              <div className="outcome-header">
                <Target size={16} />
                <span>Median (50%)</span>
              </div>
              <div className="outcome-value">
                ${percentiles.p50.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="outcome-change">
                {(((percentiles.p50 - totalContributed) / totalContributed) * 100).toFixed(1)}% return
              </div>
            </div>

            <div className="outcome-card optimistic">
              <div className="outcome-header">
                <TrendingUp size={16} />
                <span>Optimistic (90%)</span>
              </div>
              <div className="outcome-value">
                ${percentiles.p90.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="outcome-change">
                {(((percentiles.p90 - totalContributed) / totalContributed) * 100).toFixed(1)}% return
              </div>
            </div>
          </div>
        </div>

        {/* Probability Bands Chart */}
        <div className="simulation-chart">
          <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Probability Distribution Over Time
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="probabilityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#58a6ff" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis 
                dataKey="year" 
                stroke="#8b949e"
                fontSize={12}
                tickFormatter={(value) => `${value}Y`}
              />
              <YAxis 
                stroke="#8b949e"
                fontSize={12}
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#21262d',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  color: '#f0f6fc'
                }}
                formatter={(value, name) => [
                  `$${Number(value).toLocaleString()}`,
                  name === 'p50' ? 'Median' : name === 'p10' ? '10th Percentile' : name === 'p90' ? '90th Percentile' : name
                ]}
              />
              
              {/* 80% probability band (p10 to p90) */}
              <Area
                type="monotone"
                dataKey="p90"
                stroke="#58a6ff"
                strokeWidth={1}
                fill="url(#probabilityGradient)"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="p10"
                stroke="#58a6ff"
                strokeWidth={1}
                fill="#21262d"
                fillOpacity={1}
              />
              
              {/* Median line */}
              <Area
                type="monotone"
                dataKey="p50"
                stroke="#00d395"
                strokeWidth={3}
                fill="none"
                fillOpacity={0}
              />
              
              {/* Contributions reference line */}
              <Area
                type="monotone"
                dataKey="contributions"
                stroke="#ff6b6b"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
                fillOpacity={0}
              />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="chart-legend" style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '3px', backgroundColor: '#00d395' }}></div>
                <span>Median Outcome</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '8px', backgroundColor: '#58a6ff', opacity: 0.3 }}></div>
                <span>80% Probability Range</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '2px', backgroundColor: '#ff6b6b', borderStyle: 'dashed' }}></div>
                <span>Total Contributions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="simulation-disclaimer" style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255, 107, 107, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
            <span style={{ fontWeight: '600', color: 'var(--accent-red)' }}>Simulation Disclaimer</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            This Monte Carlo simulation is based on historical volatility and returns. Past performance does not guarantee future results. 
            Actual returns may vary significantly due to market conditions, economic factors, and other variables not captured in this model.
          </p>
        </div>
      </div>
    </motion.div>
  );
};