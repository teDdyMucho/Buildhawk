import type { PipelineStage } from '../data/mockData';

const C = { orange: '#F15A24', white: '#FFFFFF', bg: '#F4F5F7', dark: '#2E2E2E', mid: '#6E6E6E' };
const funnelColors = ['#F15A24', '#e04e1a', '#c94010', '#b23208', '#9b2400'];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function PipelinePerformance({ stages, grow }: { stages: PipelineStage[]; grow?: boolean }) {
  const maxValue = Math.max(...stages.map(s => s.value), 1);

  return (
    <div style={{ backgroundColor: C.white, borderRadius: 12, border: '1.5px solid #F15A24', overflow: 'hidden', boxShadow: '0 2px 8px rgba(241,90,36,0.08)', display: 'flex', flexDirection: 'column', flex: grow ? 1 : undefined }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(241,90,36,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 16, backgroundColor: C.orange, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Pipeline Performance</div>
          <div style={{ fontSize: 11, color: C.mid, marginTop: 1 }}>Stage-by-stage funnel breakdown</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(241,90,36,0.04)' }}>
              {['Stage', 'Value', 'Deals', 'Progress', 'Conv.'].map((h, i) => (
                <th key={h} style={{ padding: '10px 16px', color: C.orange, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 0 || i === 3 ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
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
                <tr key={s.stage} style={{ borderTop: '1px solid rgba(241,90,36,0.08)', background: i % 2 === 1 ? 'rgba(241,90,36,0.02)' : C.white }}>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: bar, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: C.dark }}>{s.stage}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: C.dark }}>{fmt(s.value)}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', color: C.mid }}>{s.deals}</td>
                  <td style={{ padding: '11px 16px', minWidth: 110 }}>
                    <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(241,90,36,0.12)' }}>
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
