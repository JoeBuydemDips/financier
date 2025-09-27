import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useToast } from '../../components/toast/ToastContext';
import AssetSelectionCard from '../../components/comparison/AssetSelectionCard';
import InvestmentStrategyCard from '../../components/comparison/InvestmentStrategyCard';
// Lazy loaded heavy visualization / results components
const PerformanceChartsCard = lazy(() => import('../../components/comparison/PerformanceChartsCard'));
const ResultsTableCard = lazy(() => import('../../components/comparison/ResultsTableCard'));
const PortfolioSummaryCard = lazy(() => import('../../components/comparison/PortfolioSummaryCard'));
import type { Asset, DCAResult, DCAResponse } from '../../components/comparison/types';
import { updateAssetAllocation, rebalanceEqual, adjustAllocation as utilAdjust, totalAllocation, isValidTotal, formatPercent, allocationStatus as deriveStatus } from '../../utils/allocation';

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
  const [results, setResults] = useState<DCAResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
  const [chartDataRaw, setChartDataRaw] = useState<any[]>([]);
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
    if (autoBalanceEnabled) return;
    setSelectedAssets(prev => updateAssetAllocation(prev, symbol, allocation));
    setAllocationInputs(prev => { const next = { ...prev }; delete next[symbol]; return next; });
  }, [autoBalanceEnabled]);

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
    setSelectedAssets(prev => utilAdjust(prev, symbol, delta));
  }, [autoBalanceEnabled]);

  // Auto-rebalance remaining allocations
  const rebalanceAllocations = useCallback(() => {
    setSelectedAssets(prev => prev.length <= 1 ? prev : rebalanceEqual(prev));
    setAllocationInputs({});
  }, []);

  // Enforce equal weighting whenever auto-balance is enabled or asset count changes
  useEffect(() => {
    if (autoBalanceEnabled && selectedAssets.length > 0) {
      setSelectedAssets(prev => rebalanceEqual(prev));
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
    const t0 = performance.now();
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
        const data: DCAResponse = await response.json();
        setResults(data);
        generateChartData(data);
        const elapsed = performance.now() - t0;
        setLastDurationMs(elapsed);
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
    // Bar chart dataset remains derived client-side
    const transformed = data.assets.map((asset: DCAResult) => ({
      name: asset.symbol,
      value: asset.finalValue,
      invested: asset.totalInvested,
      return: asset.profitLoss
    }));
  setChartDataRaw(transformed);
    // Timeline now fully provided by backend (data.timeline). No mock generation here.
  };

  // Get portfolio total allocation
  const totalAllocationValue = useMemo(() => totalAllocation(selectedAssets), [selectedAssets]);
  const getTotalAllocation = () => totalAllocationValue;

  // Format total allocation for display (no decimals for whole numbers, 1 decimal otherwise)
  const formatTotalAllocation = (value: number) => formatPercent(value);

  // Validation helper for allocation
  const isValidAllocation = () => isValidTotal(selectedAssets);

  // Allocation status (used by strategy card warnings)
  const allocationStatus: 'valid' | 'over' | 'under' = useMemo(() => deriveStatus(selectedAssets), [selectedAssets]);

  const chartData = useMemo(() => chartDataRaw, [chartDataRaw]);

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

      {/* Investment Strategy */}
      <InvestmentStrategyCard
        isMobile={isMobile}
        initialAmount={initialAmount}
        setInitialAmount={setInitialAmount}
        contributionAmount={contributionAmount}
        setContributionAmount={setContributionAmount}
        contributionFrequency={contributionFrequency}
        setContributionFrequency={setContributionFrequency}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        isCalculating={isCalculating}
        calculateDCA={calculateDCA}
        selectedAssetsCount={selectedAssets.length}
        isValidAllocation={isValidAllocation()}
        allocationStatus={allocationStatus}
        totalAllocationFormatted={formatTotalAllocation(getTotalAllocation())}
      />
      {lastDurationMs !== null && (
        <div style={{ fontSize: '0.75rem', opacity: 0.6, textAlign: 'right', marginTop: '-0.75rem', marginBottom: '0.5rem' }}>
          Last calculation: {lastDurationMs.toFixed(0)} ms
        </div>
      )}

      {/* Results */}
      {results ? (
        <Suspense fallback={<div style={{ padding: '1rem', opacity: 0.7 }}>Loading results...</div>}>
          <>
            <PerformanceChartsCard
              isMobile={isMobile}
              results={results}
              chartType={chartType}
              setChartType={setChartType}
              chartData={chartData}
            />
            <ResultsTableCard results={results} startDate={startDate} endDate={endDate} />
            <PortfolioSummaryCard portfolio={results.portfolio} />
          </>
        </Suspense>
      ) : null}

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