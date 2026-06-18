import type { LeadSegment } from '../data/mockData';
import StatusBadge from './StatusBadge';

const C = { white: '#FFFFFF', bg: '#f1f5f9', dark: '#0f172a', mid: '#64748b', border: '#e2e8f0', orange: '#DE5123' };

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function LeadPipelineHealth({ segments, grow }: { segments: LeadSegment[]; grow?: boolean }) {
  return (
    <div style={{ backgroundColor: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', flex: grow ? 1 : undefined }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 16, backgroundColor: C.orange, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Lead &amp; Pipeline Health</div>
          <div style={{ fontSize: 11, color: C.mid, marginTop: 1 }}>Segment performance vs targets</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {['Segment', 'Leads', 'Pipeline', 'Win Rate', 'Status'].map((h, i) => (
                <th key={h} style={{ padding: '10px 16px', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 0 ? 'left' : i === 4 ? 'center' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {segments.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: C.mid }}>No segment data available</td></tr>
            ) : segments.map((s, i) => (
              <tr key={s.segment} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 1 ? '#f8fafc' : C.white }}>
                <td style={{ padding: '11px 16px', fontWeight: 600, color: C.dark }}>{s.segment}</td>
                <td style={{ padding: '11px 16px', textAlign: 'right', color: C.mid }}>{s.leads}</td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600, color: C.dark }}>{fmt(s.pipeline)}</td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: s.winRate >= 35 ? '#16a34a' : s.winRate >= 25 ? '#d97706' : '#dc2626' }}>{s.winRate}%</td>
                <td style={{ padding: '11px 16px', textAlign: 'center' }}><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
