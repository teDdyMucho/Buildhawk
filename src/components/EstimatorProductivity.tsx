import type { EstimatorRow } from '../data/mockData';
import StatusBadge from './StatusBadge';

const C = { orange: '#DE5123', white: '#FFFFFF', bg: '#f1f5f9', dark: '#0f172a', mid: '#64748b', border: '#e2e8f0' };

export default function EstimatorProductivity({ estimators, grow }: { estimators: EstimatorRow[]; grow?: boolean }) {
  return (
    <div style={{ backgroundColor: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', flex: grow ? 1 : undefined }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 16, backgroundColor: C.orange, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Estimator Productivity</div>
          <div style={{ fontSize: 11, color: C.mid, marginTop: 1 }}>Individual performance overview</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {['Estimator', 'Leads', 'Conversions', 'Efficiency', 'Status'].map((h, i) => (
                <th key={h} style={{ padding: '10px 16px', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 0 ? 'left' : i === 4 ? 'center' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estimators.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: C.mid }}>No estimator data available</td></tr>
            ) : estimators.map((e, i) => {
              const effColor = e.efficiency >= 80 ? '#16a34a' : e.efficiency >= 65 ? '#d97706' : '#dc2626';
              return (
                <tr key={e.name} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 1 ? '#f8fafc' : C.white }}>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(222,81,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: C.orange, flexShrink: 0, border: '1px solid rgba(222,81,35,0.2)' }}>
                        {e.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: C.dark }}>{e.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', color: C.mid }}>{e.leadsHandled}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', color: C.mid }}>{e.conversions}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <div style={{ width: 56, height: 5, background: C.bg, borderRadius: 3, overflow: 'hidden', border: `1px solid ${C.border}` }}>
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
