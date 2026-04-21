import type { EstimatorRow } from '../data/mockData';
import StatusBadge from './StatusBadge';

const C = { orange: '#F15A24', white: '#FFFFFF', bg: '#F4F5F7', dark: '#2E2E2E', mid: '#6E6E6E' };

export default function EstimatorProductivity({ estimators, grow }: { estimators: EstimatorRow[]; grow?: boolean }) {
  return (
    <div style={{ backgroundColor: C.white, borderRadius: 12, border: '1.5px solid #F15A24', overflow: 'hidden', boxShadow: '0 2px 8px rgba(241,90,36,0.08)', display: 'flex', flexDirection: 'column', flex: grow ? 1 : undefined }}>
      <div style={{ padding: '14px 20px', borderBottom: 'inset 1px solid rgba(241,90,36,0.15)', display: 'flex', alignItems: 'center', gap: 10, borderBottomColor: 'rgba(241,90,36,0.15)', borderBottomWidth: 1, borderBottomStyle: 'solid' }}>
        <div style={{ width: 3, height: 16, backgroundColor: C.orange, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Estimator Productivity</div>
          <div style={{ fontSize: 11, color: C.mid, marginTop: 1 }}>Individual performance overview</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(241,90,36,0.04)' }}>
              {['Estimator', 'Leads', 'Conversions', 'Efficiency', 'Status'].map((h, i) => (
                <th key={h} style={{ padding: '10px 16px', color: C.orange, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 0 ? 'left' : i === 4 ? 'center' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estimators.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: C.mid }}>No estimator data available</td></tr>
            ) : estimators.map((e, i) => {
              const effColor = e.efficiency >= 80 ? '#16a34a' : e.efficiency >= 65 ? '#d97706' : '#dc2626';
              return (
                <tr key={e.name} style={{ borderTop: '1px solid rgba(241,90,36,0.08)', background: i % 2 === 1 ? 'rgba(241,90,36,0.02)' : C.white }}>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(241,90,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: C.orange, flexShrink: 0, border: '1px solid rgba(241,90,36,0.2)' }}>
                        {e.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: C.dark }}>{e.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', color: C.mid }}>{e.leadsHandled}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', color: C.mid }}>{e.conversions}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <div style={{ width: 56, height: 5, background: '#F4F5F7', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(241,90,36,0.15)' }}>
                        <div style={{ height: '100%', width: `${e.efficiency}%`, backgroundColor: effColor, borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontWeight: 700, color: effColor, minWidth: 34, textAlign: 'right' }}>{e.efficiency}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'center' }}><StatusBadge status={e.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
