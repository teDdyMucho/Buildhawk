import type { Alert } from '../data/mockData';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Props {
  alerts: Alert[];
}

const config = {
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    icon: 'text-red-500',
    title: 'text-red-800',
    desc: 'text-red-600',
    Icon: AlertCircle,
    label: 'Critical',
    labelBg: 'bg-red-100 text-red-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    icon: 'text-amber-500',
    title: 'text-amber-800',
    desc: 'text-amber-600',
    Icon: AlertTriangle,
    label: 'Warning',
    labelBg: 'bg-amber-100 text-amber-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    desc: 'text-blue-600',
    Icon: Info,
    label: 'Info',
    labelBg: 'bg-blue-100 text-blue-700',
  },
};

export default function InsightsAlerts({ alerts }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Insights &amp; Alerts</h3>
          <p className="text-xs text-gray-400 mt-0.5">Action items requiring attention</p>
        </div>
        <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
          {alerts.filter(a => a.type === 'danger').length} Critical
        </span>
      </div>
      <div className="p-4 space-y-2.5">
        {alerts.map((alert, i) => {
          const c = config[alert.type];
          const Icon = c.Icon;
          return (
            <div key={i} className={`rounded-lg border ${c.border} ${c.bg} p-3.5`}>
              <div className="flex items-start gap-2.5">
                <Icon size={15} className={`${c.icon} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${c.title} leading-tight`}>{alert.title}</span>
                    <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.labelBg}`}>
                      {c.label}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${c.desc}`}>{alert.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
