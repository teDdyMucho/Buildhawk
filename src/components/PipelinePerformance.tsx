import type { PipelineStage } from '../data/mockData';

const C = { orange: '#DE5123', white: '#FFFFFF', bg: '#f1f5f9', dark: '#0f172a', mid: '#64748b', border: '#e2e8f0' };
const funnelColors = ['#DE5123', '#c94816', '#b23a0d', '#9c2c05', '#851e00'];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function PipelinePerformance({ stages, grow }: { stages: PipelineStage[]; grow?: boolean }) {
  const maxValue = Math.max(...stages.map(s => s.value), 1);

  return (
    <div style={{ backgroundColor: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', flex: grow ? 1 : undefined }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 16, backgroundColor: C.orange, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Pipeline Performance</div>
          <div style={{ fontSize: 11, color: C.mid, marginTop: 1 }}>Stage-by-stage funnel breakdown</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {['Stage', 'Value', 'Deals', 'Progress', 'Conv.'].map((h, i) => (
                <th key={h} style={{ padding: '10px 16px', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 0 || i === 3 ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stages.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: C.mid }}>No pipeline data available</td></tr>
            ) : stages.map((s, i) => {
              const bar = funnelColors[i % funnelColors.length];
              const convColor = s.conversion >= 70 ? '#16a34a' : s.conversion >= 50 ? '#d97706' : C.orange;
              return (
                <tr key={s.stage} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 1 ? '#f8fafc' : C.white }}>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: bar, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: C.dark }}>{s.stage}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: C.dark }}>{fmt(s.value)}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', color: C.mid }}>{s.deals}</td>
                  <td style={{ padding: '11px 16px', minWidth: 110 }}>
                    <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                      <div style={{ height: '100%', width: `${(s.value / maxValue) * 100}%`, backgroundColor: bar, borderRadius: 3, transition: 'width 0.7s ease' }} />
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: convColor }}>{s.conversion.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
