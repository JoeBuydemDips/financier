import { motion } from 'framer-motion';
import { 
  Activity, 
  BarChart3, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react';
import { FinancialTerm } from '../EducationalTooltip';
import { ChartControls } from '../ChartControls';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface OverviewPageProps {
  results: any;
  benchmarkData: any;
  riskMetrics: any;
  stockInfo: any;
  chartDataFormatted: any[];
  chartType: 'area' | 'line';
  visibleSeries: any;
  onChartTypeChange: (type: 'area' | 'line') => void;
  onSeriesToggle: (series: string) => void;
}

export const OverviewPage = ({
  results,
  benchmarkData,
  riskMetrics,
  stockInfo,
  chartDataFormatted,
  chartType,
  visibleSeries,
  onChartTypeChange,
  onSeriesToggle
}: OverviewPageProps) => {
  return (
    <div className="overview-page">
      {/* Main Results */}
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <Activity size={20} />
            <FinancialTerm term="Dollar-Cost Averaging">Investment Results</FinancialTerm>
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="metric-label">Total Invested</div>
              <div className="metric-value">
                ${results.totalContributed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="metric-label">Portfolio Value</div>
              <div className="metric-value">
                ${results.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="metric-label">Profit/Loss</div>
              <div className={`metric-value ${results.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                {results.profitLoss >= 0 ? (
                  <ArrowUpRight size={24} style={{ marginRight: '4px', display: 'inline' }} />
                ) : (
                  <ArrowDownRight size={24} style={{ marginRight: '4px', display: 'inline' }} />
                )}
                ${Math.abs(results.profitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className={`metric-change ${results.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                <FinancialTerm term="Total Return">{results.totalRoi.toFixed(1)}% total return</FinancialTerm>
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="metric-label">
                <FinancialTerm term="Annualized Return">Annualized Return</FinancialTerm>
              </div>
              <div className={`metric-value ${results.annualizedRoi >= 0 ? 'positive' : 'negative'}`}>
                {results.annualizedRoi.toFixed(1)}%
              </div>
              <div className="metric-change">
                Average yearly growth
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Interactive Chart - Moved to 2nd position */}
      {chartDataFormatted.length > 0 && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={20} />
              Investment Performance Over Time
            </h3>
          </div>
          <div className="card-body">
            <div className="chart-container-wrapper">
              <ChartControls 
                chartType={chartType}
                onChartTypeChange={onChartTypeChange}
                visibleSeries={visibleSeries}
                onSeriesToggle={onSeriesToggle}
              />
              
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={450}>
                  {chartType === 'area' ? (
                    <AreaChart data={chartDataFormatted}>
                      <defs>
                        <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d395" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00d395" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="contributionsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#58a6ff" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a5a3ff" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#a5a3ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#8b949e"
                        fontSize={12}
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
                          color: '#f0f6fc',
                          fontSize: '14px',
                          padding: '12px'
                        }}
                        labelStyle={{ color: '#8b949e', fontSize: '12px', marginBottom: '8px' }}
                        formatter={(value, name, props) => {
                          const labels = {
                            'contributions': 'Total Invested',
                            'portfolioValue': 'Portfolio Value',
                            'benchmarkValue': 'S&P 500 Benchmark'
                          };
                          
                          const formattedValue = `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                          
                          if (name === 'portfolioValue' || name === 'benchmarkValue') {
                            const contributions = props.payload?.contributions || 0;
                            if (contributions > 0) {
                              const change = ((Number(value) - Number(contributions)) / Number(contributions)) * 100;
                              const changeColor = change >= 0 ? '#00d395' : '#ff6b6b';
                              const changeSign = change >= 0 ? '+' : '';
                              return [
                                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '180px' }}>
                                  <span>{formattedValue}</span>
                                  <span style={{ color: changeColor, fontSize: '12px', fontWeight: '600' }}>
                                    {changeSign}{change.toFixed(1)}%
                                  </span>
                                </div>,
                                labels[name as keyof typeof labels] || name
                              ];
                            }
                          }
                          
                          return [formattedValue, labels[name as keyof typeof labels] || name];
                        }}
                      />
                      {visibleSeries.contributions && (
                        <Area
                          type="monotone"
                          dataKey="contributions"
                          stroke="#58a6ff"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#contributionsGradient)"
                        />
                      )}
                      {visibleSeries.portfolioValue && (
                        <Area
                          type="monotone"
                          dataKey="portfolioValue"
                          stroke="#00d395"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#portfolioGradient)"
                        />
                      )}
                      {visibleSeries.benchmarkValue && (
                        <Area
                          type="monotone"
                          dataKey="benchmarkValue"
                          stroke="#a5a3ff"
                          strokeWidth={2}
                          fillOpacity={0.3}
                          fill="url(#benchmarkGradient)"
                        />
                      )}
                    </AreaChart>
                  ) : (
                    <LineChart data={chartDataFormatted}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#8b949e"
                        fontSize={12}
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
                          color: '#f0f6fc',
                          fontSize: '14px',
                          padding: '12px'
                        }}
                        labelStyle={{ color: '#8b949e', fontSize: '12px', marginBottom: '8px' }}
                        formatter={(value, name, props) => {
                          const labels = {
                            'contributions': 'Total Invested',
                            'portfolioValue': 'Portfolio Value',
                            'benchmarkValue': 'S&P 500 Benchmark'
                          };
                          
                          const formattedValue = `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                          
                          if (name === 'portfolioValue' || name === 'benchmarkValue') {
                            const contributions = props.payload?.contributions || 0;
                            if (contributions > 0) {
                              const change = ((Number(value) - Number(contributions)) / Number(contributions)) * 100;
                              const changeColor = change >= 0 ? '#00d395' : '#ff6b6b';
                              const changeSign = change >= 0 ? '+' : '';
                              return [
                                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '180px' }}>
                                  <span>{formattedValue}</span>
                                  <span style={{ color: changeColor, fontSize: '12px', fontWeight: '600' }}>
                                    {changeSign}{change.toFixed(1)}%
                                  </span>
                                </div>,
                                labels[name as keyof typeof labels] || name
                              ];
                            }
                          }
                                                  
                        return [formattedValue, labels[name as keyof typeof labels] || name];
                        }}
                      />
                      {visibleSeries.contributions && (
                        <Line
                          type="monotone"
                          dataKey="contributions"
                          stroke="#58a6ff"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {visibleSeries.portfolioValue && (
                        <Line
                          type="monotone"
                          dataKey="portfolioValue"
                          stroke="#00d395"
                          strokeWidth={3}
                          dot={false}
                        />
                      )}
                      {visibleSeries.benchmarkValue && (
                        <Line
                          type="monotone"
                          dataKey="benchmarkValue"
                          stroke="#a5a3ff"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-quaternary)', borderRadius: 'var(--radius-sm)' }}>
              <div className="performance-comparison">
                {Math.abs(results.annualizedRoi - benchmarkData.annualizedRoi) < 0.05 ? (
                  <div className="outperformance neutral">
                    <TrendingUp size={20} />
                    <span>Matched S&P 500 performance (within 0.1%)</span>
                  </div>
                ) : results.annualizedRoi > benchmarkData.annualizedRoi ? (
                  <div className="outperformance positive">
                    <TrendingUp size={20} />
                    <span>Outperformed S&P 500 by {(results.annualizedRoi - benchmarkData.annualizedRoi).toFixed(1)}% annually</span>
                  </div>
                ) : (
                  <div className="outperformance negative">
                    <TrendingUp size={20} />
                    <span>Underperformed S&P 500 by {(benchmarkData.annualizedRoi - results.annualizedRoi).toFixed(1)}% annually</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Benchmark Comparison - Moved to 3rd position */}
      {benchmarkData && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <BarChart3 size={20} />
              vs S&P 500 Benchmark
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div className="benchmark-section">
                  <div className="benchmark-label">{stockInfo?.symbol || 'Stock'} Performance</div>
                  <div className="benchmark-value positive">
                    ${results.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="benchmark-change">
                    {results.annualizedRoi.toFixed(1)}% annually
                  </div>
                </div>
              </div>
              <div>
                <div className="benchmark-section">
                  <div className="benchmark-label">S&P 500 Performance</div>
                  <div className="benchmark-value">
                    ${benchmarkData.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="benchmark-change">
                    {benchmarkData.annualizedRoi.toFixed(1)}% annually
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-quaternary)', borderRadius: 'var(--radius-sm)' }}>
              <div className="performance-comparison">
                {Math.abs(results.annualizedRoi - benchmarkData.annualizedRoi) < 0.05 ? (
                  <div className="outperformance neutral">
                    <TrendingUp size={20} />
                    <span>Matched S&P 500 performance (within 0.1%)</span>
                  </div>
                ) : results.annualizedRoi > benchmarkData.annualizedRoi ? (
                  <div className="outperformance positive">
                    <TrendingUp size={20} />
                    <span>Outperformed S&P 500 by {(results.annualizedRoi - benchmarkData.annualizedRoi).toFixed(1)}% annually</span>
                  </div>
                ) : (
                  <div className="outperformance negative">
                    <TrendingUp size={20} />
                    <span>Underperformed S&P 500 by {(benchmarkData.annualizedRoi - results.annualizedRoi).toFixed(1)}% annually</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Key Risk Metrics - Moved to 4th position */}
      {riskMetrics && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={20} />
              Key Risk Metrics
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <motion.div 
                className="metric-card"
                whileHover={{ scale: 1.02 }}
              >
                <div className="metric-label">
                  <FinancialTerm term="Volatility">Volatility</FinancialTerm>
                </div>
                <div className="metric-value">
                  {(riskMetrics.volatility * 100).toFixed(1)}%
                </div>
                <div className="metric-change">
                  Annual price variation
                </div>
              </motion.div>

              <motion.div 
                className="metric-card"
                whileHover={{ scale: 1.02 }}
              >
                <div className="metric-label">
                  <FinancialTerm term="Sharpe Ratio">Sharpe Ratio</FinancialTerm>
                </div>
                <div className={`metric-value ${riskMetrics.sharpeRatio > 1 ? 'positive' : riskMetrics.sharpeRatio > 0 ? '' : 'negative'}`}>
                  {riskMetrics.sharpeRatio.toFixed(2)}
                </div>
                <div className="metric-change">
                  Risk-adjusted return
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};