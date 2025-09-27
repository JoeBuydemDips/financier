import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface AllocationSlice {
  symbol: string;
  allocation: number; // 0-1
  name?: string;
}

interface AllocationPieProps {
  assets: AllocationSlice[];
  size?: number;
  showLegend?: boolean;
}

const COLORS = ['#00d395', '#58a6ff', '#ff9f43', '#a855f7', '#ef4444', '#f59e0b'];

export const AllocationPie: React.FC<AllocationPieProps> = ({ assets, size = 220, showLegend = true }) => {
  if (!assets || assets.length === 0) return null;
  if (assets.length === 1) {
    return (
      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        100% <strong>{assets[0].symbol}</strong>
      </div>
    );
  }

  const data = assets.map((a, i) => ({
    name: a.symbol,
    value: Number((a.allocation * 100).toFixed(2)),
    raw: a.allocation,
    color: COLORS[i % COLORS.length]
  }));

  return (
    <div aria-label="Current portfolio allocation" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ width: '100%', height: size }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(22,27,34,0.95)',
                border: '1px solid #30363d',
                borderRadius: 12,
                fontSize: 12,
                padding: '0.6rem 0.75rem'
              }}
              formatter={(value: any, _name: string, p: any) => [`${value.toFixed(2)}%`, p.payload.name] }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', fontSize: '0.7rem' }}>
          {data.map(d => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, background: d.color, borderRadius: 2 }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>{d.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
      {/* Accessible table fallback */}
      <table style={{ width: '1px', height: '1px', overflow: 'hidden', position: 'absolute', clip: 'rect(1px,1px,1px,1px)' }} aria-hidden="true">
        <thead>
          <tr><th>Symbol</th><th>Allocation (%)</th></tr>
        </thead>
        <tbody>
          {data.map(d => (
            <tr key={d.name}><td>{d.name}</td><td>{d.value}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllocationPie;
