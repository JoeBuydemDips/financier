import type { Asset } from '../components/comparison/types';

// Clamp a percentage (0-100) and round to 2 decimals
export function clampPercent(value: number): number {
  return Math.min(Math.max(0, parseFloat(value.toFixed(2))), 100);
}

// Update allocation for a given symbol returning a new assets array
export function updateAssetAllocation(assets: Asset[], symbol: string, percent: number): Asset[] {
  const clamped = clampPercent(percent) / 100;
  return assets.map(a => a.symbol === symbol ? { ...a, allocation: clamped } : a);
}

// Rebalance all assets equally
export function rebalanceEqual(assets: Asset[]): Asset[] {
  if (assets.length === 0) return assets;
  const equal = 1 / assets.length;
  return assets.map(a => ({ ...a, allocation: equal }));
}

// Adjust a single asset by delta percent (can be negative)
export function adjustAllocation(assets: Asset[], symbol: string, delta: number): Asset[] {
  const asset = assets.find(a => a.symbol === symbol);
  if (!asset) return assets;
  const currentPct = asset.allocation * 100;
  return updateAssetAllocation(assets, symbol, currentPct + delta);
}

// Compute total allocation percent (0-100)
export function totalAllocation(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + a.allocation, 0) * 100;
}

// Validate allocation ~== 100 with rounding tolerance
export function isValidTotal(assets: Asset[], tolerance = 0.01): boolean {
  return Math.abs(totalAllocation(assets) - 100) <= tolerance;
}

// Format percent with 0 or 1 decimal depending on whole number
export function formatPercent(value: number): string {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
}

// Derive allocation status string
export function allocationStatus(assets: Asset[]): 'valid' | 'over' | 'under' {
  const total = totalAllocation(assets);
  if (Math.abs(total - 100) <= 0.01) return 'valid';
  return total > 100 ? 'over' : 'under';
}
