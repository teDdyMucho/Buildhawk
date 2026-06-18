import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  User, DollarSign, TrendingUp, AlertCircle, FileText, Award, Bell,
  Wallet, Clock, TrendingDown, CalendarDays, AlertTriangle, Layers,
  RefreshCw, Building2,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// ─── brand ───────────────────────────────────────────────────────────────────
const ORANGE = '#DE5123';
const C = {
  orange: ORANGE,
  white:  '#FFFFFF',
  dark:   '#0f172a',
  mid:    '#64748b',
  silver: '#94a3b8',
  bg:     '#f1f5f9',
  border: '#e2e8f0',
};

// ─── types ────────────────────────────────────────────────────────────────────
interface Project {
  name: string;
  contractValue: number;
  forecastRevenue: number;
  stage: string;
  status: 'On Track' | 'At Risk' | 'Watch' | 'Lost';
  probability: number;
  daysInPipeline: number;
}

interface CommandData {
  // Commercial Control
  activeProjects: number;
  atRiskCount: number;
  totalContractValue: number;
  forecastRevenue: number;
  avgProbability: number;
  openLeads: number;
  projects: Project[];
  stageBreakdown: { stage: string; count: number; value: number }[];
  // Cashflow proxies from pipeline data
  pipelineByMonth: { month: string; value: number }[];
  // BuildHawk estimating
  bhTotalJobs: number;
  bhWonJobs: number;
  bhWinRate: number;
  bhForecastValue: number;
  bhPipelineValue: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt  = (n: number) => '$' + n.toLocaleString('en-AU', { maximumFractionDigits: 0 });
const fmtM = (n: number) => n >= 1_000_000
  ? '$' + (n / 1_000_000).toFixed(2) + 'M'
  : n >= 1_000 ? '$' + (n / 1_000).toFixed(0) + 'K' : '$' + n;

function stageToStatus(stage: string, status: string): Project['status'] {
  if (status === 'lost' || stage === 'Lost') return 'Lost';
  if (stage === 'Under Construction' || stage === 'Pre-Construction' || stage === 'Closed') return 'On Track';
  if (stage === 'Proposal Sent' || stage === 'Site Visit') return 'Watch';
  return 'At Risk';
}

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-AU', { month: 'short', year: '2-digit' });
}

// ─── data fetch ───────────────────────────────────────────────────────────────
async function fetchCommandData(): Promise<CommandData> {
  const [
    { data: rawSales },
    { data: rawWorkflow },
    { data: rawLeadQual },
  ] = await Promise.all([
    supabase.from('Sales_&_Project_Pipeline').select('*'),
    supabase.from('estimating_workflow_pipeline').select('*'),
    supabase.from('lead_qualification_pipeline').select('*'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const salesRows: any[] = rawSales ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bhRows: any[]    = [...(rawWorkflow ?? []), ...(rawLeadQual ?? [])];

  // ── Homes by NH projects (Sales pipeline) ────────────────────────────────
  const projects: Project[] = salesRows
    .filter(r => r.monetary_value > 0)
    .map(r => ({
      name:          r.name ?? 'Unknown',
      contractValue: Number(r.monetary_value ?? 0),
      forecastRevenue: Number(r.monetary_value ?? 0) * (Number(r.effective_probability ?? 0) / 100),
      stage:         r.pipeline_stage_name ?? 'Unknown',
      status:        stageToStatus(r.pipeline_stage_name ?? '', r.status ?? ''),
      probability:   Number(r.effective_probability ?? 0),
      daysInPipeline: r.created_at
        ? Math.round(Math.abs(Date.now() - Date.parse(r.created_at)) / 86_400_000)
        : 0,
    }))
    .sort((a, b) => b.contractValue - a.contractValue);

  const activeProjects  = salesRows.filter(r => r.status === 'open' && r.monetary_value > 0).length;
  const atRiskCount     = projects.filter(p => p.status === 'At Risk' || p.status === 'Watch').length;
  const totalContractValue = salesRows.reduce((s, r) => s + Number(r.monetary_value ?? 0), 0);
  const forecastRevenue = salesRows.reduce((s, r) => s + Number(r.monetary_value ?? 0) * (Number(r.effective_probability ?? 0) / 100), 0);
  const openLeads       = salesRows.filter(r => r.status === 'open').length;
  const avgProbability  = salesRows.length > 0
    ? salesRows.reduce((s, r) => s + Number(r.effective_probability ?? 0), 0) / salesRows.length
    : 0;

  // Stage breakdown
  const stageMap = new Map<string, { count: number; value: number }>();
  for (const r of salesRows) {
    const stage = r.pipeline_stage_name ?? 'Unknown';
    const cur = stageMap.get(stage) ?? { count: 0, value: 0 };
    stageMap.set(stage, { count: cur.count + 1, value: cur.value + Number(r.monetary_value ?? 0) });
  }
  const STAGE_ORDER = ['New Inquiry','Initial Call','Site Visit','Proposal Sent','Pre-Construction','Under Construction','Lost'];
  const stageBreakdown = [...stageMap.entries()]
    .sort((a, b) => {
      const ai = STAGE_ORDER.indexOf(a[0]);
      const bi = STAGE_ORDER.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([stage, { count, value }]) => ({ stage, count, value }));

  // Pipeline value by entry month (proxy for cashflow activity)
  const monthMap = new Map<string, number>();
  for (const r of salesRows) {
    if (!r.created_at) continue;
    const mk = monthKey(r.created_at);
    monthMap.set(mk, (monthMap.get(mk) ?? 0) + Number(r.monetary_value ?? 0));
  }
  const pipelineByMonth = [...monthMap.entries()]
    .sort((a, b) => Date.parse('1 ' + a[0]) - Date.parse('1 ' + b[0]))
    .map(([month, value]) => ({ month, value }));

  // ── BuildHawk estimating metrics ─────────────────────────────────────────
  const bhWon       = bhRows.filter(r => r.status === 'won').length;
  const bhDecided   = bhRows.filter(r => r.status === 'won' || r.status === 'lost').length;
  const bhWinRate   = bhDecided > 0 ? Math.round((bhWon / bhDecided) * 100) : 0;
  const bhPipelineValue = bhRows.reduce((s, r) => s + Number(r.monetaryValue ?? r.monetary_value ?? 0), 0);
  const bhForecastValue = bhRows.reduce((s, r) => s + Number(r.monetaryValue ?? r.monetary_value ?? 0) * (Number(r.effective_probability ?? 0) / 100), 0);

  return {
    activeProjects, atRiskCount, totalContractValue, forecastRevenue,
    avgProbability: Math.round(avgProbability * 10) / 10,
    openLeads, projects, stageBreakdown, pipelineByMonth,
    bhTotalJobs: bhRows.length, bhWonJobs: bhWon, bhWinRate,
    bhForecastValue, bhPipelineValue,
  };
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.white, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 700, color: C.dark, fontSize: 13 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: C.silver, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function KpiTile({ iconBg, icon, label, value, alert, sub }: {
  iconBg: string; icon: React.ReactNode; label: string; value: string; alert?: boolean; sub?: string;
}) {
  return (
    <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, background: C.white, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderTop: `3px solid ${iconBg}` }}>
      <div style={{ width: 40, height: 40, background: iconBg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: C.silver, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
          {label}
          {alert && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />}
        </div>
        <div style={{ fontWeight: 800, fontSize: 22, color: C.dark, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: C.silver, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function GoldenKpi({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, background: `linear-gradient(135deg, ${ORANGE}, #c43d10)`, borderRadius: 10, boxShadow: `0 4px 12px rgba(222,81,35,0.3)`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Award size={22} color="#fff" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: '#fff', lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Live from pipeline</div>
      </div>
      <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.15)', fontSize: 8, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 8px', borderBottomLeftRadius: 6 }}>
        Golden<br />Ratio
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Project['status'] }) {
  const map: Record<string, { bg: string; color: string }> = {
    'On Track': { bg: '#10b981', color: '#fff' },
    'Watch':    { bg: '#f59e0b', color: '#fff' },
    'At Risk':  { bg: '#f43f5e', color: '#fff' },
    'Lost':     { bg: '#94a3b8', color: '#fff' },
  };
  const s = map[status] ?? map['Watch'];
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>{status}</span>
  );
}

function PendingBadge({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(222,81,35,0.08)', color: ORANGE, border: `1px solid rgba(222,81,35,0.2)` }}>
      <Clock size={10} /> {label}
    </span>
  );
}

// ─── Commercial Control view ──────────────────────────────────────────────────
function CommercialView({ data }: { data: CommandData }) {
  const activeConstruction = data.projects.filter(p => p.stage === 'Under Construction');
  const activeTotal = activeConstruction.reduce((s, p) => s + p.contractValue, 0);

  return (
    <>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 14, marginBottom: 20 }}>
        <KpiTile iconBg="#3b82f6" icon={<Building2 size={18} color="#fff" />} label="Active Projects" value={String(data.activeProjects)} sub="Open in pipeline" />
        <KpiTile iconBg="#10b981" icon={<DollarSign size={18} color="#fff" />} label="Total Pipeline Value" value={fmtM(data.totalContractValue)} />
        <KpiTile iconBg="#10b981" icon={<TrendingUp size={18} color="#fff" />} label="Forecast Revenue" value={fmtM(data.forecastRevenue)} sub="Probability-weighted" />
        <KpiTile iconBg="#f43f5e" icon={<AlertCircle size={18} color="#fff" />} label="At Risk / Watch" value={String(data.atRiskCount)} alert={data.atRiskCount > 0} />
        <KpiTile iconBg="#f59e0b" icon={<FileText size={18} color="#fff" />} label="Under Construction" value={String(activeConstruction.length)} sub={fmtM(activeTotal)} />
        <GoldenKpi value={`${data.avgProbability.toFixed(1)}%`} label="Avg Win Probability" />
        <KpiTile iconBg="#1e293b" icon={<Layers size={18} color="#fff" />} label="BH Estimating Win Rate" value={`${data.bhWinRate}%`} sub={`${data.bhWonJobs} won of ${data.bhTotalJobs}`} />
      </div>

      {/* 3 column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 4fr 3fr', gap: 16, marginBottom: 16 }}>
        {/* LEFT — Project Health + Stage Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Project Financial Health" subtitle="Homes by NH · Sales & Project Pipeline">
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Project', 'Contract Value', 'Forecast Rev.', 'Stage', 'Win Prob.', 'Days Active', 'Status'].map((h, i) => (
                    <th key={h} style={{ padding: '9px 12px', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 0 ? 'left' : i === 6 ? 'center' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.projects.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: C.silver }}>No project data with contract value</td></tr>
                ) : data.projects.slice(0, 10).map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 1 ? '#f8fafc' : C.white }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: C.dark, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: C.dark, whiteSpace: 'nowrap' }}>{fmt(p.contractValue)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: C.mid, whiteSpace: 'nowrap' }}>{fmt(p.forecastRevenue)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: C.mid, fontSize: 11 }}>{p.stage}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: p.probability >= 50 ? '#10b981' : p.probability >= 30 ? '#f59e0b' : '#f43f5e' }}>{p.probability.toFixed(1)}%</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: C.mid }}>{p.daysInPipeline}d</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}><StatusPill status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.projects.length === 0 && (
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(222,81,35,0.05)', borderRadius: 6, border: `1px solid rgba(222,81,35,0.15)`, fontSize: 11, color: ORANGE }}>
                Buildxact integration will populate margin %, actual costs, earned value, and WIP data when connected.
              </div>
            )}
          </Card>

          {/* Stage Breakdown */}
          <Card title="Pipeline Stage Breakdown" subtitle="All leads · Homes by NH">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.stageBreakdown.filter(s => s.stage !== 'Lost').map((s, i) => {
                const maxCount = Math.max(...data.stageBreakdown.map(x => x.count), 1);
                const pct = Math.round((s.count / maxCount) * 100);
                const color = s.stage === 'Under Construction' ? '#10b981' : s.stage.includes('Proposal') || s.stage.includes('Pre') ? '#f59e0b' : '#3b82f6';
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: C.dark }}>{s.stage}</span>
                      <span style={{ color: C.mid }}>{s.count} lead{s.count !== 1 ? 's' : ''} · {fmtM(s.value)}</span>
                    </div>
                    <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* MIDDLE — Margin Risk + BH Performance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Margin Risk cards */}
          <Card title="Margin Risk Overview" subtitle="Hawktress Threshold Framework · Pending Buildxact">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Trade Overruns', level: 'PENDING', score: '—/10', bg: '#1e293b' },
                { label: 'Programme Delays', level: 'PENDING', score: '—/10', bg: '#10b981' },
                { label: 'Unapproved Variations', level: 'PENDING', score: '—/10', bg: '#f59e0b' },
              ].map((r, i) => (
                <div key={i} style={{ background: r.bg, borderRadius: 8, overflow: 'hidden', color: '#fff' }}>
                  <div style={{ padding: '10px 10px 8px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}>{r.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{r.level}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', textAlign: 'center', padding: '6px 0', fontSize: 12, fontWeight: 800 }}>{r.score}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 10, background: 'rgba(222,81,35,0.06)', borderRadius: 6, border: `1px solid rgba(222,81,35,0.15)`, fontSize: 11, color: ORANGE, display: 'flex', gap: 6 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              Risk scores require Buildxact API — trade quote variances, stage budgets, and programme dates.
            </div>
          </Card>

          {/* Cost Performance */}
          <Card title="Cost Performance" subtitle="Variations · Pending Buildxact">
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Project', 'Approved', 'Pending', 'Unpriced', 'Total'].map((h, i) => (
                    <th key={h} style={{ padding: '8px 10px', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeConstruction.slice(0, 4).map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 1 ? '#f8fafc' : C.white }}>
                    <td style={{ padding: '9px 10px', fontWeight: 600, color: C.dark, fontSize: 11 }}>{p.name.split('_')[0].substring(0, 22)}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: C.silver }}><PendingBadge label="Awaiting" /></td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: C.silver }}><PendingBadge label="Awaiting" /></td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: C.silver }}><PendingBadge label="Awaiting" /></td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: C.dark }}>{fmt(p.contractValue)}</td>
                  </tr>
                ))}
                {activeConstruction.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: C.silver, fontSize: 11 }}>No active construction projects</td></tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* BuildHawk Estimating Summary */}
          <Card title="BuildHawk Estimating" subtitle="Live from estimating & lead qualification pipelines">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total Jobs in Pipeline', value: String(data.bhTotalJobs), color: C.dark },
                { label: 'Won Jobs', value: String(data.bhWonJobs), color: '#10b981' },
                { label: 'Win Rate (Decided)', value: `${data.bhWinRate}%`, color: data.bhWinRate >= 40 ? '#10b981' : '#f59e0b' },
                { label: 'Pipeline Value', value: fmtM(data.bhPipelineValue), color: C.dark },
                { label: 'Forecast Revenue', value: fmtM(data.bhForecastValue), color: '#10b981' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: C.bg, borderRadius: 7, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.mid, fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT — WIP Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="WIP Summary" subtitle="Earned Value · Pending Buildxact">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Forecast Revenue', value: fmtM(data.forecastRevenue), live: true },
                { label: 'Cost to Date', value: '—', live: false },
                { label: 'Earned Value', value: '—', live: false },
                { label: 'WIP Margin Diff.', value: '—', live: false },
                { label: '% Complete', value: '—', live: false },
                { label: 'Overs / Unders', value: '—', live: false },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.mid }}>{row.label}</span>
                  <span style={{ fontWeight: 800, color: row.live ? C.dark : C.silver }}>{row.value}</span>
                </div>
              ))}
              <div style={{ margin: '8px -20px 0', padding: '12px 20px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>WIP Balance</span>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>—</span>
              </div>
              <div style={{ marginTop: 10, padding: 10, background: 'rgba(222,81,35,0.06)', borderRadius: 6, border: `1px solid rgba(222,81,35,0.15)`, fontSize: 11, color: ORANGE }}>
                Cost to Date, Earned Value, and WIP Balance require Buildxact connection.
              </div>
            </div>
          </Card>

          {/* Actions Required */}
          <Card title="Actions Required">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.atRiskCount > 0 ? (
                data.projects.filter(p => p.status === 'At Risk' || p.status === 'Watch').slice(0, 3).map((p, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 8, background: p.status === 'At Risk' ? 'rgba(244,63,94,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${p.status === 'At Risk' ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 4 }}>{p.name.substring(0, 28)}</div>
                    <div style={{ fontSize: 11, color: C.mid, marginBottom: 8 }}>{p.stage} · {p.daysInPipeline}d active · {fmt(p.contractValue)}</div>
                    <button style={{ padding: '5px 14px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: p.status === 'At Risk' ? '#f43f5e' : '#f59e0b', color: '#fff' }}>
                      Review Now
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ padding: 16, textAlign: 'center', color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                  All projects on track
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

// ─── Cashflow & Survival view ─────────────────────────────────────────────────
function CashflowView({ data }: { data: CommandData }) {
  const totalUnderConstruction = data.projects
    .filter(p => p.stage === 'Under Construction')
    .reduce((s, p) => s + p.contractValue, 0);

  return (
    <>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <KpiTile iconBg="#10b981" icon={<Wallet size={18} color="#fff" />} label="Cash on Hand" value="—" sub="Requires Xero" />
        <KpiTile iconBg="#f59e0b" icon={<Clock size={18} color="#fff" />} label="Cash Runway" value="—" alert sub="Requires Xero" />
        <KpiTile iconBg="#f43f5e" icon={<TrendingDown size={18} color="#fff" />} label="Lowest Forecast" value="—" alert sub="Requires Xero" />
        <KpiTile iconBg="#3b82f6" icon={<CalendarDays size={18} color="#fff" />} label="Tax & Statutory (90d)" value="—" sub="Requires Xero" />
      </div>

      {/* Cashflow chart — built from real pipeline entry months */}
      <Card title="Pipeline Value by Entry Month" subtitle="Homes by NH · Lead entry dates as cashflow proxy · Full forecast requires Xero">
        {data.pipelineByMonth.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.pipelineByMonth} margin={{ top: 16, right: 16, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="month" stroke={C.silver} fontSize={11} />
                <YAxis stroke={C.silver} fontSize={11} tickFormatter={(v: number) => fmtM(v)} />
                <Tooltip formatter={(v: unknown) => [fmtM(Number(v)), 'Pipeline Value']} contentStyle={{ borderRadius: 6, fontSize: 12 }} />
                <ReferenceLine y={0} stroke={C.dark} strokeWidth={1} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.pipelineByMonth.map((_, i) => (
                    <Cell key={i} fill={ORANGE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, padding: 10, background: 'rgba(222,81,35,0.06)', borderRadius: 6, border: `1px solid rgba(222,81,35,0.15)`, fontSize: 11, color: ORANGE, display: 'flex', gap: 6 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              True 90-180 day cashflow forecast (with negative month flagging) requires Xero API. Connect Xero to unlock this view.
            </div>
          </>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.silver, fontSize: 13 }}>No pipeline date data available</div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 16 }}>
        {/* Debtor Aging */}
        <Card title="Debtor Aging" subtitle="Requires Xero">
          {['Current', '30 days', '60 days', '90+ days'].map((label, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ fontWeight: 600, color: C.dark }}>{label}</span>
                <span style={{ color: C.silver }}>—</span>
              </div>
              <div style={{ height: 6, background: C.bg, borderRadius: 3 }} />
            </div>
          ))}
          <div style={{ marginTop: 8, padding: 10, background: 'rgba(222,81,35,0.05)', borderRadius: 6, fontSize: 11, color: ORANGE, border: `1px solid rgba(222,81,35,0.15)` }}>
            Connect Xero to see debtor aging with project allocation.
          </div>
        </Card>

        {/* Creditor Aging */}
        <Card title="Creditor Aging" subtitle="Requires Xero">
          {['Current', '30 days', '60 days', '90+ days'].map((label, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ fontWeight: 600, color: C.dark }}>{label}</span>
                <span style={{ color: C.silver }}>—</span>
              </div>
              <div style={{ height: 6, background: C.bg, borderRadius: 3 }} />
            </div>
          ))}
          <div style={{ marginTop: 8, padding: 10, background: 'rgba(222,81,35,0.05)', borderRadius: 6, fontSize: 11, color: ORANGE, border: `1px solid rgba(222,81,35,0.15)` }}>
            Connect Xero to see creditor aging with priority flags.
          </div>
        </Card>

        {/* Forward Pipeline — REAL data */}
        <Card title="Forward Pipeline" subtitle="Live from Supabase">
          <div style={{ marginBottom: 12, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: '#16a34a', letterSpacing: 1 }}>Active Open Leads</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d', marginTop: 4 }}>{fmtM(data.totalContractValue)}</div>
            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>{data.openLeads} leads · Homes by NH</div>
          </div>
          <div style={{ marginBottom: 12, padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: '#2563eb', letterSpacing: 1 }}>Under Construction</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8', marginTop: 4 }}>{fmtM(totalUnderConstruction)}</div>
            <div style={{ fontSize: 11, color: '#2563eb', marginTop: 2 }}>{data.projects.filter(p => p.stage === 'Under Construction').length} active projects</div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: C.silver, marginBottom: 4 }}>BH Estimating Forecast</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>{fmtM(data.bhForecastValue)}</div>
          </div>
        </Card>
      </div>

      {/* Statutory Liabilities */}
      <div style={{ marginTop: 16 }}>
        <Card title="Statutory Liabilities Schedule" subtitle="PAYG · GST · Super · next 90 days · Requires Xero">
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Liability', 'Period', 'Amount', 'Due Date', 'Status'].map((h, i) => (
                  <th key={h} style={{ padding: '9px 12px', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', textAlign: i === 2 ? 'right' : i === 4 ? 'center' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['PAYG Withholding', 'GST (BAS)', 'Superannuation'].map((label, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 1 ? '#f8fafc' : C.white }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: C.dark }}>{label}</td>
                  <td style={{ padding: '10px 12px', color: C.silver }}>—</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: C.silver }}>—</td>
                  <td style={{ padding: '10px 12px', color: C.silver }}>—</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}><PendingBadge label="Xero Required" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

// ─── Main CommandCentre component ─────────────────────────────────────────────
interface CommandCentreProps {
  appView: 'command' | 'operational';
  setAppView: (v: 'command' | 'operational') => void;
}

export default function CommandCentre({ appView, setAppView }: CommandCentreProps) {
  const [view, setView]       = useState<'commercial' | 'cashflow'>('commercial');
  const [data, setData]       = useState<CommandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchCommandData());
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* App-level switcher bar */}
      <div style={{ background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0' }}>
        {([['command', 'Command Centre'], ['operational', 'Operational Dashboard']] as ['command' | 'operational', string][]).map(([key, label]) => (
          <button key={key} onClick={() => setAppView(key)} style={{ padding: '5px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: appView === key ? ORANGE : 'rgba(255,255,255,0.08)', color: '#fff', transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, #1e3a5f 0%, #1e40af 60%, #2563eb 100%)`, color: '#fff', overflow: 'visible' }}>
        <div style={{ maxWidth: 1500, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'visible' }}>
          {/* Logo + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/image/logo_2.png" alt="BuildHawk" style={{ height: 120, width: 'auto', objectFit: 'contain' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8 }}>Command Centre</span>
              </div>
              <div style={{ fontSize: 10, opacity: 0.6, fontStyle: 'italic', marginTop: 1 }}>Control today. Predict tomorrow.</div>
            </div>
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 3, gap: 2 }}>
            {[
              { key: 'commercial', label: 'Commercial Control' },
              { key: 'cashflow',   label: 'Cashflow & Survival' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key as typeof view)}
                style={{
                  padding: '7px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                  background: view === key ? '#fff' : 'transparent',
                  color:      view === key ? '#1e40af' : 'rgba(255,255,255,0.85)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 11, opacity: 0.7, textAlign: 'right' }}>
              <div>Last refresh</div>
              <div style={{ fontWeight: 600 }}>{lastRefresh.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <button onClick={load} disabled={loading} style={{ padding: 8, borderRadius: 7, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.5 : 1 }}>
              <RefreshCw size={15} color="#fff" className={loading ? 'animate-spin' : ''} />
            </button>
            <Bell size={16} color="rgba(255,255,255,0.8)" />
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={15} color="#fff" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '20px 24px' }}>
        {error && (
          <div style={{ marginBottom: 16, padding: 14, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
            Error loading data: {error}
          </div>
        )}

        {loading && !data ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10, color: C.silver }}>
            <RefreshCw size={16} className="animate-spin" color={ORANGE} />
            <span style={{ fontSize: 13 }}>Loading from Supabase…</span>
          </div>
        ) : data ? (
          view === 'commercial'
            ? <CommercialView data={data} />
            : <CashflowView data={data} />
        ) : null}

        {/* Footer */}
        <div style={{ marginTop: 24, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.silver }}>
          <span>BuildHawk Command Centre · v3.0 · Powered by Hawktress · Connected to Supabase</span>
          <span style={{ color: ORANGE, fontWeight: 600 }}>Buildxact + Xero connection pending</span>
        </div>
      </div>
    </div>
  );
}
