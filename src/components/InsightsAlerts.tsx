import type { Alert } from '../data/mockData';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const C = { orange: '#DE5123', white: '#FFFFFF', dark: '#0f172a', mid: '#64748b', border: '#e2e8f0' };

const cfg = {
  danger:  { bg: 'rgba(220,38,38,0.04)',  border: 'rgba(220,38,38,0.15)',  icon: '#dc2626', title: '#991b1b', desc: '#6b7280', Icon: AlertCircle,   label: 'Critical', tagBg: 'rgba(220,38,38,0.1)',  tagColor: '#dc2626' },
  warning: { bg: 'rgba(217,119,6,0.04)',  border: 'rgba(217,119,6,0.15)',  icon: '#d97706', title: '#92400e', desc: '#6b7280', Icon: AlertTriangle, label: 'Warning',  tagBg: 'rgba(217,119,6,0.1)',  tagColor: '#d97706' },
  info:    { bg: 'rgba(222,81,35,0.04)',  border: 'rgba(222,81,35,0.15)',  icon: C.orange,  title: C.dark,    desc: C.mid,    Icon: Info,          label: 'Info',     tagBg: 'rgba(222,81,35,0.1)',  tagColor: C.orange  },
};

export default function InsightsAlerts({ alerts, grow }: { alerts: Alert[]; grow?: boolean }) {
  const criticalCount = alerts.filter(a => a.type === 'danger').length;
  return (
    <div style={{ backgroundColor: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', flex: grow ? 1 : undefined }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 16, backgroundColor: C.orange, borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Insights &amp; Alerts</div>
            <div style={{ fontSize: 11, color: C.mid, marginTop: 1 }}>Action items requiring attention</div>
          </div>
        </div>
        {criticalCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: C.white, background: '#dc2626', padding: '3px 10px', borderRadius: 99, boxShadow: '0 2px 6px rgba(220,38,38,0.3)' }}>
            {criticalCount} Critical
          </span>
        )}
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {alerts.map((alert, i) => {
          const c = cfg[alert.type];
          const Icon = c.Icon;
          return (
            <div key={i} style={{ borderRadius: 10, border: `1px solid ${c.border}`, background: c.bg, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Icon size={15} style={{ color: c.icon, flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.title }}>{alert.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: c.tagBg, color: c.tagColor, flexShrink: 0 }}>{c.label}</span>
                  </div>
                  <p style={{ fontSize: 11, lineHeight: 1.6, color: c.desc, margin: 0 }}>{alert.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
