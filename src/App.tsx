import { useState, useEffect, useCallback } from 'react';
import {
  Users, Percent, TrendingUp, DollarSign,
  FolderOpen, Clock, Zap, MailCheck,
  ChevronRight, RefreshCw,
} from 'lucide-react';
import KPICard from './components/KPICard';
import LeadPipelineHealth from './components/LeadPipelineHealth';
import EstimatorProductivity from './components/EstimatorProductivity';
import PerformanceRisk from './components/PerformanceRisk';
import PipelinePerformance from './components/PipelinePerformance';
import ExecutiveSummary from './components/ExecutiveSummary';
import InsightsAlerts from './components/InsightsAlerts';
import CommandCentre from './components/CommandCentre';
import { fetchDashboardData, type BusinessUnit, type DashboardData } from './data/mockData';

type AppView = 'command' | 'operational';

const C = {
  orange:  '#F15A24',
  white:   '#FFFFFF',
  bg:      '#F4F5F7',
  dark:    '#2E2E2E',
  mid:     '#6E6E6E',
  silver:  '#BFBFBF',
  border:  '#E5E7EB',
};

const BU_OPTIONS: { key: BusinessUnit; label: string }[] = [
  { key: 'A',        label: 'BuildHawk'   },
  { key: 'B',        label: 'Homes by NH' },
  { key: 'Combined', label: 'Combined'    },
];

const now = new Date();
const dateStr = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

export default function App() {
  const [appView, setAppView]             = useState<AppView>('command');
  const [activeUnit, setActiveUnit]       = useState<BusinessUnit>('A');
  const [visible, setVisible]             = useState(true);
  const [displayUnit, setDisplayUnit]     = useState<BusinessUnit>('A');
  const [dashboardData, setDashboardData] = useState<Record<BusinessUnit, DashboardData> | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDashboardData(await fetchDashboardData());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function switchUnit(unit: BusinessUnit) {
    if (unit === activeUnit) return;
    setVisible(false);
    setTimeout(() => { setDisplayUnit(unit); setActiveUnit(unit); setVisible(true); }, 220);
  }

  const data      = dashboardData?.[displayUnit];
  const unitLabel = displayUnit === 'A' ? 'BuildHawk' : displayUnit === 'B' ? 'Homes by NH' : 'Combined';

  const kpiCards = !data ? [] : [
    { title: 'Total Leads',            value: data.kpi.totalLeads,            trend: data.kpi.totalLeadsTrend,            icon: <Users size={18} />,     format: 'number'   as const },
    { title: 'Win Rate (Decided)',      value: data.kpi.winRate,               trend: data.kpi.winRateTrend,               icon: <Percent size={18} />,   format: 'percent'  as const },
    { title: 'Pipeline Value',         value: data.kpi.pipelineValue,         trend: data.kpi.pipelineValueTrend,         icon: <TrendingUp size={18} />, format: 'currency' as const },
    { title: 'Revenue Forecast',       value: data.kpi.revenueForecast,       trend: data.kpi.revenueForecastTrend,       icon: <DollarSign size={18} />, format: 'currency' as const },
    { title: 'Open Leads',             value: data.kpi.activeProjects,        trend: data.kpi.activeProjectsTrend,        icon: <FolderOpen size={18} />, format: 'number'   as const },
    { title: 'Avg Days in Pipeline',   value: data.kpi.avgTurnaround,         trend: data.kpi.avgTurnaroundTrend,         icon: <Clock size={18} />,     format: 'days'     as const },
    { title: 'Estimator Win Rate',     value: data.kpi.estimatorProductivity, trend: data.kpi.estimatorProductivityTrend, icon: <Zap size={18} />,       format: 'percent'  as const },
    { title: 'Lead Assignment Rate',   value: data.kpi.rfqResponseRate,       trend: data.kpi.rfqResponseRateTrend,       icon: <MailCheck size={18} />, format: 'percent'  as const },
  ];

  if (appView === 'command') {
    return (
      <>
        {/* App-level switcher bar */}
        <div style={{ background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0' }}>
          {([['command', 'Command Centre'], ['operational', 'Operational Dashboard']] as [AppView, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setAppView(key)} style={{ padding: '5px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: appView === key ? '#DE5123' : 'rgba(255,255,255,0.08)', color: '#fff', transition: 'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>
        <CommandCentre />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.dark, fontFamily: 'system-ui, sans-serif' }}>

      {/* App-level switcher bar */}
      <div style={{ background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0' }}>
        {([['command', 'Command Centre'], ['operational', 'Operational Dashboard']] as [AppView, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setAppView(key as AppView)} style={{ padding: '5px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: appView === key ? '#DE5123' : 'rgba(255,255,255,0.08)', color: '#fff', transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{
        backgroundColor: C.white,
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 30,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'visible',
      }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>

          {/* Logo — overflows header for large floating look */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src="/image/logo_2.png"
              alt="BuildHawk"
              style={{
                height: 240,
                width: 'auto',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 10,
                filter: 'drop-shadow(0 8px 24px rgba(241,90,36,0.4))',
              }}
            />
            <div style={{ width: 1, height: 36, backgroundColor: C.border }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.orange,
              background: 'rgba(241,90,36,0.08)',
              padding: '4px 12px', borderRadius: 99,
              border: '1px solid rgba(241,90,36,0.2)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              Executive Dashboard
            </span>
          </div>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.silver }}>
            <span style={{ color: C.dark, fontWeight: 500 }}>Dashboard</span>
            <ChevronRight size={12} color={C.silver} />
            <span>Performance</span>
            <ChevronRight size={12} color={C.silver} />
            <span style={{ color: C.orange, fontWeight: 600 }}>
              {activeUnit === 'A' ? 'BuildHawk' : activeUnit === 'B' ? 'Homes by NH' : 'Combined'}
            </span>
          </div>

          {/* Right: date + refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: C.silver, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report Period</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{dateStr}</div>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                padding: 8, borderRadius: 8, background: C.bg,
                border: `1px solid ${C.border}`, color: C.mid,
                cursor: 'pointer', opacity: loading ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: loading ? C.orange : C.mid }} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Orange accent stripe below header ───────────── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.orange} 0%, rgba(241,90,36,0.3) 100%)` }} />

      <main style={{ maxWidth: 1600, margin: '0 auto', padding: '24px 32px' }}>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: 16, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
            <strong>Error loading data:</strong> {error}
          </div>
        )}

        {/* Page title + BU switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, margin: 0 }}>Operations Overview</h1>
            <p style={{ fontSize: 13, color: C.mid, marginTop: 4, marginBottom: 0 }}>
              Monthly performance snapshot — figures current to {dateStr}
            </p>
          </div>

          {/* Segmented control */}
          <div style={{ display: 'flex', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, gap: 2 }}>
            {BU_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchUnit(key)}
                style={{
                  padding: '9px 22px', borderRadius: 9, border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: activeUnit === key ? C.orange : 'transparent',
                  color:      activeUnit === key ? C.white  : C.mid,
                  boxShadow:  activeUnit === key ? '0 2px 8px rgba(241,90,36,0.3)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && !dashboardData ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: C.mid, fontSize: 14, gap: 8 }}>
            <RefreshCw size={16} className="animate-spin" style={{ color: C.orange }} />
            Loading data from Supabase…
          </div>
        ) : !data ? null : (
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.25s ease, transform 0.25s ease' }}>

            {/* KPI strip — 8 cards */}
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 14, marginBottom: 24 }}>
              {kpiCards.map((card, i) => (
                <KPICard key={`${displayUnit}-${card.title}`} {...card} animationDelay={i * 55} />
              ))}
            </div>

            {/* 3-column grid — columns are equal height, last card in each stretches to fill */}
            <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, alignItems: 'stretch' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <LeadPipelineHealth segments={data.leadSegments} />
                <EstimatorProductivity estimators={data.estimators} grow />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <PerformanceRisk indicators={data.riskIndicators} />
                <PipelinePerformance stages={data.pipelineStages} grow />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <ExecutiveSummary metrics={data.summaryMetrics} unitLabel={unitLabel} />
                <InsightsAlerts alerts={data.alerts} grow />
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.silver }}>
              <span>BuildHawk &copy; {now.getFullYear()} — Precision Estimating. Disciplined Delivery.</span>
              <span>Last refreshed: {now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 1200px) { .kpi-grid  { grid-template-columns: repeat(4,1fr) !important; } }
        @media (max-width: 900px)  { .kpi-grid  { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 1100px) { .main-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 700px)  { .main-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
