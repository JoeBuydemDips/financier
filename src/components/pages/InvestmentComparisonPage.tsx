import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3,
  Search,
  Plus,
  X,
  DollarSign,
  Target,
  Calculator,
  PieChart,
  Activity,
  Minus
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

interface Asset {
  symbol: string;
  name: string;
  allocation: number;
  quoteType?: string;
  exchange?: string;
}

interface DCAResult {
  symbol: string;
  name: string;
  allocation: number;
  totalInvested: number;
  finalValue: number;
  totalShares: number;
  profitLoss: number;
  totalReturn: number;
  annualizedReturn: number;
  averageCost: number;
  currentPrice: number;
}

export const InvestmentComparisonPage = () => {
  const isMobile = useIsMobile();
  
  // Asset Selection State
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Input state for allocation editing (to handle cursor position properly)
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});

  // DCA Parameters
  const [initialAmount, setInitialAmount] = useState('1000');
  const [contributionAmount, setContributionAmount] = useState('500');
  const [contributionFrequency, setContributionFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState('2021-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');

  // Results State
  const [results, setResults] = useState<{
    assets: DCAResult[];
    benchmark: DCAResult;
    portfolio: any;
    timeline?: any[];
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  // Search for assets
  const searchAssets = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
              const response = await fetch(`/.netlify/functions/search/${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAssets(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Add asset to comparison
  const addAsset = (asset: any) => {
    if (selectedAssets.length >= 6) {
      alert('Maximum 6 assets allowed for comparison');
      return;
    }

    const newAsset: Asset = {
      symbol: asset.symbol,
      name: asset.shortName || asset.symbol,
      allocation: 1 / (selectedAssets.length + 1), // Equal allocation by default
      quoteType: asset.quoteType,
      exchange: asset.exchange
    };

    // Rebalance existing allocations
    const rebalancedAssets = selectedAssets.map(a => ({
      ...a,
      allocation: 1 / (selectedAssets.length + 1)
    }));

    setSelectedAssets([...rebalancedAssets, newAsset]);
    setSearchQuery('');
    setSearchResults([]);
    
    // Clear input states since allocations have changed
    setAllocationInputs({});
  };

  // Remove asset
  const removeAsset = (symbol: string) => {
    const filtered = selectedAssets.filter(asset => asset.symbol !== symbol);
    // Rebalance remaining assets
    const rebalanced = filtered.map(asset => ({
      ...asset,
      allocation: 1 / filtered.length
    }));
    setSelectedAssets(rebalanced);
    
    // Clear input states since allocations have changed
    setAllocationInputs({});
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
  }, [selectedAssets]);

  // Handle direct input changes - store in temporary input state
  const handleAllocationChange = useCallback((symbol: string, value: string) => {
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
  }, []);

  // Handle when input loses focus - validate and update actual allocation
  const handleAllocationBlur = useCallback((symbol: string, value: string) => {
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
  }, [selectedAssets, updateAllocation]);

  // Adjust allocation with increment/decrement buttons
  const adjustAllocation = useCallback((symbol: string, delta: number) => {
    const currentAsset = selectedAssets.find(asset => asset.symbol === symbol);
    if (currentAsset) {
      const currentPercentage = currentAsset.allocation * 100;
      const newPercentage = currentPercentage + delta;
      updateAllocation(symbol, newPercentage);
    }
  }, [selectedAssets, updateAllocation]);

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

  // Calculate DCA performance
  const calculateDCA = async () => {
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset to compare');
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
    // Create normalized performance chart data
    const chartData = data.assets.map((asset: DCAResult) => ({
      name: asset.symbol,
      value: asset.finalValue,
      invested: asset.totalInvested,
      return: asset.profitLoss
    }));
    
    chartData.push({
      name: 'S&P 500',
      value: data.benchmark.finalValue,
      invested: data.benchmark.totalInvested,
      return: data.benchmark.profitLoss || (data.benchmark.finalValue - data.benchmark.totalInvested)
    });

    setChartData(chartData);
    
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
        benchmark: data.benchmark.totalInvested * (1 + (data.benchmark.totalReturn / 100) * (i / 12))
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
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <Search size={20} />
            Asset Selection
          </h3>
        </div>
        <div className="card-body">
          {/* Search Bar */}
          <div className="form-group">
            <label className="form-label" htmlFor="asset-search-input">Search & Add Assets to Compare</label>
            <div style={{ position: 'relative' }}>
              <input
                id="asset-search-input"
                name="assetSearch"
                type="text"
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isMobile ? "Search: AAPL, BTC, SPY..." : "Type to search: AAPL, BTC-USD, SPY, TSLA..."}
                style={{ 
                  paddingRight: '2.5rem',
                  fontSize: isMobile ? '16px' : '1rem', // Prevent zoom on iOS
                  minHeight: isMobile ? '44px' : '3.125rem'
                }}
                autoComplete="off"
                role="searchbox"
                aria-label="Search for assets to compare"
                inputMode="search"
              />
              <Search size={16} style={{ 
                position: 'absolute', 
                right: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
            </div>
            
            {/* Instructions */}
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-muted)', 
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              💡 Type to search, then <strong>click results</strong> to add up to 6 assets for comparison
            </div>
            
            {/* Loading State */}
            {isSearching && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)',
                marginTop: '0.25rem',
                padding: '1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                zIndex: 10
              }}>
                <div className="spinner" style={{ width: '16px', height: '16px', margin: '0 auto 0.5rem' }} />
                Searching assets...
              </div>
            )}
            
            {/* Search Results */}
            {!isSearching && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)',
                marginTop: '0.25rem',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 10,
                boxShadow: 'var(--shadow-medium)'
              }}>
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: 'var(--bg-quaternary)',
                  borderBottom: '1px solid var(--border-primary)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Click to add asset
                </div>
                {searchResults.map((result: any, index) => (
                  <div
                    key={index}
                    onClick={() => addAsset(result)}
                    style={{
                      padding: '0.75rem',
                      borderBottom: index < searchResults.length - 1 ? '1px solid var(--border-primary)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    className="search-result-item"
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {result.symbol}
                        <div style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.4rem',
                          backgroundColor: result.quoteType === 'CRYPTOCURRENCY' ? 'rgba(255, 159, 67, 0.2)' : 
                                          result.quoteType === 'ETF' ? 'rgba(116, 185, 255, 0.2)' : 
                                          'rgba(0, 211, 149, 0.2)',
                          color: result.quoteType === 'CRYPTOCURRENCY' ? '#ff9f43' : 
                                 result.quoteType === 'ETF' ? '#74b9ff' : 
                                 'var(--accent-green)',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: '600'
                        }}>
                          {result.quoteType === 'CRYPTOCURRENCY' ? 'CRYPTO' : 
                           result.quoteType === 'ETF' ? 'ETF' : 
                           'STOCK'}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {result.shortName}
                      </div>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: 'var(--accent-blue)',
                        color: 'white',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Plus size={12} />
                      ADD
                    </motion.div>
                  </div>
                ))}
              </div>
            )}
            
            {/* No Results */}
            {!isSearching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)',
                marginTop: '0.25rem',
                padding: '1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                zIndex: 10
              }}>
                No assets found for "{searchQuery}". Try searching for stocks like AAPL, crypto like BTC-USD, or ETFs like SPY.
              </div>
            )}
          </div>

          {/* Selected Assets */}
          {selectedAssets.length > 0 && (
            <div style={{ 
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(0, 211, 149, 0.05)',
              border: '1px solid rgba(0, 211, 149, 0.2)',
              borderRadius: 'var(--radius-md)'
            }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: isMobile ? 'flex-start' : 'center',
                  marginBottom: '1rem',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '1rem' : '0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="form-label" style={{ color: 'var(--accent-green)' }}>
                      ✅ Selected Assets ({selectedAssets.length}/6)
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    flexDirection: isMobile ? 'column' : 'row',
                    width: isMobile ? '100%' : 'auto'
                  }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      color: getTotalAllocation() === 100 ? 'var(--accent-green)' : 
                             Math.abs(getTotalAllocation() - 100) <= 0.1 ? 'var(--accent-green)' : 'var(--accent-red)',
                      textAlign: isMobile ? 'center' : 'right'
                    }}>
                      Total: {formatTotalAllocation(getTotalAllocation())}%
                      {Math.abs(getTotalAllocation() - 100) > 0.01 && (
                        <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', display: 'block' }}>
                          {getTotalAllocation() > 100 ? 'Over allocated!' : 'Should be 100%'}
                        </span>
                      )}
                    </span>
                    
                    {selectedAssets.length > 1 && (
                      <motion.button
                        onClick={rebalanceAllocations}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: isMobile ? '0.75rem 1rem' : '0.5rem 0.75rem',
                          background: 'var(--accent-blue)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minHeight: isMobile ? '44px' : 'auto',
                          width: isMobile ? '100%' : 'auto',
                          justifyContent: 'center'
                        }}
                        title="Set equal allocation for all assets"
                      >
                        🎯 Rebalance
                      </motion.button>
                    )}
                  </div>
                </div>              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {selectedAssets.map((asset) => (
                  <motion.div
                    key={asset.symbol}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'stretch' : 'center',
                      padding: isMobile ? '1rem' : '0.75rem',
                      backgroundColor: 'var(--bg-quaternary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-primary)',
                      transition: 'all 0.2s ease',
                      gap: isMobile ? '1rem' : '0.75rem'
                    }}
                  >
                    {/* Asset Info Section */}
                    <div style={{ flex: isMobile ? 'none' : 1 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: isMobile ? '0.5rem' : '0'
                      }}>
                        {asset.symbol}
                        <div style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.4rem',
                          backgroundColor: (asset.quoteType === 'CRYPTOCURRENCY' || asset.quoteType === 'Cryptocurrency') ? 'rgba(255, 159, 67, 0.2)' : 
                                          asset.quoteType === 'ETF' ? 'rgba(116, 185, 255, 0.2)' : 
                                          'rgba(0, 211, 149, 0.2)',
                          color: (asset.quoteType === 'CRYPTOCURRENCY' || asset.quoteType === 'Cryptocurrency') ? '#ff9f43' : 
                                 asset.quoteType === 'ETF' ? '#74b9ff' : 
                                 'var(--accent-green)',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: '600'
                        }}>
                          {(asset.quoteType === 'CRYPTOCURRENCY' || asset.quoteType === 'Cryptocurrency') ? 'CRYPTO' : 
                           asset.quoteType === 'ETF' ? 'ETF' : 
                           'STOCK'}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--text-muted)',
                        lineHeight: isMobile ? '1.4' : '1.2'
                      }}>
                        {asset.name}
                      </div>
                    </div>
                    
                    {/* Mobile Allocation Controls */}
                    {isMobile ? (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}>
                        {/* Mobile +/- Controls */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.5rem'
                        }}>
                          <button
                            onClick={() => adjustAllocation(asset.symbol, -5)}
                            disabled={(asset.allocation * 100) <= 0}
                            style={{
                              background: 'var(--accent-red)',
                              border: 'none',
                              color: 'white',
                              cursor: (asset.allocation * 100) <= 0 ? 'not-allowed' : 'pointer',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '36px',
                              minHeight: '36px',
                              opacity: (asset.allocation * 100) <= 0 ? 0.5 : 1
                            }}
                            title="Decrease by 5%"
                          >
                            <Minus size={14} />
                          </button>
                          
                          <input
                            type="text"
                            inputMode="decimal"
                            value={getInputValue(asset.symbol)}
                            onChange={(e) => handleAllocationChange(asset.symbol, e.target.value)}
                            onBlur={(e) => handleAllocationBlur(asset.symbol, e.target.value)}
                            style={{
                              width: '80px',
                              padding: '0.75rem 0.5rem',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '4px',
                              color: 'var(--text-primary)',
                              textAlign: 'center',
                              fontSize: '16px', // Prevent zoom on iOS
                              fontWeight: '600'
                            }}
                            placeholder="0.0"
                            aria-label={`Allocation percentage for ${asset.symbol}`}
                          />
                          
                          <span style={{ 
                            color: 'var(--text-primary)', 
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}>%</span>
                          
                          <button
                            onClick={() => adjustAllocation(asset.symbol, 5)}
                            disabled={(asset.allocation * 100) >= 100}
                            style={{
                              background: 'var(--accent-green)',
                              border: 'none',
                              color: 'white',
                              cursor: (asset.allocation * 100) >= 100 ? 'not-allowed' : 'pointer',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '36px',
                              minHeight: '36px',
                              opacity: (asset.allocation * 100) >= 100 ? 0.5 : 1
                            }}
                            title="Increase by 5%"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeAsset(asset.symbol)}
                          style={{
                            background: 'rgba(255, 107, 107, 0.1)',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            color: 'var(--accent-red)',
                            cursor: 'pointer',
                            padding: '0.75rem',
                            minHeight: '44px',
                            minWidth: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 'var(--radius-sm)'
                          }}
                          aria-label={`Remove ${asset.symbol} from comparison`}
                          title={`Remove ${asset.symbol}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      /* Desktop Controls */
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Desktop allocation control */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.25rem',
                          minHeight: '36px'
                        }}>
                          <button
                            onClick={() => adjustAllocation(asset.symbol, -1)}
                            disabled={(asset.allocation * 100) <= 0}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: (asset.allocation * 100) <= 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                              cursor: (asset.allocation * 100) <= 0 ? 'not-allowed' : 'pointer',
                              padding: '0.25rem',
                              borderRadius: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '24px',
                              minHeight: '24px'
                            }}
                            title="Decrease allocation"
                          >
                            <Minus size={12} />
                          </button>
                          
                          <input
                            type="text"
                            inputMode="decimal"
                            value={getInputValue(asset.symbol)}
                            onChange={(e) => handleAllocationChange(asset.symbol, e.target.value)}
                            onBlur={(e) => handleAllocationBlur(asset.symbol, e.target.value)}
                            style={{
                              width: '60px',
                              padding: '0.5rem',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-primary)',
                              textAlign: 'center',
                              fontSize: '0.875rem',
                              outline: 'none'
                            }}
                            placeholder="0.0"
                            aria-label={`Allocation percentage for ${asset.symbol}`}
                          />
                          
                          <button
                            onClick={() => adjustAllocation(asset.symbol, 1)}
                            disabled={(asset.allocation * 100) >= 100}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: (asset.allocation * 100) >= 100 ? 'var(--text-muted)' : 'var(--text-primary)',
                              cursor: (asset.allocation * 100) >= 100 ? 'not-allowed' : 'pointer',
                              padding: '0.25rem',
                              borderRadius: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '24px',
                              minHeight: '24px'
                            }}
                            title="Increase allocation"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        
                        <span style={{ color: 'var(--text-muted)', minWidth: '20px', fontSize: '1rem' }}>%</span>
                        
                        <button
                          onClick={() => removeAsset(asset.symbol)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-red)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 'var(--radius-sm)'
                          }}
                          aria-label={`Remove ${asset.symbol} from comparison`}
                          title={`Remove ${asset.symbol}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              
              {selectedAssets.length > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)'
                }}>
                  💡 <strong>Tip:</strong> Adjust allocation percentages above, then scroll down to set your investment strategy and calculate performance.
                </div>
              )}
            </div>
          )}
          
          {/* Quick Add Popular Assets */}
          {selectedAssets.length === 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="form-label" style={{ marginBottom: '0.75rem' }}>
                💡 Quick Add Popular Assets
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  { symbol: 'AAPL', name: 'Apple Inc.' },
                  { symbol: 'TSLA', name: 'Tesla Inc.' },
                  { symbol: 'BTC-USD', name: 'Bitcoin' },
                  { symbol: 'SPY', name: 'S&P 500 ETF' },
                  { symbol: 'QQQ', name: 'Nasdaq ETF' },
                  { symbol: 'ETH-USD', name: 'Ethereum' }
                ].map((asset) => (
                  <motion.button
                    key={asset.symbol}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addAsset({
                      symbol: asset.symbol,
                      shortName: asset.name,
                      quoteType: asset.symbol.includes('-USD') ? 'CRYPTOCURRENCY' : 
                                asset.symbol.length === 3 ? 'ETF' : 'EQUITY'
                    })}
                    style={{
                      padding: isMobile ? '0.75rem 1rem' : '0.5rem 0.75rem',
                      background: 'transparent',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: isMobile ? '1rem' : '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: isMobile ? '44px' : 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation'
                    }}
                  >
                    + {asset.symbol}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

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
            justifyContent: 'center' 
          }}>
            <motion.button
              className="btn-primary"
              onClick={calculateDCA}
              disabled={isCalculating || selectedAssets.length === 0 || !isValidAllocation()}
              whileHover={{ scale: selectedAssets.length > 0 && isValidAllocation() ? 1.02 : 1 }}
              whileTap={{ scale: selectedAssets.length > 0 && isValidAllocation() ? 0.98 : 1 }}
              style={{ 
                width: isMobile ? '100%' : '80%', 
                maxWidth: isMobile ? 'none' : '300px',
                opacity: selectedAssets.length === 0 || !isValidAllocation() ? 0.6 : 1,
                minHeight: isMobile ? '48px' : '3.125rem'
              }}
              title={
                selectedAssets.length === 0 ? 'Please select at least one asset' :
                !isValidAllocation() ? `Total allocation is ${formatTotalAllocation(getTotalAllocation())}% - should be 100%` :
                'Calculate investment performance'
              }
            >
              {isCalculating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  Calculating...
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calculator size={16} />
                  Calculate Performance
                  {selectedAssets.length > 0 && !isValidAllocation() && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      opacity: 0.8,
                      marginLeft: '0.25rem'
                    }}>
                      (Fix allocation first)
                    </span>
                  )}
                </div>
              )}
            </motion.button>
            
            {/* Validation feedback */}
            {selectedAssets.length > 0 && !isValidAllocation() && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: getAllocationStatus() === 'over' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 159, 67, 0.1)',
                border: `1px solid ${getAllocationStatus() === 'over' ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 159, 67, 0.3)'}`,
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                color: getAllocationStatus() === 'over' ? 'var(--accent-red)' : '#ff9f43',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                ⚠️ Total allocation is {formatTotalAllocation(getTotalAllocation())}% - 
                {getAllocationStatus() === 'over' ? ' reduce some allocations' : ' increase allocations to 100%'}
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartType('bar')}
                >
                  📊 Comparison
                </button>
                <button
                  className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`}
                  onClick={() => setChartType('area')}
                >
                  📈 Performance
                </button>
              </div>
            </div>
            <div className="card-body">
              {chartType === 'bar' ? (
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
                    {results.assets.map((asset, index) => (
                      <Line
                        key={asset.symbol}
                        type="monotone"
                        dataKey={asset.symbol}
                        stroke={['#00d395', '#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b'][index % 6]}
                        strokeWidth={3}
                        dot={{ fill: ['#00d395', '#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b'][index % 6], strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: ['#00d395', '#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b'][index % 6], strokeWidth: 2 }}
                        name={`📊 ${asset.symbol}`}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      stroke="#8b949e"
                      strokeWidth={2}
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