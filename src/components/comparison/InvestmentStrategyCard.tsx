import { motion } from 'framer-motion';
import { DollarSign, Calculator } from 'lucide-react';
import React from 'react';

interface InvestmentStrategyCardProps {
  isMobile: boolean;
  initialAmount: string;
  setInitialAmount: (v: string) => void;
  contributionAmount: string;
  setContributionAmount: (v: string) => void;
  contributionFrequency: string;
  setContributionFrequency: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  isCalculating: boolean;
  calculateDCA: () => void;
  selectedAssetsCount: number;
  isValidAllocation: boolean;
  allocationStatus: 'valid' | 'over' | 'under';
  totalAllocationFormatted: string;
}

const InvestmentStrategyCard: React.FC<InvestmentStrategyCardProps> = ({
  isMobile,
  initialAmount,
  setInitialAmount,
  contributionAmount,
  setContributionAmount,
  contributionFrequency,
  setContributionFrequency,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isCalculating,
  calculateDCA,
  selectedAssetsCount,
  isValidAllocation,
  allocationStatus,
  totalAllocationFormatted
}) => {
  return (
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
              step={isMobile ? '100' : '1'}
              style={{ fontSize: isMobile ? '16px' : '1rem', minHeight: isMobile ? '44px' : '3.125rem' }}
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
              step={isMobile ? '50' : '1'}
              style={{ fontSize: isMobile ? '16px' : '1rem', minHeight: isMobile ? '44px' : '3.125rem' }}
              aria-label="Regular contribution amount in dollars"
            />
          </div>

            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select
                className="form-select"
                value={contributionFrequency}
                onChange={(e) => setContributionFrequency(e.target.value)}
                style={{ fontSize: isMobile ? '16px' : '1rem', minHeight: isMobile ? '44px' : '3.125rem' }}
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
                  style={{ fontSize: isMobile ? '16px' : '1rem', minHeight: isMobile ? '44px' : '3.125rem', flex: 1 }}
                  aria-label="Investment start date"
                />
                <button
                  type="button"
                  onClick={() => setStartDate(new Date().toISOString().split('T')[0])}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#00b383'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-green)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  style={{ padding: isMobile ? '0.75rem' : '0.5rem 0.75rem', background: 'var(--accent-green)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: isMobile ? '0.875rem' : '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap', minHeight: isMobile ? '44px' : '3.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                  style={{ fontSize: isMobile ? '16px' : '1rem', minHeight: isMobile ? '44px' : '3.125rem', flex: 1 }}
                  aria-label="Investment end date"
                />
                <button
                  type="button"
                  onClick={() => setEndDate(new Date().toISOString().split('T')[0])}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-purple)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-blue)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  style={{ padding: isMobile ? '0.75rem' : '0.5rem 0.75rem', background: 'var(--accent-blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: isMobile ? '0.875rem' : '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap', minHeight: isMobile ? '44px' : '3.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Set end date to today"
                >
                  📅 Today
                </button>
              </div>
            </div>
        </div>

        {/* Centered Button Section */}
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <motion.button
            className="btn-primary"
            onClick={calculateDCA}
            disabled={isCalculating || selectedAssetsCount === 0 || !isValidAllocation}
            whileHover={{ scale: selectedAssetsCount > 0 && isValidAllocation ? 1.02 : 1 }}
            whileTap={{ scale: selectedAssetsCount > 0 && isValidAllocation ? 0.98 : 1 }}
            style={{ width: isMobile ? '100%' : '80%', maxWidth: isMobile ? 'none' : '340px', opacity: selectedAssetsCount === 0 || !isValidAllocation ? 0.6 : 1, minHeight: isMobile ? '52px' : '3.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.25rem', lineHeight: 1.1, whiteSpace: 'nowrap' }}
            title={
              selectedAssetsCount === 0 ? 'Please select at least one asset' :
              !isValidAllocation ? `Total allocation is ${totalAllocationFormatted}% - should be 100%` :
              'Calculate investment performance'
            }
          >
            {isCalculating ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: isMobile ? '0.95rem' : '1rem' }}>
                <div className="spinner" style={{ width: '18px', height: '18px' }} />
                Calculating...
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 600 }}>
                <Calculator size={18} />
                {isMobile ? 'Run Simulation' : 'Calculate Performance'}
              </div>
            )}
          </motion.button>

          {selectedAssetsCount > 0 && !isValidAllocation && (
            <>
              <div style={{ width: isMobile ? '100%' : '80%', maxWidth: isMobile ? 'none' : '340px', marginTop: '0.5rem', fontSize: '0.65rem', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>
                Adjust allocations to enable
              </div>
              <div role="alert" aria-live="polite" style={{ width: isMobile ? '100%' : '80%', maxWidth: isMobile ? 'none' : '340px', marginTop: '0.6rem', padding: '0.85rem 0.9rem', background: allocationStatus === 'over' ? 'rgba(255, 107, 107, 0.12)' : 'rgba(255, 159, 67, 0.12)', border: `1px solid ${allocationStatus === 'over' ? 'rgba(255, 107, 107, 0.35)' : 'rgba(255, 159, 67, 0.35)'}`, borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', lineHeight: 1.3, color: allocationStatus === 'over' ? 'var(--accent-red)' : '#ff9f43', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span aria-hidden="true">⚠️</span>
                <strong>Total allocation is {totalAllocationFormatted}%</strong>
                <span>{allocationStatus === 'over' ? 'Reduce some allocations.' : 'Increase allocations to reach 100%.'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InvestmentStrategyCard;
