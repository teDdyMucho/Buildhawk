import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const C = { orange: '#DE5123', white: '#FFFFFF', dark: '#0f172a', mid: '#64748b', silver: '#94a3b8', border: '#e2e8f0' };

interface KPICardProps {
  title: string;
  value: string | number;
  trend: number;
  icon: React.ReactNode;
  format?: 'currency' | 'percent' | 'number' | 'days';
  animationDelay?: number;
}

function formatValue(raw: number, format?: string): string {
  if (format === 'currency') {
    if (raw >= 1_000_000) return `$${(raw / 1_000_000).toFixed(2)}M`;
    if (raw >= 1_000)     return `$${(raw / 1_000).toFixed(0)}K`;
    return `$${raw}`;
  }
  if (format === 'percent') return `${raw.toFixed(1)}%`;
  if (format === 'days')    return `${raw.toFixed(1)}d`;
  return String(raw);
}

export default function KPICard({ title, value, trend, icon, format, animationDelay = 0 }: KPICardProps) {
  const [displayed, setDisplayed] = useState(0);
  const [visible, setVisible]     = useState(false);
  const numeric = typeof value === 'number' ? value : parseFloat(String(value)) || 0;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animationDelay);
    return () => clearTimeout(t);
  }, [animationDelay]);

  useEffect(() => {
    if (!visible) return;
    setDisplayed(0);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayed(Math.round((numeric * step) / 40));
      if (step >= 40) clearInterval(timer);
    }, 15);
    return () => clearInterval(timer);
  }, [numeric, visible]);

  const trendNeutral  = trend === 0;
  const trendPositive = trend > 0;
  const isNegGood     = title === 'Avg Turnaround Time';
  const trendGood     = isNegGood ? !trendPositive : trendPositive;

  const trendBg    = trendNeutral ? '#F4F5F7' : trendGood ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)';
  const trendColor = trendNeutral ? C.silver   : trendGood ? '#16a34a'              : '#dc2626';

  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', backgroundColor: C.white, borderRadius: 12,
        border: hovered ? `2.5px solid ${C.orange}` : `1px solid ${C.border}`,
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 0 0 4px rgba(222,81,35,0.15), 0 8px 24px rgba(222,81,35,0.25)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-3px) scale(1.03)' : 'translateY(0)') : 'translateY(12px)',
        transition: `opacity 0.4s ease ${animationDelay}ms, transform 0.3s ease, box-shadow 0.3s ease, border 0.2s ease`,
        cursor: 'default',
      }}
    >
      {/* Orange top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: hovered ? 4 : 3, backgroundColor: C.orange, transition: 'height 0.2s ease', boxShadow: hovered ? '0 2px 8px rgba(222,81,35,0.5)' : 'none' }} />

      <div style={{ padding: '18px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          {/* Icon */}
          <div style={{ padding: 9, borderRadius: 9, background: 'rgba(222,81,35,0.1)', color: C.orange, display: 'flex' }}>
            {icon}
          </div>
          {/* Trend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: trendBg, color: trendColor }}>
            {trendNeutral ? <Minus size={10} /> : trendPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.dark, lineHeight: 1, marginBottom: 5 }}>
          {visible ? formatValue(displayed, format) : '—'}
        </div>
        <div style={{ fontSize: 11, color: C.mid, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</div>
      </div>
    </div>
  );
}
