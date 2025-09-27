import { describe, it, expect } from 'vitest';
import {
  clampPercent,
  updateAssetAllocation,
  rebalanceEqual,
  adjustAllocation,
  totalAllocation,
  isValidTotal,
  formatPercent,
  allocationStatus
} from '../allocation';
import type { Asset } from '../../components/comparison/types';

// Helper to build assets (allocations passed as FRACTIONS 0-1)
const mk = (fractions: number[]): Asset[] => fractions.map((f, i) => ({
  symbol: `ASSET${i + 1}`,
  name: `Asset ${i + 1}`,
  allocation: f
}));

// Helper to get total percent from fraction assets
const pct = (assets: Asset[]) => totalAllocation(assets); // already returns percent 0-100

describe('allocation utils', () => {
  it('clampPercent enforces 0-100 with rounding', () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(0)).toBe(0);
    expect(clampPercent(50.1234)).toBe(50.12); // rounded then clamped
    expect(clampPercent(150)).toBe(100);
  });

  it('updateAssetAllocation updates only matching symbol and converts percent to fraction', () => {
    const assets = mk([0.1, 0.2, 0.3]);
    const updated = updateAssetAllocation(assets, 'ASSET2', 55.5); // 55.5% => 0.555
    expect(updated[1].allocation).toBeCloseTo(0.555, 3);
    // others unchanged (fraction values remain same object value wise)
    expect(updated[0].allocation).toBe(0.1);
    expect(updated[2].allocation).toBe(0.3);
  // New total percent reflects updated fraction (0.555 + 0.1 + 0.3 = 0.955 => 95.5%)
  expect(pct(updated)).toBeCloseTo(95.5, 3);
  });

  it('rebalanceEqual distributes equally across assets', () => {
    const assets = mk([0, 0, 0, 0]);
    const rebalanced = rebalanceEqual(assets);
    expect(pct(rebalanced)).toBeCloseTo(100, 5);
    rebalanced.forEach(a => expect(a.allocation).toBeCloseTo(0.25, 5));
  });

  it('adjustAllocation applies delta percent to specific asset', () => {
    const assets = mk([0.25, 0.25, 0.25, 0.25]);
    const adjusted = adjustAllocation(assets, 'ASSET1', 10); // +10% => 0.35 fraction
    const a1 = adjusted.find(a => a.symbol === 'ASSET1')!;
    expect(a1.allocation).toBeCloseTo(0.35, 5);
  });

  it('totalAllocation returns percent 0-100 from fractions', () => {
    const assets = mk([0.1, 0.2, 0.3]); // total fraction 0.6 => 60%
    expect(totalAllocation(assets)).toBeCloseTo(60, 5);
  });

  it('isValidTotal true only when total ~== 100%', () => {
    const valid = mk([0.4, 0.3, 0.3]);
    const invalid = mk([0.4, 0.3, 0.25]);
    expect(isValidTotal(valid)).toBe(true);
    expect(isValidTotal(invalid)).toBe(false);
  });

  it('formatPercent omits decimals for whole numbers and keeps one for fractions', () => {
    expect(formatPercent(12)).toBe('12');
    expect(formatPercent(12.3)).toBe('12.3');
    expect(formatPercent(12.34)).toBe('12.3'); // rounded
  });

  it('allocationStatus reports under / over / valid', () => {
    const under = mk([0.2, 0.2]); // 40%
    const over = mk([0.6, 0.6]); // 120%
    const exact = mk([0.5, 0.5]); // 100%
    expect(allocationStatus(under)).toBe('under');
    expect(allocationStatus(over)).toBe('over');
    expect(allocationStatus(exact)).toBe('valid');
  });

  it('tolerance in isValidTotal handles minor floating drift', () => {
    // Create fractions that sum to something like 0.999999 due to FP rounding
    const assets: Asset[] = [
      { symbol: 'A', name: 'A', allocation: 0.3333333 },
      { symbol: 'B', name: 'B', allocation: 0.3333333 },
      { symbol: 'C', name: 'C', allocation: 0.3333333 }
    ];
    expect(isValidTotal(assets)).toBe(true);
  });
});
