import type { LeadSegment } from '../data/mockData';
import StatusBadge from './StatusBadge';

const C = { white: '#FFFFFF', bg: '#F4F5F7', dark: '#2E2E2E', mid: '#6E6E6E', border: '#F15A24', orange: '#F15A24' };

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function LeadPipelineHealth({ segments, grow }: { segments: LeadSegment[]; grow?: boolean }) {
  return (
    <div style={{ backgroundColor: C.white, borderRadius: 12, border: `1.5px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(241,90,36,0.08)', display: 'flex', flexDirection: 'column', flex: grow ? 1 : undefined }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid rgba(241,90,36,0.15)`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 16, backgroundColor: C.orange, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Lead &amp; Pipeline Health</div>
          <div style={{ fontSize: 11, color: C.mid, marginTop: 1 }}>Segment performance vs targets</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(241,90,36,0.04)' }}>
              {['Segment', 'Leads', 'Pipeline', 'Win Rate', 'Status'].map((h, i) => (
                <th key={h} style={{ padding: '10px 16px', color: C.orange, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 0 ? 'left' : i === 4 ? 'center' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {segments.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: C.mid }}>No segment data available</td></tr>
            ) : segments.map((s, i) => (
              <tr key={s.segment} style={{ borderTop: '1px solid rgba(241,90,36,0.08)', background: i % 2 === 1 ? 'rgba(241,90,36,0.02)' : C.white }}>
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
