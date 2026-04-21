import type { StatusLevel, RiskLevel } from '../data/mockData';

interface Props { status: StatusLevel | RiskLevel; }

const cfg: Record<string, { bg: string; color: string; dot: string }> = {
  Good:     { bg: 'rgba(22,163,74,0.08)',   color: '#16a34a', dot: '#16a34a' },
  'At Risk':{ bg: 'rgba(217,119,6,0.08)',   color: '#d97706', dot: '#d97706' },
  Critical: { bg: 'rgba(220,38,38,0.08)',   color: '#dc2626', dot: '#dc2626' },
  High:     { bg: 'rgba(22,163,74,0.08)',   color: '#16a34a', dot: '#16a34a' },
  Medium:   { bg: 'rgba(217,119,6,0.08)',   color: '#d97706', dot: '#d97706' },
  Low:      { bg: 'rgba(220,38,38,0.08)',   color: '#dc2626', dot: '#dc2626' },
};

export default function StatusBadge({ status }: Props) {
  const c = cfg[status] ?? cfg['At Risk'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}
