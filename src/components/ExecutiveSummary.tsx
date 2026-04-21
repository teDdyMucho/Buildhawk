import type { SummaryMetric } from '../data/mockData';
import { DollarSign, BarChart2, FolderOpen, Percent, Users } from 'lucide-react';

const C = { orange: '#F15A24', white: '#FFFFFF', bg: '#F4F5F7', dark: '#2E2E2E', mid: '#6E6E6E' };
const icons = [DollarSign, BarChart2, FolderOpen, Percent, Users];

export default function ExecutiveSummary({ metrics, unitLabel, grow }: { metrics: SummaryMetric[]; unitLabel: string; grow?: boolean }) {
  return (
    <div style={{ backgroundColor: C.white, borderRadius: 12, border: '1.5px solid #F15A24', overflow: 'hidden', boxShadow: '0 2px 8px rgba(241,90,36,0.08)', display: 'flex', flexDirection: 'column', flex: grow ? 1 : undefined }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(241,90,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 16, backgroundColor: C.orange, borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Executive Summary</div>
            <div style={{ fontSize: 11, color: C.mid, marginTop: 1 }}>Key metrics at a glance</div>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.white, background: C.orange, padding: '4px 12px', borderRadius: 99, boxShadow: '0 2px 8px rgba(241,90,36,0.3)' }}>
          {unitLabel}
        </span>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {metrics.map((m, i) => {
          const Icon = icons[i % icons.length];
          return (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, border: '1px solid rgba(241,90,36,0.12)', borderRadius: 9, padding: '11px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: 7, borderRadius: 7, background: 'rgba(241,90,36,0.1)' }}>
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
