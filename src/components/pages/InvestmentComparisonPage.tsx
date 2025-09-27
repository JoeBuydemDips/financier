import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3,
  DollarSign,
  Target,
  Calculator,
  PieChart,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useToast } from '../../components/toast/ToastContext';
import AssetSelectionCard from '../../components/comparison/AssetSelectionCard';
import type { Asset, DCAResult } from '../../components/comparison/types';

interface InvestmentComparisonPageProps {
  initialAssets?: Asset[];
}

export const InvestmentComparisonPage = ({ initialAssets }: InvestmentComparisonPageProps) => {
  const isMobile = useIsMobile();
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>(initialAssets || []);
  const [searchQuery, setSearchQuery] = useState('');
  // Search logic now encapsulated inside AssetSelectionCard
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [initialAmount, setInitialAmount] = useState('1000');
  const [contributionAmount, setContributionAmount] = useState('500');
  const [contributionFrequency, setContributionFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState('2021-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [results, setResults] = useState<{
    assets: DCAResult[];
    benchmark: DCAResult;
    portfolio: any;
    timeline?: any[];
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState<'bar' | 'area' | 'portfolio'>('bar');
  const { push } = useToast();
  // Auto-balance state: when enabled, allocations are kept equal & manual edits disabled
  const [autoBalanceEnabled, setAutoBalanceEnabled] = useState(false);
  
  // (removed: search logic moved to AssetSelectionCard)

  // Add asset to comparison
  const addAsset = (asset: any) => {
    if (selectedAssets.length >= 6) {
      push({
        variant: 'warning',
        title: 'Limit Reached',
        description: 'Maximum of 6 assets per comparison.'
      });
      return;
    }

    const newAsset: Asset = {
      symbol: asset.symbol,
      name: asset.shortName || asset.symbol,
      allocation: autoBalanceEnabled ? 1 / (selectedAssets.length + 1) : (1 / (selectedAssets.length + 1)), // default equal; manual tweak after if disabled
      quoteType: asset.quoteType,
      exchange: asset.exchange
    };

    if (autoBalanceEnabled) {
      // Force equal weights including new asset
      const updated = [...selectedAssets, newAsset].map(a => ({
        ...a,
        allocation: 1 / (selectedAssets.length + 1)
      }));
      setSelectedAssets(updated);
    } else {
      // Maintain existing allocations and append new with small default weight, then user can adjust
      // We won't auto-rebalance existing allocations to avoid surprising the user when manual mode
      setSelectedAssets(prev => [...prev, newAsset]);
    }
  setSearchQuery('');
    
    // Clear input states since allocations have changed
    setAllocationInputs({});
  };

  // Remove asset
  const removeAsset = (symbol: string) => {
    const assetToRemove = selectedAssets.find(a => a.symbol === symbol) || null;
    const filtered = selectedAssets.filter(asset => asset.symbol !== symbol);
    if (autoBalanceEnabled) {
      const rebalanced = filtered.map(a => ({ ...a, allocation: 1 / (filtered.length || 1) }));
      setSelectedAssets(rebalanced);
    } else {
      setSelectedAssets(filtered);
    }
    if (assetToRemove) {
      push({
        variant: 'info',
        title: `${assetToRemove.symbol} removed`,
        description: 'You can undo this change.',
        actionLabel: 'Undo',
        onAction: () => {
          setSelectedAssets(prev => {
            const restored = [...prev, assetToRemove];
            if (autoBalanceEnabled) {
              return restored.map(a => ({ ...a, allocation: 1 / restored.length }));
            }
            return restored;
          });
        },
        preserveOnAction: false,
        duration: 6000
      });
    }
    if (filtered.length === 0) {
      push({
        variant: 'info',
        title: 'Assets Cleared',
        description: 'Add assets to begin a new comparison.'
      });
    }
  };

  // Get display value for input (either from input state or formatted allocation)
  const getInputValue = useCallback((symbol: string) => {
    if (allocationInputs[symbol] !== undefined) {
      return allocationInputs[symbol];
    }
    const asset = selectedAssets.find(a => a.symbol === symbol);
    return asset ? (asset.allocation * 100).toFixed(2) : '0.00';
  }, [allocationInputs, selectedAssets]);

  // Update asset allocation with validation
  const updateAllocation = useCallback((symbol: string, allocation: number) => {
    if (autoBalanceEnabled) return; // Ignore manual edits in auto mode
    // Clamp allocation between 0 and 100 and round to 2 decimal places
    const clampedAllocation = Math.min(Math.max(0, parseFloat(allocation.toFixed(2))), 100);
    
    const updated = selectedAssets.map(asset => 
      asset.symbol === symbol ? { ...asset, allocation: clampedAllocation / 100 } : asset
    );
    setSelectedAssets(updated);
    
    // Clear the input state for this symbol since we've updated the actual value
    setAllocationInputs(prev => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
  }, [selectedAssets, autoBalanceEnabled]);

  // Handle direct input changes - store in temporary input state
  const handleAllocationChange = useCallback((symbol: string, value: string) => {
    if (autoBalanceEnabled) return; // disable input edits
    // Allow empty string for editing
    if (value === '') {
      setAllocationInputs(prev => ({
        ...prev,
        [symbol]: value
      }));
      return;
    }
    
    // Validate input format - allow digits and one decimal point with up to 2 decimal places
    const decimalRegex = /^\d*\.?\d{0,2}$/;
    
    if (decimalRegex.test(value)) {
      setAllocationInputs(prev => ({
        ...prev,
        [symbol]: value
      }));
    }
    // If invalid format, don't update the input state (effectively preventing the input)
  }, [autoBalanceEnabled]);

  // Handle when input loses focus - validate and update actual allocation
  const handleAllocationBlur = useCallback((symbol: string, value: string) => {
    if (autoBalanceEnabled) return;
    // Parse and validate the final value
    const numValue = parseFloat(value);
    if (isNaN(numValue) || value.trim() === '') {
      // If invalid, reset to current allocation
      const asset = selectedAssets.find(a => a.symbol === symbol);
      const currentAllocation = asset ? asset.allocation * 100 : 0;
      updateAllocation(symbol, parseFloat(currentAllocation.toFixed(2)));
    } else {
      // Update with validated value, capped to 2 decimal places
      const cappedValue = parseFloat(numValue.toFixed(2));
      updateAllocation(symbol, cappedValue);
    }
  }, [selectedAssets, updateAllocation, autoBalanceEnabled]);

  // Adjust allocation with increment/decrement buttons
  const adjustAllocation = useCallback((symbol: string, delta: number) => {
    if (autoBalanceEnabled) return;
    const currentAsset = selectedAssets.find(asset => asset.symbol === symbol);
    if (currentAsset) {
      const currentPercentage = currentAsset.allocation * 100;
      const newPercentage = currentPercentage + delta;
      updateAllocation(symbol, newPercentage);
    }
  }, [selectedAssets, updateAllocation, autoBalanceEnabled]);

  // Auto-rebalance remaining allocations
  const rebalanceAllocations = useCallback(() => {
    if (selectedAssets.length <= 1) return;
    
    const equalAllocation = 1 / selectedAssets.length;
    const rebalanced = selectedAssets.map(asset => ({
      ...asset,
      allocation: equalAllocation
    }));
    setSelectedAssets(rebalanced);
    
    // Clear all input states since we've reset allocations
    setAllocationInputs({});
  }, [selectedAssets]);

  // Enforce equal weighting whenever auto-balance is enabled or asset count changes
  useEffect(() => {
    if (autoBalanceEnabled && selectedAssets.length > 0) {
      setSelectedAssets(prev => prev.map(a => ({ ...a, allocation: 1 / prev.length })));
      setAllocationInputs({});
    }
  }, [autoBalanceEnabled, selectedAssets.length]);

  const toggleAutoBalance = () => {
    setAutoBalanceEnabled(prev => {
      const next = !prev;
      if (!prev && selectedAssets.length > 0) {
        // turning ON
        push({
          id: 'auto-balance-status',
            variant: 'info',
            title: 'Auto-Balance Enabled',
            description: 'Equal weighting locked. Uncheck to edit manually.'
        });
      }
      return next;
    });
  };

  // Calculate DCA performance
  const calculateDCA = async () => {
    if (selectedAssets.length === 0) {
      push({
        variant: 'warning',
        title: 'No Assets Selected',
        description: 'Add at least one asset to calculate performance.'
      });
      return;
    }
    if (!isValidAllocation()) {
      push({
        variant: 'error',
        title: 'Allocation Invalid',
        description: `Total allocation must equal 100%. Currently ${formatTotalAllocation(getTotalAllocation())}%.`
      });
      return;
    }

    setIsCalculating(true);
    try {
              const response = await fetch('/.netlify/functions/calculate-dca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets: selectedAssets,
          startDate,
          endDate,
          initialAmount: parseFloat(initialAmount) || 0,
          contributionAmount: parseFloat(contributionAmount) || 0,
          contributionFrequency
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        generateChartData(data);
      } else {
        throw new Error('Failed to calculate DCA performance');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Failed to calculate performance. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Generate chart data for visualization
  const generateChartData = (data: any) => {
    // Create chart data for individual assets only (All Assets view)
    const chartData = data.assets.map((asset: DCAResult) => ({
      name: asset.symbol,
      value: asset.finalValue,
      invested: asset.totalInvested,
      return: asset.profitLoss
    }));

    setChartData(chartData);
    
    // Calculate portfolio totals for timeline chart
    const portfolioTotal = data.assets.reduce((sum: number, asset: DCAResult) => sum + asset.finalValue, 0);
    const portfolioInvested = data.assets.reduce((sum: number, asset: DCAResult) => sum + asset.totalInvested, 0);

    // Generate mock timeline data for the line chart
    // In a real implementation, this would come from the backend
    const mockTimeline: Record<string, any>[] = [];
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const totalDays = Math.floor((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= 12; i++) {
      const currentDate = new Date(startDateObj.getTime() + (totalDays / 12) * i * 24 * 60 * 60 * 1000);
      const timelinePoint: Record<string, any> = {
        date: currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        benchmark: data.benchmark.totalInvested * (1 + (data.benchmark.totalReturn / 100) * (i / 12)),
        portfolio: portfolioInvested * (1 + (((portfolioTotal - portfolioInvested) / portfolioInvested) * 100 / 100) * (i / 12))
      };
      
      data.assets.forEach((asset: DCAResult) => {
        timelinePoint[asset.symbol] = asset.totalInvested * (1 + (asset.totalReturn / 100) * (i / 12));
      });
      
      mockTimeline.push(timelinePoint);
    }
    
    // Update results with timeline data
    setResults(prev => prev ? { ...prev, timeline: mockTimeline } : null);
  };

  // Get portfolio total allocation
  const getTotalAllocation = () => {
    return selectedAssets.reduce((sum, asset) => sum + asset.allocation, 0) * 100;
  };

  // Format total allocation for display (no decimals for whole numbers, 1 decimal otherwise)
  const formatTotalAllocation = (value: number) => {
    return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  };

  // Validation helper for allocation
  const isValidAllocation = () => {
    const total = getTotalAllocation();
    return Math.abs(total - 100) <= 0.01; // Allow small rounding errors (2 decimal places)
  };

  // Get allocation status for UI feedback
  const getAllocationStatus = () => {
    const total = getTotalAllocation();
    if (Math.abs(total - 100) <= 0.01) return 'valid';
    if (total > 100) return 'over';
    return 'under';
  };

  return (
    <motion.div 
      className="investment-comparison-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Asset Selection */}
      <AssetSelectionCard
        isMobile={isMobile}
        selectedAssets={selectedAssets}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        addAsset={addAsset}
        removeAsset={removeAsset}
        autoBalanceEnabled={autoBalanceEnabled}
        toggleAutoBalance={toggleAutoBalance}
        rebalanceAllocations={rebalanceAllocations}
        getTotalAllocation={getTotalAllocation}
        formatTotalAllocation={formatTotalAllocation}
        getInputValue={getInputValue}
        handleAllocationChange={handleAllocationChange}
        handleAllocationBlur={handleAllocationBlur}
        adjustAllocation={adjustAllocation}
      />

      {/* DCA Parameters */}
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <DollarSign size={20} />
            Investment Strategy
          </h3>
        </div>
        <div className="card-body">
          <div className="investment-strategy-grid" style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '1.5rem' : '1rem'
          }}>
            <div className="form-group">
              <label className="form-label">Initial Investment</label>
              <input
                type="number"
                inputMode="decimal"
                className="form-input"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="1000"
                min="0"
                step={isMobile ? "100" : "1"}
                style={{
                  fontSize: isMobile ? '16px' : '1rem', // Prevent zoom on iOS
                  minHeight: isMobile ? '44px' : '3.125rem'
                }}
                aria-label="Initial investment amount in dollars"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Regular Contribution</label>
              <input
                type="number"
                inputMode="decimal"
                className="form-input"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="500"
                min="0"
                step={isMobile ? "50" : "1"}
                style={{
                  fontSize: isMobile ? '16px' : '1rem',
                  minHeight: isMobile ? '44px' : '3.125rem'
                }}
                aria-label="Regular contribution amount in dollars"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select
                className="form-select"
                value={contributionFrequency}
                onChange={(e) => setContributionFrequency(e.target.value)}
                style={{
                  fontSize: isMobile ? '16px' : '1rem',
                  minHeight: isMobile ? '44px' : '3.125rem'
                }}
                aria-label="Contribution frequency"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    fontSize: isMobile ? '16px' : '1rem',
                    minHeight: isMobile ? '44px' : '3.125rem',
                    flex: 1
                  }}
                  aria-label="Investment start date"
                />
                <button
                  type="button"
                  onClick={() => setStartDate(new Date().toISOString().split('T')[0])}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#00b383';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent-green)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  style={{
                    padding: isMobile ? '0.75rem' : '0.5rem 0.75rem',
                    background: 'var(--accent-green)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'white',
                    fontSize: isMobile ? '0.875rem' : '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    minHeight: isMobile ? '44px' : '3.125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Set start date to today"
                >
                  📅 Today
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    fontSize: isMobile ? '16px' : '1rem',
                    minHeight: isMobile ? '44px' : '3.125rem',
                    flex: 1
                  }}
                  aria-label="Investment end date"
                />
                <button
                  type="button"
                  onClick={() => setEndDate(new Date().toISOString().split('T')[0])}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-purple)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent-blue)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  style={{
                    padding: isMobile ? '0.75rem' : '0.5rem 0.75rem',
                    background: 'var(--accent-blue)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'white',
                    fontSize: isMobile ? '0.875rem' : '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    minHeight: isMobile ? '44px' : '3.125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Set end date to today"
                >
                  📅 Today
                </button>
              </div>
            </div>
          </div>

          {/* Centered Button Section */}
          <div style={{ 
            marginTop: '2rem', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}>
            <motion.button
              className="btn-primary"
              onClick={calculateDCA}
              disabled={isCalculating || selectedAssets.length === 0 || !isValidAllocation()}
              whileHover={{ scale: selectedAssets.length > 0 && isValidAllocation() ? 1.02 : 1 }}
              whileTap={{ scale: selectedAssets.length > 0 && isValidAllocation() ? 0.98 : 1 }}
              style={{ 
                width: isMobile ? '100%' : '80%',
                maxWidth: isMobile ? 'none' : '340px',
                opacity: selectedAssets.length === 0 || !isValidAllocation() ? 0.6 : 1,
                minHeight: isMobile ? '52px' : '3.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.25rem',
                lineHeight: 1.1,
                whiteSpace: 'nowrap'
              }}
              title={
                selectedAssets.length === 0 ? 'Please select at least one asset' :
                !isValidAllocation() ? `Total allocation is ${formatTotalAllocation(getTotalAllocation())}% - should be 100%` :
                'Calculate investment performance'
              }
            >
              {isCalculating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: isMobile ? '0.95rem' : '1rem' }}>
                  <div className="spinner" style={{ width: '18px', height: '18px' }} />
                  Calculating...
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem', 
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: 600
                }}>
                  <Calculator size={18} />
                  {isMobile ? 'Run Simulation' : 'Calculate Performance'}
                </div>
              )}
            </motion.button>

            {/* Inline hint when invalid allocation, kept very compact */}
            {selectedAssets.length > 0 && !isValidAllocation() && (
              <div style={{
                width: isMobile ? '100%' : '80%',
                maxWidth: isMobile ? 'none' : '340px',
                marginTop: '0.5rem',
                fontSize: '0.65rem',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                textAlign: 'center'
              }}>
                Adjust allocations to enable
              </div>
            )}
            
            {/* Validation feedback (stacked below button) */}
            {selectedAssets.length > 0 && !isValidAllocation() && (
              <div
                role="alert"
                aria-live="polite"
                style={{
                  width: isMobile ? '100%' : '80%',
                  maxWidth: isMobile ? 'none' : '340px',
                  marginTop: '0.6rem',
                  padding: '0.85rem 0.9rem',
                  background: getAllocationStatus() === 'over' ? 'rgba(255, 107, 107, 0.12)' : 'rgba(255, 159, 67, 0.12)',
                  border: `1px solid ${getAllocationStatus() === 'over' ? 'rgba(255, 107, 107, 0.35)' : 'rgba(255, 159, 67, 0.35)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  lineHeight: 1.3,
                  color: getAllocationStatus() === 'over' ? 'var(--accent-red)' : '#ff9f43',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}
              >
                <span aria-hidden="true">⚠️</span>
                <strong>Total allocation is {formatTotalAllocation(getTotalAllocation())}%</strong>
                <span>
                  {getAllocationStatus() === 'over' ? 'Reduce some allocations.' : 'Increase allocations to reach 100%.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Results */}
      {results && (
        <>
          {/* Enhanced Performance Visualization */}
          <motion.div 
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card-header">
              <h3 className="card-title">
                <BarChart3 size={20} />
                Portfolio Performance Analysis
              </h3>
              
              {/* Chart Type Selector */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartType('bar')}
                >
                  📊 All Assets
                </button>
                <button
                  className={`chart-type-btn ${chartType === 'portfolio' ? 'active' : ''}`}
                  onClick={() => setChartType('portfolio')}
                >
                  🎯 Portfolio vs S&P 500
                </button>
                <button
                  className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`}
                  onClick={() => setChartType('area')}
                >
                  📈 Performance Timeline
                </button>
              </div>
            </div>
            <div className="card-body">
              {chartType === 'portfolio' ? (
                <>
                  {/* Custom segmented portfolio vs benchmark chart */}
                  <ResponsiveContainer width="100%" height={520}>
                    <BarChart
                      data={[
                        {
                          name: 'Portfolio',
                          label: '🎯 Portfolio Total',
                          type: 'portfolio',
                          value: results.assets.reduce((s: number, a: DCAResult) => s + a.finalValue, 0),
                          segments: results.assets.map((a: DCAResult, i: number) => ({
                            symbol: a.symbol,
                            value: a.finalValue,
                            color: ['#00d395', '#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b'][i % 6]
                          }))
                        },
                        {
                          name: 'S&P 500',
                          label: '📍 S&P 500 Benchmark',
                          type: 'benchmark',
                          value: results.benchmark.finalValue,
                          segments: [{ symbol: 'S&P 500', value: results.benchmark.finalValue, color: '#8b949e' }]
                        }
                      ]}
                      margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
                      barCategoryGap="35%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#8b949e" fontSize={12} tick={{ fill: '#8b949e' }} axisLine={{ stroke: '#30363d' }} tickLine={{ stroke: '#30363d' }} interval={0} />
                      <YAxis stroke="#8b949e" fontSize={isMobile ? 10 : 12} tick={{ fill: '#8b949e' }} axisLine={{ stroke: '#30363d' }} tickLine={{ stroke: '#30363d' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} width={isMobile ? 40 : 50} />
                      <Tooltip
                        content={(tooltipProps: any) => {
                          const { active, payload } = tooltipProps;
                          if (!active || !payload || !payload.length) return null;
                          const dataPoint = payload[0].payload;
                          const segs = dataPoint.segments || [];
                          const totalVal = dataPoint.value || segs.reduce((s: number, sg: any) => s + (sg.value || 0), 0);
                          return (
                            <div style={{
                              background: 'rgba(22,27,34,0.95)',
                              border: '1px solid #30363d',
                              borderRadius: 12,
                              padding: '0.75rem 0.9rem',
                              minWidth: '200px',
                              fontSize: isMobile ? 12 : 13,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                            }}>
                              <div style={{ fontWeight: 600, color: '#58a6ff', marginBottom: '0.35rem' }}>{dataPoint.label}</div>
                              <div style={{ fontWeight: 600, color: '#f0f6fc', marginBottom: '0.5rem' }}>
                                Total: ${totalVal.toLocaleString()}
                              </div>
                              {dataPoint.type === 'portfolio' && segs.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  {segs
                                    .slice() // copy
                                    .sort((a: any, b: any) => b.value - a.value)
                                    .map((s: any) => {
                                      const pct = totalVal ? (s.value / totalVal) * 100 : 0;
                                      return (
                                        <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, display: 'inline-block' }} />
                                            <span style={{ color: '#f0f6fc' }}>{s.symbol}</span>
                                          </div>
                                          <div style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 600 }}>
                                            {pct.toFixed(1)}%
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                              {dataPoint.type === 'benchmark' && (
                                <div style={{ color: '#8b949e', fontSize: '0.75rem' }}>Benchmark final value</div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[4,4,0,0]}
                        shape={(barProps: any) => {
                          const { x, y, width, height, payload } = barProps;
                          const segments = Array.isArray(payload?.segments) ? payload.segments : [];
                          if (!segments.length) {
                            // Fallback single bar
                            return <rect x={x} y={y} width={width} height={height} fill={payload.type === 'benchmark' ? '#8b949e' : '#00d395'} rx={4} ry={4} />;
                          }
                          const total = segments.reduce((s: number, seg: any) => s + (seg.value || 0), 0) || 1;
                          let offsetY = y + height; // start bottom
                          const ordered = segments.slice().sort((a: any, b: any) => b.value - a.value); // largest at bottom
                          const rects = ordered.map((seg: any, idx: number) => {
                            const ratio = (seg.value || 0) / total;
                            const segH = height * ratio;
                            offsetY -= segH;
                            const isTop = idx === ordered.length - 1;
                            return (
                              <rect
                                key={seg.symbol}
                                x={x}
                                y={offsetY}
                                width={width}
                                height={segH}
                                fill={seg.color}
                                rx={isTop ? 4 : 0}
                                ry={isTop ? 4 : 0}
                              >
                                <title>{`${seg.symbol}: $${seg.value.toLocaleString()}`}</title>
                              </rect>
                            );
                          });
                          return <g>{rects}</g>;
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem 1.5rem',
                    justifyContent: 'center',
                    marginTop: '1.25rem',
                    fontSize: '0.8rem',
                    lineHeight: 1.2,
                    maxWidth: '900px',
                    marginInline: 'auto'
                  }}>
                    {results.assets.map((a, i) => (
                      <div key={a.symbol} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: 14, height: 10, background: ['#00d395', '#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b'][i % 6], borderRadius: 2, display: 'inline-block' }} />
                        <span style={{ color: 'var(--text-primary)' }}>{a.symbol}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: 14, height: 10, background: '#8b949e', borderRadius: 2, display: 'inline-block' }} />
                      <span style={{ color: 'var(--text-primary)' }}>S&P 500</span>
                    </div>
                  </div>
                </>
              ) : chartType === 'bar' ? (
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#8b949e"
                      fontSize={12}
                      tick={{ fill: '#8b949e' }}
                      axisLine={{ stroke: '#30363d' }}
                    />
                    <YAxis 
                      stroke="#8b949e"
                      fontSize={12}
                      tick={{ fill: '#8b949e' }}
                      axisLine={{ stroke: '#30363d' }}
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(22, 27, 34, 0.95)',
                        border: '1px solid #30363d',
                        borderRadius: '12px',
                        color: '#f0f6fc',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(12px)'
                      }}
                      formatter={(value, name) => [
                        `$${Number(value).toLocaleString()}`,
                        name === 'value' ? '💰 Final Value' : 
                        name === 'invested' ? '💸 Total Invested' : 
                        name === 'return' ? '📈 Total Return' : name
                      ]}
                      labelStyle={{ color: '#58a6ff', fontWeight: '600' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                    />
                    <Bar 
                      dataKey="invested" 
                      fill="#58a6ff" 
                      name="💸 Total Invested"
                      radius={[4, 4, 0, 0]}
                      opacity={0.8}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#00d395" 
                      name="💰 Final Value"
                      radius={[4, 4, 0, 0]}
                      opacity={0.9}
                    />
                    <Bar 
                      dataKey="return" 
                      fill="#ff9f43" 
                      name="📈 Profit/Loss"
                      radius={[4, 4, 0, 0]}
                      opacity={0.7}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={results.timeline || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#8b949e"
                      fontSize={12}
                      tick={{ fill: '#8b949e' }}
                      axisLine={{ stroke: '#30363d' }}
                    />
                    <YAxis 
                      stroke="#8b949e"
                      fontSize={12}
                      tick={{ fill: '#8b949e' }}
                      axisLine={{ stroke: '#30363d' }}
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(22, 27, 34, 0.95)',
                        border: '1px solid #30363d',
                        borderRadius: '12px',
                        color: '#f0f6fc',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(12px)'
                      }}
                      formatter={(value, name) => [
                        `$${Number(value).toLocaleString()}`,
                        name
                      ]}
                      labelStyle={{ color: '#58a6ff', fontWeight: '600' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey="portfolio"
                      stroke="#00d395"
                      strokeWidth={4}
                      dot={{ fill: '#00d395', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: '#00d395', strokeWidth: 3 }}
                      name="🎯 Portfolio Total"
                    />
                    {results.assets.map((asset, index) => (
                      <Line
                        key={asset.symbol}
                        type="monotone"
                        dataKey={asset.symbol}
                        stroke={['#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b', '#00b383'][index % 6]}
                        strokeWidth={2}
                        dot={{ fill: ['#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b', '#00b383'][index % 6], strokeWidth: 1, r: 3 }}
                        activeDot={{ r: 5, stroke: ['#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b', '#00b383'][index % 6], strokeWidth: 2 }}
                        name={`📊 ${asset.symbol}`}
                        opacity={0.7}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      stroke="#8b949e"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={false}
                      name="📍 S&P 500"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Results Table */}
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
                    {results.assets.map((asset) => (
                      <tr key={asset.symbol} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              {asset.symbol}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                              {asset.name}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                          {(asset.allocation * 100).toFixed(1)}%
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                          ${asset.totalInvested.toLocaleString()}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                          ${asset.finalValue.toLocaleString()}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          textAlign: 'right', 
                          color: asset.profitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                          fontWeight: '600'
                        }}>
                          {asset.profitLoss >= 0 ? '+' : ''}${asset.profitLoss.toLocaleString()}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          textAlign: 'right',
                          color: asset.annualizedReturn >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                          fontWeight: '600'
                        }}>
                          {asset.annualizedReturn.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    
                    {/* Portfolio Total Row */}
                    <tr style={{ 
                      borderBottom: '2px solid var(--accent-green)',
                      backgroundColor: 'rgba(0, 211, 149, 0.1)',
                      fontWeight: '600'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--accent-green)', fontSize: '1.1rem' }}>
                            🎯 Portfolio Total
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Combined Performance
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-green)' }}>
                        100%
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-green)' }}>
                        ${results.assets.reduce((sum: number, asset: DCAResult) => sum + asset.totalInvested, 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-green)' }}>
                        ${results.assets.reduce((sum: number, asset: DCAResult) => sum + asset.finalValue, 0).toLocaleString()}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right', 
                        color: 'var(--accent-green)',
                        fontWeight: '700'
                      }}>
                        +${(results.assets.reduce((sum: number, asset: DCAResult) => sum + asset.finalValue, 0) - results.assets.reduce((sum: number, asset: DCAResult) => sum + asset.totalInvested, 0)).toLocaleString()}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right',
                        color: 'var(--accent-green)',
                        fontWeight: '700'
                      }}>
                        {((results.assets.reduce((sum: number, asset: DCAResult) => sum + asset.finalValue, 0) - results.assets.reduce((sum: number, asset: DCAResult) => sum + asset.totalInvested, 0)) / results.assets.reduce((sum: number, asset: DCAResult) => sum + asset.totalInvested, 0) * 100 / (new Date(endDate).getFullYear() - new Date(startDate).getFullYear() || 1)).toFixed(1)}%
                      </td>
                    </tr>
                    
                    {/* Benchmark Row */}
                    <tr style={{ 
                      borderBottom: '1px solid var(--border-primary)',
                      backgroundColor: 'var(--bg-quaternary)'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            SPY (Benchmark)
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            S&P 500 ETF
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                        100%
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                        ${results.benchmark.totalInvested.toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                        ${results.benchmark.finalValue.toLocaleString()}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right', 
                        color: results.benchmark.profitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                        fontWeight: '600'
                      }}>
                        {results.benchmark.profitLoss >= 0 ? '+' : ''}${results.benchmark.profitLoss.toLocaleString()}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right',
                        color: results.benchmark.annualizedReturn >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                        fontWeight: '600'
                      }}>
                        {results.benchmark.annualizedReturn.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Portfolio Summary */}
          <motion.div 
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="card-header">
              <h3 className="card-title">
                <PieChart size={20} />
                Portfolio Summary
              </h3>
            </div>
            <div className="card-body">
              <div className="investment-strategy-grid">
                <motion.div 
                  className="metric-card"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="metric-label">Total Invested</div>
                  <div className="metric-value">
                    ${results.portfolio.totalInvested.toLocaleString()}
                  </div>
                </motion.div>

                <motion.div 
                  className="metric-card"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="metric-label">Portfolio Value</div>
                  <div className="metric-value">
                    ${results.portfolio.finalValue.toLocaleString()}
                  </div>
                </motion.div>

                <motion.div 
                  className="metric-card"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="metric-label">Total Profit/Loss</div>
                  <div className={`metric-value ${results.portfolio.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                    {results.portfolio.profitLoss >= 0 ? '+' : ''}${results.portfolio.profitLoss.toLocaleString()}
                  </div>
                </motion.div>

                <motion.div 
                  className="metric-card"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="metric-label">Total Return</div>
                  <div className={`metric-value ${results.portfolio.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                    {results.portfolio.totalReturn.toFixed(1)}%
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Getting Started */}
      {!results && selectedAssets.length === 0 && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <Target size={48} style={{ color: 'var(--accent-blue)', marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Compare Investment Strategies
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Select multiple assets (stocks, crypto, ETFs) and see how your dollar-cost averaging strategy 
              would have performed historically. Compare different allocations and time periods to optimize your investment approach.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};