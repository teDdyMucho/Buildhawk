import type { StatusLevel, RiskLevel } from '../data/mockData';

interface StatusBadgeProps {
  status: StatusLevel | RiskLevel;
}

const config: Record<string, { bg: string; text: string; dot: string }> = {
  Good: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'At Risk': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  High: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Low: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status] ?? config['At Risk'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}
