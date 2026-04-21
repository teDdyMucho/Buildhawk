import type { RiskIndicator } from '../data/mockData';
import StatusBadge from './StatusBadge';
import { ShieldCheck, Target, Clock } from 'lucide-react';

const C = { orange: '#F15A24', white: '#FFFFFF', bg: '#F4F5F7', dark: '#2E2E2E', mid: '#6E6E6E' };
const icons = [ShieldCheck, Target, Clock];

const lvl: Record<string, { border: string; bg: string; bar: string; val: string; iconBg: string }> = {
  High:   { border: 'rgba(22,163,74,0.2)',  bg: 'rgba(22,163,74,0.04)',  bar: '#16a34a', val: '#16a34a', iconBg: 'rgba(22,163,74,0.1)'  },
  Medium: { border: 'rgba(217,119,6,0.2)',  bg: 'rgba(217,119,6,0.04)',  bar: '#d97706', val: '#d97706', iconBg: 'rgba(217,119,6,0.1)'  },
  Low:    { border: 'rgba(220,38,38,0.2)',  bg: 'rgba(220,38,38,0.04)',  bar: '#dc2626', val: '#dc2626', iconBg: 'rgba(220,38,38,0.1)'  },
};

export default function PerformanceRisk({ indicators, grow }: { indicators: RiskIndicator[]; grow?: boolean }) {
  return (
    <div style={{ backgroundColor: C.white, borderRadius: 12, border: '1.5px solid #F15A24', overflow: 'hidden', boxShadow: '0 2px 8px rgba(241,90,36,0.08)', display: 'flex', flexDirection: 'column', flex: grow ? 1 : undefined }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(241,90,36,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 16, backgroundColor: C.orange, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Performance &amp; Risk Overview</div>
          <div style={{ fontSize: 11, color: C.mid, marginTop: 1 }}>Key operational health indicators</div>
        </div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {indicators.map((ind, i) => {
          const Icon = icons[i % icons.length];
          const s = lvl[ind.level] ?? lvl.Medium;
          const barW = ind.label.includes('Turnaround')
            ? Math.min((ind.value / 10) * 100, 100)
            : Math.min(ind.value, 100);
          return (
            <div key={ind.label} style={{ borderRadius: 10, border: `1px solid ${s.border}`, background: s.bg, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ padding: 7, borderRadius: 7, background: s.iconBg }}>
                    <Icon size={14} style={{ color: s.val }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{ind.label}</span>
                </div>
                <StatusBadge status={ind.level} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.val, lineHeight: 1, marginBottom: 6 }}>
                {ind.label.includes('Turnaround') ? `${ind.value.toFixed(1)}d` : `${ind.value.toFixed(1)}%`}
              </div>
              <p style={{ fontSize: 11, color: C.mid, margin: '0 0 10px', lineHeight: 1.5 }}>{ind.description}</p>
              <div style={{ height: 5, background: C.bg, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(241,90,36,0.12)' }}>
                <div style={{ height: '100%', width: `${barW}%`, backgroundColor: s.bar, borderRadius: 3, transition: 'width 0.7s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
