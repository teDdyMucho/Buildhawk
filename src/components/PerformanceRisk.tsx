import type { RiskIndicator } from '../data/mockData';
import StatusBadge from './StatusBadge';
import { ShieldCheck, Target, Clock } from 'lucide-react';

interface Props {
  indicators: RiskIndicator[];
}

const icons = [ShieldCheck, Target, Clock];

const levelColor: Record<string, string> = {
  High: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  Low: 'bg-red-500',
};

const levelBg: Record<string, string> = {
  High: 'bg-emerald-50 border-emerald-100',
  Medium: 'bg-amber-50 border-amber-100',
  Low: 'bg-red-50 border-red-100',
};

const levelValue: Record<string, string> = {
  High: 'text-emerald-700',
  Medium: 'text-amber-700',
  Low: 'text-red-700',
};

export default function PerformanceRisk({ indicators }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">Performance &amp; Risk Overview</h3>
        <p className="text-xs text-gray-400 mt-0.5">Key operational health indicators</p>
      </div>
      <div className="p-4 space-y-3">
        {indicators.map((ind, i) => {
          const Icon = icons[i % icons.length];
          return (
            <div key={ind.label} className={`rounded-lg border p-4 ${levelBg[ind.level]}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-white/70">
                    <Icon size={14} className={levelValue[ind.level]} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{ind.label}</span>
                </div>
                <StatusBadge status={ind.level} />
              </div>
              <div className={`text-2xl font-bold mb-1 ${levelValue[ind.level]}`}>
                {ind.label.includes('Turnaround') ? `${ind.value.toFixed(1)}d` : `${ind.value.toFixed(1)}%`}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{ind.description}</p>
              <div className="mt-2.5 h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${levelColor[ind.level]}`}
                  style={{
                    width: ind.label.includes('Turnaround')
                      ? `${Math.min((ind.value / 10) * 100, 100)}%`
                      : `${Math.min(ind.value, 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
