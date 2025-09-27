import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, X, Minus } from 'lucide-react';
import AllocationPie from '../AllocationPie';
import type { Asset } from './types';

interface AssetSelectionCardProps {
  isMobile: boolean;
  selectedAssets: Asset[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  addAsset: (asset: any) => void;
  removeAsset: (symbol: string) => void;
  autoBalanceEnabled: boolean;
  toggleAutoBalance: () => void;
  rebalanceAllocations: () => void;
  getTotalAllocation: () => number;
  formatTotalAllocation: (v: number) => string;
  getInputValue: (symbol: string) => string;
  handleAllocationChange: (symbol: string, value: string) => void;
  handleAllocationBlur: (symbol: string, value: string) => void;
  adjustAllocation: (symbol: string, delta: number) => void;
}

const AssetSelectionCard: React.FC<AssetSelectionCardProps> = ({
  isMobile,
  selectedAssets,
  searchQuery,
  setSearchQuery,
  addAsset,
  removeAsset,
  autoBalanceEnabled,
  toggleAutoBalance,
  rebalanceAllocations,
  getTotalAllocation,
  formatTotalAllocation,
  getInputValue,
  handleAllocationChange,
  handleAllocationBlur,
  adjustAllocation,
 
}) => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      (async () => {
        setIsSearching(true);
        try {
          const resp = await fetch(`/.netlify/functions/search/${encodeURIComponent(searchQuery)}`);
          if (resp.ok) {
            const data = await resp.json();
            setSearchResults(data);
          }
        } catch (e) {
          console.error('Search error', e);
        } finally {
          setIsSearching(false);
        }
      })();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  return (
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
        <div className="form-group">
          <label className="form-label" htmlFor="asset-search-input">Search & Add Assets to Compare</label>
          <div style={{ position: 'relative' }}>
            <input
              id="asset-search-input"
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isMobile ? 'Search: AAPL, BTC, SPY...' : 'Type to search: AAPL, BTC-USD, SPY, TSLA...'}
              style={{ paddingRight: '2.5rem', fontSize: isMobile ? '16px' : '1rem', minHeight: isMobile ? '44px' : '3.125rem' }}
              autoComplete="off"
              role="searchbox"
              aria-label="Search for assets to compare"
              inputMode="search"
            />
            <Search size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-label="Search icon" />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 Type to search, then <strong>click results</strong> to add up to 6 assets for comparison
          </div>
          {isSearching && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem', padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', zIndex: 10 }}>
              <div className="spinner" style={{ width: '16px', height: '16px', margin: '0 auto 0.5rem' }} />
              Searching assets...
            </div>
          )}
          {!isSearching && searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem', maxHeight: '300px', overflowY: 'auto', zIndex: 10, boxShadow: 'var(--shadow-medium)' }}>
              <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-quaternary)', borderBottom: '1px solid var(--border-primary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Click to add asset
              </div>
              {searchResults.map((result, i) => (
                <div key={i} onClick={() => addAsset(result)} style={{ padding: '0.75rem', borderBottom: i < searchResults.length - 1 ? '1px solid var(--border-primary)' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="search-result-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {result.symbol}
                      <div style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', backgroundColor: result.quoteType === 'CRYPTOCURRENCY' ? 'rgba(255, 159, 67, 0.2)' : result.quoteType === 'ETF' ? 'rgba(116, 185, 255, 0.2)' : 'rgba(0, 211, 149, 0.2)', color: result.quoteType === 'CRYPTOCURRENCY' ? '#ff9f43' : result.quoteType === 'ETF' ? '#74b9ff' : 'var(--accent-green)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                        {result.quoteType === 'CRYPTOCURRENCY' ? 'CRYPTO' : result.quoteType === 'ETF' ? 'ETF' : 'STOCK'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{result.shortName}</div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} style={{ padding: '0.4rem 0.8rem', background: 'var(--accent-blue)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Plus size={12} /> ADD
                  </motion.div>
                </div>
              ))}
            </div>
          )}
          {!isSearching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem', padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', zIndex: 10 }}>
              No assets found for "{searchQuery}". Try searching for stocks like AAPL, crypto like BTC-USD, or ETFs like SPY.
            </div>
          )}
        </div>
        {selectedAssets.length > 0 ? (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0, 211, 149, 0.05)', border: '1px solid rgba(0, 211, 149, 0.2)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '1rem', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1rem' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="form-label" style={{ color: 'var(--accent-green)' }}>✅ Selected Assets ({selectedAssets.length}/6)</span>
              </div>
              <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '0.75rem' : '1rem', flexDirection: isMobile ? 'column' : 'row', width: '100%' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: getTotalAllocation() === 100 ? 'var(--accent-green)' : Math.abs(getTotalAllocation() - 100) <= 0.1 ? 'var(--accent-green)' : 'var(--accent-red)', textAlign: isMobile ? 'center' : 'right' }}>
                  Total: {formatTotalAllocation(getTotalAllocation())}%
                  {Math.abs(getTotalAllocation() - 100) > 0.01 && (
                    <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', display: 'block' }}>
                      {getTotalAllocation() > 100 ? 'Over allocated!' : 'Should be 100%'}
                    </span>
                  )}
                </span>
                {selectedAssets.length > 0 && (
                  <button type="button" onClick={toggleAutoBalance} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: autoBalanceEnabled ? 'rgba(0,211,149,0.18)' : 'var(--bg-tertiary)', border: autoBalanceEnabled ? '1px solid var(--accent-green)' : '1px solid var(--border-primary)', padding: isMobile ? '0.75rem 0.85rem' : '0.45rem 0.7rem', borderRadius: 'var(--radius-sm)', width: isMobile ? '100%' : 'auto', minHeight: isMobile ? '44px' : 'auto', position: 'relative' }} aria-pressed={autoBalanceEnabled} aria-label="Toggle auto-balance equal weighting" title="Automatically keep all assets equally weighted">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: autoBalanceEnabled ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                      <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: autoBalanceEnabled ? 'var(--accent-green)' : 'var(--bg-secondary)', border: autoBalanceEnabled ? '1px solid var(--accent-green)' : '1px solid var(--border-primary)', borderRadius: 4, transition: 'all 0.2s ease' }}>{autoBalanceEnabled ? '✓' : ''}</span>
                      Auto-Balance
                    </span>
                    <span style={{ fontSize: '0.6rem', letterSpacing: '0.5px', color: autoBalanceEnabled ? 'var(--accent-green)' : 'var(--text-secondary)', fontWeight: 600 }}>{autoBalanceEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                )}
                {!autoBalanceEnabled && selectedAssets.length > 1 && (
                  <motion.button onClick={rebalanceAllocations} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: isMobile ? '0.75rem 1rem' : '0.5rem 0.75rem', background: 'var(--accent-blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: isMobile ? '44px' : 'auto', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }} title="Set equal allocation for all assets">🎯 Rebalance</motion.button>
                )}
              </div>
            </div>
            {selectedAssets.length >= 2 && (
              <div style={{ margin: '0.5rem 0 1rem', padding: '0.75rem 0.75rem 0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>CURRENT ALLOCATION</span>
                  {autoBalanceEnabled && <span style={{ fontSize: '0.6rem', color: 'var(--accent-green)', fontWeight: 600 }} title="Auto-balance keeps slices equal">AUTO</span>}
                </div>
                <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
                  <AllocationPie assets={selectedAssets} size={isMobile ? 180 : 240} />
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {selectedAssets.map(asset => (
                <motion.div key={asset.symbol} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', padding: isMobile ? '1rem' : '0.75rem', backgroundColor: 'var(--bg-quaternary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', transition: 'all 0.2s ease', gap: isMobile ? '1rem' : '0.75rem' }}>
                  <div style={{ flex: isMobile ? 'none' : 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: isMobile ? '0.5rem' : 0 }}>
                      {asset.symbol}
                      <div style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', backgroundColor: (asset.quoteType === 'CRYPTOCURRENCY' || asset.quoteType === 'Cryptocurrency') ? 'rgba(255, 159, 67, 0.2)' : asset.quoteType === 'ETF' ? 'rgba(116, 185, 255, 0.2)' : 'rgba(0, 211, 149, 0.2)', color: (asset.quoteType === 'CRYPTOCURRENCY' || asset.quoteType === 'Cryptocurrency') ? '#ff9f43' : asset.quoteType === 'ETF' ? '#74b9ff' : 'var(--accent-green)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                        {(asset.quoteType === 'CRYPTOCURRENCY' || asset.quoteType === 'Cryptocurrency') ? 'CRYPTO' : asset.quoteType === 'ETF' ? 'ETF' : 'STOCK'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: isMobile ? '1.4' : '1.2' }}>{asset.name}</div>
                  </div>
                  {isMobile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                        <button onClick={() => adjustAllocation(asset.symbol, -5)} disabled={(asset.allocation * 100) <= 0 || autoBalanceEnabled} style={{ background: 'var(--accent-red)', border: 'none', color: 'white', cursor: (asset.allocation * 100) <= 0 || autoBalanceEnabled ? 'not-allowed' : 'pointer', padding: '0.5rem', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 36, minHeight: 36, opacity: (asset.allocation * 100) <= 0 || autoBalanceEnabled ? 0.5 : 1 }} title="Decrease by 5%" aria-label="Decrease allocation"><Minus size={14} /></button>
                        <input type="text" inputMode="decimal" value={getInputValue(asset.symbol)} onChange={(e) => handleAllocationChange(asset.symbol, e.target.value)} onBlur={(e) => handleAllocationBlur(asset.symbol, e.target.value)} style={{ width: 80, padding: '0.75rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 4, color: 'var(--text-primary)', textAlign: 'center', fontSize: 16, fontWeight: 600, opacity: autoBalanceEnabled ? 0.6 : 1 }} placeholder="0.0" aria-label={`Allocation percentage for ${asset.symbol}`} disabled={autoBalanceEnabled} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>%</span>
                        <button onClick={() => adjustAllocation(asset.symbol, 5)} disabled={(asset.allocation * 100) >= 100 || autoBalanceEnabled} style={{ background: 'var(--accent-green)', border: 'none', color: 'white', cursor: (asset.allocation * 100) >= 100 || autoBalanceEnabled ? 'not-allowed' : 'pointer', padding: '0.5rem', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 36, minHeight: 36, opacity: (asset.allocation * 100) >= 100 || autoBalanceEnabled ? 0.5 : 1 }} title="Increase by 5%" aria-label="Increase allocation"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeAsset(asset.symbol)} style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.3)', color: 'var(--accent-red)', cursor: 'pointer', padding: '0.75rem', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)' }} aria-label={`Remove ${asset.symbol} from comparison`} title={`Remove ${asset.symbol}`}><X size={16} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', minHeight: 36 }}>
                        <button onClick={() => adjustAllocation(asset.symbol, -1)} disabled={(asset.allocation * 100) <= 0 || autoBalanceEnabled} style={{ background: 'transparent', border: 'none', color: (asset.allocation * 100) <= 0 || autoBalanceEnabled ? 'var(--text-muted)' : 'var(--text-primary)', cursor: (asset.allocation * 100) <= 0 || autoBalanceEnabled ? 'not-allowed' : 'pointer', padding: '0.25rem', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 24, minHeight: 24 }} title="Decrease allocation" aria-label="Decrease allocation"><Minus size={12} /></button>
                        <input type="text" inputMode="decimal" value={getInputValue(asset.symbol)} onChange={(e) => handleAllocationChange(asset.symbol, e.target.value)} onBlur={(e) => handleAllocationBlur(asset.symbol, e.target.value)} style={{ width: 60, padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'center', fontSize: '0.875rem', outline: 'none', opacity: autoBalanceEnabled ? 0.6 : 1 }} placeholder="0.0" aria-label={`Allocation percentage for ${asset.symbol}`} disabled={autoBalanceEnabled} />
                        <button onClick={() => adjustAllocation(asset.symbol, 1)} disabled={(asset.allocation * 100) >= 100 || autoBalanceEnabled} style={{ background: 'transparent', border: 'none', color: (asset.allocation * 100) >= 100 || autoBalanceEnabled ? 'var(--text-muted)' : 'var(--text-primary)', cursor: (asset.allocation * 100) >= 100 || autoBalanceEnabled ? 'not-allowed' : 'pointer', padding: '0.25rem', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 24, minHeight: 24 }} title="Increase allocation" aria-label="Increase allocation"><Plus size={12} /></button>
                      </div>
                      <span style={{ color: 'var(--text-muted)', minWidth: 20, fontSize: '1rem' }}>%</span>
                      <button onClick={() => removeAsset(asset.symbol)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)' }} aria-label={`Remove ${asset.symbol} from comparison`} title={`Remove ${asset.symbol}`}><X size={16} /></button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            {selectedAssets.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                💡 <strong>Tip:</strong> {autoBalanceEnabled ? 'Auto-Balance is ON. Disable it to manually edit allocations.' : 'Adjust allocation percentages above, then scroll down to set your strategy and calculate performance.'}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: '1.5rem' }}>
            <div className="form-label" style={{ marginBottom: '0.75rem' }}>💡 Quick Add Popular Assets</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                { symbol: 'AAPL', name: 'Apple Inc.' },
                { symbol: 'TSLA', name: 'Tesla Inc.' },
                { symbol: 'BTC-USD', name: 'Bitcoin' },
                { symbol: 'SPY', name: 'S&P 500 ETF' },
                { symbol: 'QQQ', name: 'Nasdaq ETF' },
                { symbol: 'ETH-USD', name: 'Ethereum' }
              ].map(a => (
                <motion.button key={a.symbol} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => addAsset({ symbol: a.symbol, shortName: a.name, quoteType: a.symbol.includes('-USD') ? 'CRYPTOCURRENCY' : a.symbol.length === 3 ? 'ETF' : 'EQUITY' })} style={{ padding: isMobile ? '0.75rem 1rem' : '0.5rem 0.75rem', background: 'transparent', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: isMobile ? '1rem' : '0.875rem', cursor: 'pointer', transition: 'all 0.2s ease', minHeight: isMobile ? '44px' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>+ {a.symbol}</motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AssetSelectionCard;
