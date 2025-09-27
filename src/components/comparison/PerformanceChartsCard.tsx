import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import React from 'react';
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
import type { DCAResult } from './types';

interface PerformanceChartsCardProps {
  isMobile: boolean;
  results: {
    assets: DCAResult[];
    benchmark: DCAResult;
    portfolio: any;
    timeline?: any[];
  };
  chartType: 'bar' | 'area' | 'portfolio';
  setChartType: (t: 'bar' | 'area' | 'portfolio') => void;
  chartData: any[];
}

const colors = ['#00d395', '#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b'];

const PerformanceChartsCard: React.FC<PerformanceChartsCardProps> = ({
  isMobile,
  results,
  chartType,
  setChartType,
  chartData
}) => {
  return (
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
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`} onClick={() => setChartType('bar')}>📊 All Assets</button>
          <button className={`chart-type-btn ${chartType === 'portfolio' ? 'active' : ''}`} onClick={() => setChartType('portfolio')}>🎯 Portfolio vs S&P 500</button>
          <button className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`} onClick={() => setChartType('area')}>📈 Performance Timeline</button>
        </div>
      </div>
      <div className="card-body">
        {chartType === 'portfolio' ? (
          <>
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
                      color: colors[i % colors.length]
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
                <Tooltip content={(tooltipProps: any) => {
                  const { active, payload } = tooltipProps;
                  if (!active || !payload || !payload.length) return null;
                  const dataPoint = payload[0].payload;
                  const segs = dataPoint.segments || [];
                  const totalVal = dataPoint.value || segs.reduce((s: number, sg: any) => s + (sg.value || 0), 0);
                  return (
                    <div style={{ background: 'rgba(22,27,34,0.95)', border: '1px solid #30363d', borderRadius: 12, padding: '0.75rem 0.9rem', minWidth: 200, fontSize: isMobile ? 12 : 13, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                      <div style={{ fontWeight: 600, color: '#58a6ff', marginBottom: '0.35rem' }}>{dataPoint.label}</div>
                      <div style={{ fontWeight: 600, color: '#f0f6fc', marginBottom: '0.5rem' }}>Total: ${totalVal.toLocaleString()}</div>
                      {dataPoint.type === 'portfolio' && segs.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {segs.slice().sort((a: any, b: any) => b.value - a.value).map((s: any) => {
                            const pct = totalVal ? (s.value / totalVal) * 100 : 0;
                            return (
                              <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, display: 'inline-block' }} />
                                  <span style={{ color: '#f0f6fc' }}>{s.symbol}</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 600 }}>{pct.toFixed(1)}%</div>
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
                }} />
                <Bar dataKey="value" radius={[4,4,0,0]} shape={(barProps: any) => {
                  const { x, y, width, height, payload } = barProps;
                  const segments = Array.isArray(payload?.segments) ? payload.segments : [];
                  if (!segments.length) {
                    return <rect x={x} y={y} width={width} height={height} fill={payload.type === 'benchmark' ? '#8b949e' : '#00d395'} rx={4} ry={4} />;
                  }
                  const total = segments.reduce((s: number, seg: any) => s + (seg.value || 0), 0) || 1;
                  let offsetY = y + height;
                  const ordered = segments.slice().sort((a: any, b: any) => b.value - a.value);
                  return (
                    <g>{ordered.map((seg: any, idx: number) => {
                      const ratio = (seg.value || 0) / total;
                      const segH = height * ratio;
                      offsetY -= segH;
                      const isTop = idx === ordered.length - 1;
                      return <rect key={seg.symbol} x={x} y={offsetY} width={width} height={segH} fill={seg.color} rx={isTop ? 4 : 0} ry={isTop ? 4 : 0}><title>{`${seg.symbol}: $${seg.value.toLocaleString()}`}</title></rect>;
                    })}</g>
                  );
                }} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem 1.5rem', justifyContent: 'center', marginTop: '1.25rem', fontSize: '0.8rem', lineHeight: 1.2, maxWidth: 900, marginInline: 'auto' }}>
              {results.assets.map((a, i) => (
                <div key={a.symbol} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 14, height: 10, background: colors[i % colors.length], borderRadius: 2, display: 'inline-block' }} />
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
              <XAxis dataKey="name" stroke="#8b949e" fontSize={12} tick={{ fill: '#8b949e' }} axisLine={{ stroke: '#30363d' }} />
              <YAxis stroke="#8b949e" fontSize={12} tick={{ fill: '#8b949e' }} axisLine={{ stroke: '#30363d' }} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(22, 27, 34, 0.95)', border: '1px solid #30363d', borderRadius: 12, color: '#f0f6fc', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(12px)' }} formatter={(value: any, name: any) => [ `$${Number(value).toLocaleString()}`, name === 'value' ? '💰 Final Value' : name === 'invested' ? '💸 Total Invested' : name === 'return' ? '📈 Total Return' : name ]} labelStyle={{ color: '#58a6ff', fontWeight: 600 }} />
              <Legend wrapperStyle={{ paddingTop: 20 }} iconType="rect" />
              <Bar dataKey="invested" fill="#58a6ff" name="💸 Total Invested" radius={[4,4,0,0]} opacity={0.8} />
              <Bar dataKey="value" fill="#00d395" name="💰 Final Value" radius={[4,4,0,0]} opacity={0.9} />
              <Bar dataKey="return" fill="#ff9f43" name="📈 Profit/Loss" radius={[4,4,0,0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={results.timeline || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" opacity={0.3} />
              <XAxis dataKey="date" stroke="#8b949e" fontSize={12} tick={{ fill: '#8b949e' }} axisLine={{ stroke: '#30363d' }} />
              <YAxis stroke="#8b949e" fontSize={12} tick={{ fill: '#8b949e' }} axisLine={{ stroke: '#30363d' }} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(22, 27, 34, 0.95)', border: '1px solid #30363d', borderRadius: 12, color: '#f0f6fc', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(12px)' }} formatter={(value: any, name: any) => [ `$${Number(value).toLocaleString()}`, name ]} labelStyle={{ color: '#58a6ff', fontWeight: 600 }} />
              <Legend wrapperStyle={{ paddingTop: 20 }} iconType="line" />
              <Line type="monotone" dataKey="portfolio" stroke="#00d395" strokeWidth={4} dot={{ fill: '#00d395', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, stroke: '#00d395', strokeWidth: 3 }} name="🎯 Portfolio Total" />
              {results.assets.map((asset, index) => (
                <Line key={asset.symbol} type="monotone" dataKey={asset.symbol} stroke={['#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b', '#00b383'][index % 6]} strokeWidth={2} dot={{ fill: ['#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b', '#00b383'][index % 6], strokeWidth: 1, r: 3 }} activeDot={{ r: 5, stroke: ['#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b', '#00b383'][index % 6], strokeWidth: 2 }} name={`📊 ${asset.symbol}`} opacity={0.7} />
              ))}
              <Line type="monotone" dataKey="benchmark" stroke="#8b949e" strokeWidth={3} strokeDasharray="5 5" dot={false} name="📍 S&P 500" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

export default PerformanceChartsCard;
