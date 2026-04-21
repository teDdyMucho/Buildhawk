import type { SummaryMetric } from '../data/mockData';
import { DollarSign, BarChart2, FolderOpen, Clock, Target } from 'lucide-react';

interface Props {
  metrics: SummaryMetric[];
  unitLabel: string;
}

const icons = [DollarSign, BarChart2, FolderOpen, Clock, Target];
const colors = [
  { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-sky-50', icon: 'text-sky-600', border: 'border-sky-100' },
  { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
  { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-100' },
];

export default function ExecutiveSummary({ metrics, unitLabel }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Executive Summary</h3>
          <p className="text-xs text-gray-400 mt-0.5">Key metrics at a glance</p>
        </div>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
          {unitLabel}
        </span>
      </div>
      <div className="p-4 space-y-2.5">
        {metrics.map((m, i) => {
          const Icon = icons[i % icons.length];
          const c = colors[i % colors.length];
          return (
            <div key={m.label} className={`flex items-center justify-between rounded-lg border ${c.border} ${c.bg} px-4 py-3`}>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-white/70">
                  <Icon size={14} className={c.icon} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">{m.label}</div>
                  {m.sub && <div className="text-[10px] text-gray-400">{m.sub}</div>}
                </div>
              </div>
              <div className="text-base font-bold text-gray-900 tabular-nums">{m.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
