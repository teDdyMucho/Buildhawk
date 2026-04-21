import { useState, useEffect, useCallback } from 'react';
import {
  Users, Percent, TrendingUp, DollarSign,
  FolderOpen, Clock, Zap, MailCheck,
  Building2, ChevronRight, RefreshCw,
} from 'lucide-react';
import KPICard from './components/KPICard';
import LeadPipelineHealth from './components/LeadPipelineHealth';
import EstimatorProductivity from './components/EstimatorProductivity';
import PerformanceRisk from './components/PerformanceRisk';
import PipelinePerformance from './components/PipelinePerformance';
import ExecutiveSummary from './components/ExecutiveSummary';
import InsightsAlerts from './components/InsightsAlerts';
import { fetchDashboardData, type BusinessUnit, type DashboardData } from './data/mockData';

const BU_OPTIONS: { key: BusinessUnit; label: string }[] = [
  { key: 'A', label: 'Business Unit A' },
  { key: 'B', label: 'Business Unit B' },
  { key: 'Combined', label: 'Combined' },
];

const now = new Date();
const dateStr = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

export default function App() {
  const [activeUnit, setActiveUnit] = useState<BusinessUnit>('A');
  const [visible, setVisible] = useState(true);
  const [displayUnit, setDisplayUnit] = useState<BusinessUnit>('A');
  const [dashboardData, setDashboardData] = useState<Record<BusinessUnit, DashboardData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData();
      setDashboardData(result);
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
    setTimeout(() => {
      setDisplayUnit(unit);
      setActiveUnit(unit);
      setVisible(true);
    }, 220);
  }

  const data = dashboardData?.[displayUnit];
  const unitLabel =
    displayUnit === 'Combined' ? 'All Units' : `Unit ${displayUnit}`;

  const kpiCards = !data ? [] : [
    {
      title: 'Total Leads',
      value: data.kpi.totalLeads,
      trend: data.kpi.totalLeadsTrend,
      icon: <Users size={16} />,
      color: 'bg-blue-500',
      format: 'number' as const,
    },
    {
      title: 'Win Rate',
      value: data.kpi.winRate,
      trend: data.kpi.winRateTrend,
      icon: <Percent size={16} />,
      color: 'bg-emerald-500',
      format: 'percent' as const,
    },
    {
      title: 'Pipeline Value',
      value: data.kpi.pipelineValue,
      trend: data.kpi.pipelineValueTrend,
      icon: <TrendingUp size={16} />,
      color: 'bg-sky-500',
      format: 'currency' as const,
    },
    {
      title: 'Revenue Forecast',
      value: data.kpi.revenueForecast,
      trend: data.kpi.revenueForecastTrend,
      icon: <DollarSign size={16} />,
      color: 'bg-teal-500',
      format: 'currency' as const,
    },
    {
      title: 'Active Projects',
      value: data.kpi.activeProjects,
      trend: data.kpi.activeProjectsTrend,
      icon: <FolderOpen size={16} />,
      color: 'bg-cyan-600',
      format: 'number' as const,
    },
    {
      title: 'Avg Turnaround Time',
      value: data.kpi.avgTurnaround,
      trend: data.kpi.avgTurnaroundTrend,
      icon: <Clock size={16} />,
      color: 'bg-amber-500',
      format: 'days' as const,
    },
    {
      title: 'Estimator Productivity',
      value: data.kpi.estimatorProductivity,
      trend: data.kpi.estimatorProductivityTrend,
      icon: <Zap size={16} />,
      color: 'bg-orange-500',
      format: 'percent' as const,
    },
    {
      title: 'RFQ Response Rate',
      value: data.kpi.rfqResponseRate,
      trend: data.kpi.rfqResponseRateTrend,
      icon: <MailCheck size={16} />,
      color: 'bg-blue-600',
      format: 'percent' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Building2 size={18} className="text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900 tracking-tight">BuildHawk</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Executive Dashboard
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
            <span className="font-medium text-gray-600">Dashboard</span>
            <ChevronRight size={12} />
            <span>Performance</span>
            <ChevronRight size={12} />
            <span className="text-blue-600 font-medium">
              {activeUnit === 'Combined' ? 'All Units' : `Business Unit ${activeUnit}`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-gray-400">Report Period</div>
              <div className="text-xs font-semibold text-gray-700">{dateStr}</div>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors duration-150 disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-5">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <strong>Error loading data:</strong> {error}
          </div>
        )}

        {/* Header + BU segmented control */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Operations Overview</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Monthly performance snapshot — figures current to {dateStr}
            </p>
          </div>

          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5 self-start sm:self-auto">
            {BU_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchUnit(key)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeUnit === key
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Animated dashboard content */}
        {(loading && !dashboardData) ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading data from Supabase…
          </div>
        ) : !data ? null : (
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
          }}
        >
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
            {kpiCards.map((card, i) => (
              <KPICard
                key={`${displayUnit}-${card.title}`}
                {...card}
                animationDelay={i * 55}
              />
            ))}
          </div>

          {/* Main grid: 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT */}
            <div className="space-y-4">
              <LeadPipelineHealth segments={data.leadSegments} />
              <EstimatorProductivity estimators={data.estimators} />
            </div>

            {/* CENTER */}
            <div className="space-y-4">
              <PerformanceRisk indicators={data.riskIndicators} />
              <PipelinePerformance stages={data.pipelineStages} />
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              <ExecutiveSummary metrics={data.summaryMetrics} unitLabel={unitLabel} />
              <InsightsAlerts alerts={data.alerts} />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400">
            <span>BuildHawk &copy; {now.getFullYear()} — Executive Intelligence Platform</span>
            <span>
              Last refreshed: {now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
