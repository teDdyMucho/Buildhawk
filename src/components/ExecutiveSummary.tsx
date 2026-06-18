import type { SummaryMetric } from '../data/mockData';
import { DollarSign, BarChart2, FolderOpen, Percent, Users } from 'lucide-react';

const C = { orange: '#DE5123', white: '#FFFFFF', bg: '#f1f5f9', dark: '#0f172a', mid: '#64748b', border: '#e2e8f0' };
const icons = [DollarSign, BarChart2, FolderOpen, Percent, Users];

export default function ExecutiveSummary({ metrics, unitLabel, grow }: { metrics: SummaryMetric[]; unitLabel: string; grow?: boolean }) {
  return (
    <div style={{ backgroundColor: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', flex: grow ? 1 : undefined }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 16, backgroundColor: C.orange, borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Executive Summary</div>
            <div style={{ fontSize: 11, color: C.mid, marginTop: 1 }}>Key metrics at a glance</div>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.white, background: C.orange, padding: '4px 12px', borderRadius: 99, boxShadow: '0 2px 8px rgba(222,81,35,0.3)' }}>
          {unitLabel}
        </span>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {metrics.map((m, i) => {
          const Icon = icons[i % icons.length];
          return (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: '11px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: 7, borderRadius: 7, background: 'rgba(222,81,35,0.1)' }}>
                  <Icon size={13} style={{ color: C.orange }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{m.label}</div>
                  {m.sub && <div style={{ fontSize: 10, color: C.mid }}>{m.sub}</div>}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>{m.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
