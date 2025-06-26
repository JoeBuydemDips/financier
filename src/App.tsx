import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertTriangle,
  TrendingDown,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import './App.css';
import { StockInfoPanel } from './components/StockInfoPanel';
import { FinancialTerm } from './components/EducationalTooltip';
import { ChartControls } from './components/ChartControls';
import { NavigationTabs } from './components/NavigationTabs';
import { OverviewPage } from './components/pages/OverviewPage';
import { InvestmentComparisonPage } from './components/pages/InvestmentComparisonPage';
import { StockDetailsPage } from './components/pages/StockDetailsPage';
import { RiskAnalysisPage } from './components/pages/RiskAnalysisPage';


function App() {
  const [ticker, setTicker] = useState('SPY');
  const [contribution, setContribution] = useState('100');
  const [cadence, setCadence] = useState('monthly');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2023-01-01');
  const [results, setResults] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState(null);

  const [loading, setLoading] = useState(false);
  const [stockInfoLoading, setStockInfoLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chart controls state
  const [chartType, setChartType] = useState('area');
  const [visibleSeries, setVisibleSeries] = useState({
    contributions: true,
    portfolioValue: true,
    benchmarkValue: true
  });

  // Navigation state
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch stock information when ticker changes
  useEffect(() => {
    const fetchStockInfo = async () => {
      if (!ticker) return;
      
      setStockInfoLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/stock/${ticker}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stock information');
        }
        const data = await response.json();
        setStockInfo(data);
      } catch (err) {
        console.error('Stock info error:', err);
        setStockInfo(null);
      } finally {
        setStockInfoLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchStockInfo();
    }, 500); // Debounce API calls

    return () => clearTimeout(debounceTimer);
  }, [ticker]);

  // Chart control handlers
  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  const handleSeriesToggle = (series) => {
    setVisibleSeries(prev => ({
      ...prev,
      [series]: !prev[series]
    }));
  };

  // Navigation handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Calculate risk metrics
  const calculateRiskMetrics = (dailyReturns, benchmarkReturns) => {
    if (!dailyReturns.length || !benchmarkReturns.length) return null;

    // Calculate volatility (standard deviation of returns)
    const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / dailyReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

    // Calculate maximum drawdown
    let peak = dailyReturns[0];
    let maxDrawdown = 0;
    for (let i = 1; i < dailyReturns.length; i++) {
      if (dailyReturns[i] > peak) {
        peak = dailyReturns[i];
      }
      const drawdown = (peak - dailyReturns[i]) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Calculate Sharpe ratio (assuming 2% risk-free rate)
    const riskFreeRate = 0.02;
    const excessReturn = mean * 252 - riskFreeRate;
    const sharpeRatio = excessReturn / volatility;

    // Calculate beta (correlation with benchmark)
    const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;
    const covariance = dailyReturns.reduce((sum, r, i) => 
      sum + (r - mean) * (benchmarkReturns[i] - benchmarkMean), 0) / dailyReturns.length;
    const benchmarkVariance = benchmarkReturns.reduce((sum, r) => 
      sum + Math.pow(r - benchmarkMean, 2), 0) / benchmarkReturns.length;
    const beta = covariance / benchmarkVariance;

    return {
      volatility,
      maxDrawdown,
      sharpeRatio,
      beta
    };
  };

  const calculateReturns = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setChartData(null);
    setBenchmarkData(null);
    setRiskMetrics(null);

    try {
      const response = await fetch(`http://localhost:3001/history/${ticker}?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch historical data.');
      }
      const data = await response.json();

      if (!data.stock || data.stock.length === 0) {
        throw new Error('No data found for the selected ticker and date range.');
      }

      const historicalData = data.stock;
      const benchmarkData = data.benchmark;

      const portfolio = {
        dates: [],
        values: [],
        contributions: [],
        benchmarkValues: []
      };

      let totalContributed = 0;
      let totalShares = 0;
      let benchmarkShares = 0;
      const contributionAmount = parseFloat(contribution);
      const investmentStartDate = new Date(startDate);
      const investmentEndDate = new Date(endDate);

      let nextContributionDate = new Date(investmentStartDate);

      // Track daily returns for risk calculation
      const dailyReturns = [];
      const benchmarkReturns = [];
      let prevValue = null;
      let prevBenchmarkValue = null;

      for (let day = new Date(investmentStartDate); day <= investmentEndDate; day.setDate(day.getDate() + 1)) {
        const currentDate = new Date(day);
        const dateString = currentDate.toISOString().split('T')[0];

        const marketDataForDay = historicalData.find(d => new Date(d.date).toISOString().split('T')[0] === dateString);
        const benchmarkDataForDay = benchmarkData?.find(d => new Date(d.date).toISOString().split('T')[0] === dateString);

        if (currentDate >= nextContributionDate && marketDataForDay && benchmarkDataForDay) {
          totalContributed += contributionAmount;
          totalShares += contributionAmount / marketDataForDay.close;
          benchmarkShares += contributionAmount / benchmarkDataForDay.close;

          switch (cadence) {
            case 'daily':
              nextContributionDate.setDate(nextContributionDate.getDate() + 1);
              break;
            case 'weekly':
              nextContributionDate.setDate(nextContributionDate.getDate() + 7);
              break;
            case 'monthly':
              nextContributionDate.setMonth(nextContributionDate.getMonth() + 1);
              break;
          }
        }

        if (marketDataForDay && benchmarkDataForDay) {
          const currentValue = totalShares * marketDataForDay.close;
          const currentBenchmarkValue = benchmarkShares * benchmarkDataForDay.close;

          portfolio.dates.push(dateString);
          portfolio.values.push(currentValue);
          portfolio.contributions.push(totalContributed);
          portfolio.benchmarkValues.push(currentBenchmarkValue);

          // Calculate daily returns for risk metrics
          if (prevValue !== null && prevBenchmarkValue !== null && prevValue > 0 && prevBenchmarkValue > 0) {
            const dailyReturn = (currentValue - prevValue) / prevValue;
            const benchmarkReturn = (currentBenchmarkValue - prevBenchmarkValue) / prevBenchmarkValue;
            dailyReturns.push(dailyReturn);
            benchmarkReturns.push(benchmarkReturn);
          }

          prevValue = currentValue;
          prevBenchmarkValue = currentBenchmarkValue;
        }
      }

      const finalValue = portfolio.values[portfolio.values.length - 1] || 0;
      const benchmarkFinalValue = portfolio.benchmarkValues[portfolio.benchmarkValues.length - 1] || 0;
      const profitLoss = finalValue - totalContributed;
      const totalRoi = totalContributed > 0 ? (profitLoss / totalContributed) * 100 : 0;
      const years = (investmentEndDate.getTime() - investmentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      const annualizedRoi = totalContributed > 0 ? ((Math.pow(finalValue / totalContributed, 1 / years)) - 1) * 100 : 0;

      // Benchmark comparison
      const benchmarkProfitLoss = benchmarkFinalValue - totalContributed;
      const benchmarkTotalRoi = totalContributed > 0 ? (benchmarkProfitLoss / totalContributed) * 100 : 0;
      const benchmarkAnnualizedRoi = totalContributed > 0 ? ((Math.pow(benchmarkFinalValue / totalContributed, 1 / years)) - 1) * 100 : 0;

      // Calculate risk metrics
      const riskMetrics = calculateRiskMetrics(dailyReturns, benchmarkReturns);

      setResults({
        totalContributed,
        finalValue,
        profitLoss,
        totalRoi,
        annualizedRoi,
      });

      setBenchmarkData({
        finalValue: benchmarkFinalValue,
        profitLoss: benchmarkProfitLoss,
        totalRoi: benchmarkTotalRoi,
        annualizedRoi: benchmarkAnnualizedRoi
      });

      setRiskMetrics(riskMetrics);

      setChartData({
        labels: portfolio.dates,
        datasets: [
          {
            label: 'Total Investment',
            data: portfolio.contributions,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
          },
          {
            label: 'Portfolio Value',
            data: portfolio.values,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'S&P 500 Benchmark',
            data: portfolio.benchmarkValues,
            borderColor: 'rgb(255, 205, 86)',
            backgroundColor: 'rgba(255, 205, 86, 0.5)',
          },
        ],
      });

    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred.');
        }
    } finally {
      setLoading(false);
    }
  };

  // Transform data for Recharts
  const chartDataFormatted = chartData ? 
    chartData.labels.map((date, index) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      contributions: chartData.datasets[0].data[index],
      portfolioValue: chartData.datasets[1].data[index],
      benchmarkValue: chartData.datasets[2]?.data[index] || 0,
    })) : [];

  return (
    <div className="app">
      {/* Modern Header with Navigation */}
      <motion.header 
        className="app-header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <a href="#" className="brand">
          <TrendingUp size={24} style={{ marginRight: '8px', display: 'inline' }} />
          Financier
        </a>
        
        {/* Header Navigation */}
        <div className="header-navigation">
          <NavigationTabs 
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </motion.header>

      <div className="app-container">
        <div className="app-grid">
          {/* Left Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Compact Stock Information - Only for Overview */}
            {activeTab === 'overview' && (
              <motion.div 
                className="glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="card-body" style={{ padding: '1rem' }}>
                  {stockInfo ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {stockInfo.shortName} ({stockInfo.symbol})
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-green)', marginBottom: '0.5rem' }}>
                        ${stockInfo.currentPrice?.toFixed(2) || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {stockInfo.sector && `${stockInfo.sector} • `}
                        Market Cap: {stockInfo.marketCap ? `$${(stockInfo.marketCap / 1e9).toFixed(1)}B` : 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Enter ticker to view stock info
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Input Panel */}
            <motion.div 
              className="glass-card"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
            <div className="card-header">
              <h2 className="card-title">
                <Target size={20} />
                Investment Calculator
              </h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">
                  <BarChart3 size={16} style={{ marginRight: '8px', display: 'inline' }} />
                  Ticker Symbol
                </label>
                <input
                  type="text"
                  className="form-input form-select"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="e.g., SPY, AAPL, TSLA"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={16} style={{ marginRight: '8px', display: 'inline' }} />
                  Contribution Amount
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Investment Frequency</label>
                <select
                  className="form-input form-select"
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} style={{ marginRight: '8px', display: 'inline' }} />
                  Start Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} style={{ marginRight: '8px', display: 'inline' }} />
                  End Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <motion.button
                className="btn-primary"
                onClick={calculateReturns}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px', display: 'inline' }} />
                    Calculating...
                  </>
                ) : (
                  <>
                    <TrendingUp size={20} style={{ marginRight: '8px', display: 'inline' }} />
                    Calculate Returns
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
          </div>

          {/* Main Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <AnimatePresence>
              {loading && (
                <motion.div 
                  className="glass-card loading-container"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="spinner"></div>
                  <div className="loading-text">Analyzing market data...</div>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  className="error-container"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="error-text">{error}</div>
                </motion.div>
              )}

              {/* Page Content - Always Show */}
              {(results || activeTab !== 'overview') ? (
                  <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                      <OverviewPage 
                        key="overview"
                        results={results}
                        benchmarkData={benchmarkData}
                        riskMetrics={riskMetrics}
                        stockInfo={stockInfo}
                        chartDataFormatted={chartDataFormatted}
                        chartType={chartType}
                        visibleSeries={visibleSeries}
                        onChartTypeChange={handleChartTypeChange}
                        onSeriesToggle={handleSeriesToggle}
                      />
                    )}

                    {activeTab === 'analytics' && (
                      <InvestmentComparisonPage 
                        key="analytics"
                        results={results}
                        contribution={contribution}
                        cadence={cadence}
                        startDate={startDate}
                        endDate={endDate}
                      />
                    )}

                    {activeTab === 'stock' && (
                      <StockDetailsPage 
                        key="stock"
                        stockInfo={stockInfo}
                        stockInfoLoading={stockInfoLoading}
                      />
                    )}

                    {activeTab === 'risk' && (
                      <RiskAnalysisPage 
                        key="risk"
                        riskMetrics={riskMetrics}
                        stockInfo={stockInfo}
                      />
                    )}
                  </AnimatePresence>
              ) : (
                /* Enhanced Empty State */
                <motion.div
                  className="glass-card empty-state"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="empty-state-content">
                    <div className="empty-state-icon">
                      <BarChart3 size={48} />
                    </div>
                    <h2 className="empty-state-title">Welcome to Financier</h2>
                    <p className="empty-state-description">
                      Your intelligent investment analysis platform. Get started by entering a ticker symbol and calculating your investment returns.
                    </p>
                    
                    <div className="quick-start-grid">
                      <div className="quick-start-item">
                        <Activity size={24} />
                        <h4>Analyze Performance</h4>
                        <p>Calculate DCA returns and benchmark performance</p>
                      </div>
                      <div className="quick-start-item">
                        <TrendingUp size={24} />
                        <h4>Compare Investments</h4>
                        <p>Multi-asset portfolio backtesting with real data</p>
                      </div>
                      <div className="quick-start-item">
                        <AlertTriangle size={24} />
                        <h4>Risk Analysis</h4>
                        <p>Understand volatility, drawdowns, and risk metrics</p>
                      </div>
                    </div>

                    <div className="popular-tickers">
                      <h4>Popular Tickers to Try:</h4>
                      <div className="ticker-buttons">
                        {['SPY', 'AAPL', 'TSLA', 'NVDA', 'BTC-USD', 'QQQ'].map((symbol) => (
                          <motion.button
                            key={symbol}
                            className="ticker-button"
                            onClick={() => setTicker(symbol)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {symbol}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;