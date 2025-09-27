import React from 'react';
import { motion } from 'framer-motion';

interface MetricConfig {
  id: string;
  label: string;
  value: number; // raw value (not percent unless specified)
  format: (v: number) => string;
  segments: Array<{
    label: string;
    min: number; // inclusive
    max: number; // exclusive (except last)
    color: string;
    bg: string;
    description: string;
  }>;
  note?: string;
}

interface RiskLegendProps {
  volatility: number; // expressed as 0.xx (e.g. 0.23)
  sharpe: number;
  maxDrawdown: number; // 0.xx
  beta: number; // raw
}

// Utility to find active segment
const findActive = (value: number, segments: MetricConfig['segments']) => {
  return segments.findIndex((s, idx) => {
    const upper = (idx === segments.length - 1) ? Infinity : s.max;
    return value >= s.min && value < upper;
  });
};

export const RiskLegend: React.FC<RiskLegendProps> = ({ volatility, sharpe, maxDrawdown, beta }) => {
  const metrics: MetricConfig[] = [
    {
      id: 'volatility',
      label: 'Volatility (Annual %)',
      value: volatility * 100,
      format: v => v.toFixed(1) + '%',
      segments: [
        { label: 'Very Low', min: 0,  max: 10, color: 'var(--accent-green)', bg: 'rgba(0,211,149,0.15)', description: 'Very stable pricing' },
        { label: 'Low',      min: 10, max: 15, color: 'var(--accent-green)', bg: 'rgba(0,211,149,0.10)', description: 'Mild price moves' },
        { label: 'Moderate', min: 15, max: 20, color: 'var(--accent-blue)',  bg: 'rgba(88,166,255,0.15)', description: 'Normal variance' },
        { label: 'High',     min: 20, max: 30, color: '#ff9500',            bg: 'rgba(255,149,0,0.20)', description: 'Large swings' },
        { label: 'Very High',min: 30, max: 1000,color: 'var(--accent-red)', bg: 'rgba(255,107,107,0.25)', description: 'Extreme volatility' }
      ],
      note: 'Higher = larger price swings'
    },
    {
      id: 'sharpe',
      label: 'Sharpe Ratio',
      value: sharpe,
      format: v => v.toFixed(2),
      segments: [
        { label: 'Negative', min: -100, max: 0,  color: 'var(--accent-red)', bg: 'rgba(255,107,107,0.25)', description: 'Underperforming risk‑free' },
        { label: 'Adequate', min: 0,    max: 1,  color: '#ff9500',            bg: 'rgba(255,149,0,0.20)', description: 'Modest risk efficiency' },
        { label: 'Good',     min: 1,    max: 2,  color: 'var(--accent-blue)', bg: 'rgba(88,166,255,0.15)', description: 'Solid risk-adjusted' },
        { label: 'Excellent',min: 2,    max: 100,color: 'var(--accent-green)',bg: 'rgba(0,211,149,0.20)', description: 'Strong efficiency' }
      ],
      note: 'Higher = better risk-adjusted return'
    },
    {
      id: 'maxDrawdown',
      label: 'Max Drawdown %',
      value: maxDrawdown * 100,
      format: v => '-' + v.toFixed(1) + '%',
      segments: [
        { label: 'Limited',    min: 0,  max: 20, color: 'var(--accent-green)', bg: 'rgba(0,211,149,0.15)', description: 'Contained downside' },
        { label: 'Moderate',   min: 20, max: 30, color: 'var(--accent-blue)',  bg: 'rgba(88,166,255,0.15)', description: 'Typical corrections' },
        { label: 'Significant',min: 30, max: 50, color: '#ff9500',            bg: 'rgba(255,149,0,0.20)', description: 'Meaningful declines' },
        { label: 'Severe',     min: 50, max: 1000,color: 'var(--accent-red)', bg: 'rgba(255,107,107,0.25)', description: 'Large historical drops' }
      ],
      note: 'Lower = smaller historical declines'
    },
    {
      id: 'beta',
      label: 'Beta vs Market',
      value: beta,
      format: v => v.toFixed(2),
      segments: [
        { label: 'Defensive',       min: 0,   max: 0.8, color: 'var(--accent-green)', bg: 'rgba(0,211,149,0.15)', description: 'Less volatile than market' },
        { label: 'Market-like',     min: 0.8, max: 1.2, color: 'var(--accent-blue)',  bg: 'rgba(88,166,255,0.15)', description: 'Moves with market' },
        { label: 'Aggressive',      min: 1.2, max: 1.5, color: '#ff9500',            bg: 'rgba(255,149,0,0.20)', description: 'Amplifies moves' },
        { label: 'Highly Aggressive',min: 1.5,max: 100, color: 'var(--accent-red)',  bg: 'rgba(255,107,107,0.25)', description: 'Very sensitive to market' }
      ],
      note: '1.0 ≈ market sensitivity'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} aria-label="Risk metric legend" role="list">
      {metrics.map(metric => {
        const activeIdx = findActive(metric.value, metric.segments);
        return (
          <motion.div
            key={metric.id}
            role="listitem"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{metric.label}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{metric.format(metric.value)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${metric.segments.length}, 1fr)`, gap: '4px' }}>
              {metric.segments.map((seg, idx) => {
                const active = idx === activeIdx;
                return (
                  <div
                    key={seg.label}
                    style={{
                      position: 'relative',
                      background: seg.bg,
                      border: `1px solid ${seg.color}`,
                      borderRadius: 6,
                      padding: '0.4rem 0.35rem 0.55rem',
                      minHeight: '54px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      boxShadow: active ? `0 0 0 2px ${seg.color}` : 'none',
                      outline: active ? `2px solid ${seg.color}` : 'none',
                      outlineOffset: active ? 0 : 0,
                      transition: 'all 0.25s ease'
                    }}
                    aria-current={active ? 'true' : undefined}
                    aria-label={`${seg.label} tier: ${seg.description}`}
                  >
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.5px', color: seg.color, textTransform: 'uppercase', lineHeight: 1 }}>{seg.label}</span>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', lineHeight: 1.2, marginTop: '0.15rem' }}>
                      {seg.description}
                    </span>
                    {active && (
                      <motion.span
                        layoutId={`active-pill-${metric.id}`}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: 4,
                          background: seg.color,
                          color: '#fff',
                          fontSize: '0.55rem',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 8,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                        }}
                      >NOW</motion.span>
                    )}
                  </div>
                );
              })}
            </div>
            {metric.note && (
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.1rem', letterSpacing: '0.5px' }}>{metric.note}</div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default RiskLegend;