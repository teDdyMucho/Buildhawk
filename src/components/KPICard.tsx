import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend: number;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  suffix?: string;
  format?: 'currency' | 'percent' | 'number' | 'days';
  animationDelay?: number;
}

function formatValue(raw: string | number, format?: string, prefix?: string, suffix?: string): string {
  if (typeof raw === 'string') return raw;
  if (format === 'currency') {
    if (raw >= 1_000_000) return `$${(raw / 1_000_000).toFixed(2)}M`;
    if (raw >= 1_000) return `$${(raw / 1_000).toFixed(0)}K`;
    return `$${raw}`;
  }
  if (format === 'percent') return `${raw.toFixed(1)}%`;
  if (format === 'days') return `${raw.toFixed(1)}d`;
  return `${prefix ?? ''}${raw}${suffix ?? ''}`;
}

export default function KPICard({
  title,
  value,
  trend,
  icon,
  color,
  prefix,
  suffix,
  format,
  animationDelay = 0,
}: KPICardProps) {
  const [displayed, setDisplayed] = useState(0);
  const [visible, setVisible] = useState(false);

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), animationDelay);
    return () => clearTimeout(showTimer);
  }, [animationDelay]);

  useEffect(() => {
    if (!visible) return;
    setDisplayed(0);
    const steps = 40;
    const stepDelay = 600 / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayed(Math.round((numericValue * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, stepDelay);
    return () => clearInterval(timer);
  }, [numericValue, visible]);

  const trendPositive = trend > 0;
  const trendNeutral = trend === 0;
  const isNegativeGood = title === 'Avg Turnaround Time';
  const trendGood = isNegativeGood ? !trendPositive : trendPositive;

  return (
    <div
      className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 0.4s ease ${animationDelay}ms, transform 0.4s ease ${animationDelay}ms, box-shadow 0.2s ease`,
      }}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${color}`} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${color.replace('bg-', 'bg-').replace('-500', '-50').replace('-600', '-50')}`}
               style={{ background: 'rgba(0,0,0,0.04)' }}>
            <div className="w-5 h-5 text-gray-600">{icon}</div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            trendNeutral
              ? 'bg-gray-50 text-gray-500'
              : trendGood
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-red-50 text-red-500'
          }`}>
            {trendNeutral ? (
              <Minus size={11} />
            ) : trendPositive ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900 leading-none mb-1">
          {visible ? formatValue(displayed, format, prefix, suffix) : '—'}
        </div>
        <div className="text-xs text-gray-500 font-medium">{title}</div>
      </div>
    </div>
  );
}
