import { supabase } from '../lib/supabaseClient';

export type BusinessUnit = 'A' | 'B' | 'Combined';
export type StatusLevel = 'Good' | 'At Risk' | 'Critical';
export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface KPIData {
  totalLeads: number;
  winRate: number;
  pipelineValue: number;
  revenueForecast: number;
  activeProjects: number;
  avgTurnaround: number;
  estimatorProductivity: number;
  rfqResponseRate: number;
  totalLeadsTrend: number;
  winRateTrend: number;
  pipelineValueTrend: number;
  revenueForecastTrend: number;
  activeProjectsTrend: number;
  avgTurnaroundTrend: number;
  estimatorProductivityTrend: number;
  rfqResponseRateTrend: number;
}

export interface LeadSegment {
  segment: string;
  leads: number;
  pipeline: number;
  winRate: number;
  status: StatusLevel;
}

export interface EstimatorRow {
  name: string;
  leadsHandled: number;
  conversions: number;
  efficiency: number;
  status: StatusLevel;
}

export interface RiskIndicator {
  label: string;
  value: number;
  level: RiskLevel;
  description: string;
}

export interface PipelineStage {
  stage: string;
  value: number;
  deals: number;
  conversion: number;
}

export interface SummaryMetric {
  label: string;
  value: string;
  sub?: string;
}

export interface Alert {
  type: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
}

export interface DashboardData {
  kpi: KPIData;
  leadSegments: LeadSegment[];
  estimators: EstimatorRow[];
  riskIndicators: RiskIndicator[];
  pipelineStages: PipelineStage[];
  summaryMetrics: SummaryMetric[];
  alerts: Alert[];
}

// Normalised row shape used internally after mapping from either table
interface NormRow {
  monetary_value: number;
  effective_probability: number;
  pipeline_stage_name: string;
  assigned_to: string;
  status: string;
  created_at: string;
  last_stage_change: string;
}

function statusFromRate(rate: number, good: number, risk: number): StatusLevel {
  if (rate >= good) return 'Good';
  if (rate >= risk) return 'At Risk';
  return 'Critical';
}

function riskFromRate(rate: number, highMin: number, medMin: number): RiskLevel {
  if (rate >= highMin) return 'High';
  if (rate >= medMin) return 'Medium';
  return 'Low';
}

function fmt(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function isWon(status: string) { return /^won$/i.test(status.trim()); }
function isOpen(status: string) { return /^open$/i.test(status.trim()); }

function avgDaysBetween(rows: NormRow[]): number {
  const valid = rows
    .map(r => {
      const a = r.created_at ? Date.parse(r.created_at) : NaN;
      const b = r.last_stage_change ? Date.parse(r.last_stage_change) : NaN;
      return isNaN(a) || isNaN(b) ? NaN : Math.abs(b - a) / 86_400_000;
    })
    .filter(d => !isNaN(d));
  if (valid.length === 0) return 0;
  return Math.round((valid.reduce((s, d) => s + d, 0) / valid.length) * 10) / 10;
}

function buildDashboard(rows: NormRow[], unitLabel: string): DashboardData {
  const total = rows.length;
  const totalValue = rows.reduce((s, r) => s + r.monetary_value, 0);
  const wonRows = rows.filter(r => isWon(r.status));
  const winRate = total > 0 ? Math.round((wonRows.length / total) * 1000) / 10 : 0;
  const revenueForecast = rows.reduce((s, r) => s + r.monetary_value * (r.effective_probability / 100), 0);
  const activeProjects = rows.filter(r => isOpen(r.status)).length;
  const avgTurnaround = avgDaysBetween(rows);

  // Avg effective_probability as estimator productivity proxy
  const avgProb = total > 0 ? rows.reduce((s, r) => s + r.effective_probability, 0) / total : 0;
  const estimatorProductivity = Math.round(avgProb);

  // RFQ response rate = % of rows with a non-empty status
  const responded = rows.filter(r => r.status.trim() !== '').length;
  const rfqResponseRate = total > 0 ? Math.round((responded / total) * 1000) / 10 : 0;

  // Pipeline stages — grouped by pipeline_stage_name
  const stageMap = new Map<string, { value: number; deals: number }>();
  const STAGE_ORDER = ['Inquiry / Lead', 'New Lead', 'Proposal Sent', 'Under Review', 'Negotiation', 'Closed Won', 'Won'];
  for (const r of rows) {
    const stage = r.pipeline_stage_name || 'Unknown';
    const cur = stageMap.get(stage) ?? { value: 0, deals: 0 };
    stageMap.set(stage, { value: cur.value + r.monetary_value, deals: cur.deals + 1 });
  }
  const sortedStages = [...stageMap.entries()].sort((a, b) => {
    const ai = STAGE_ORDER.indexOf(a[0]);
    const bi = STAGE_ORDER.indexOf(b[0]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  const maxDeals = sortedStages[0]?.[1].deals ?? 1;
  const pipelineStages: PipelineStage[] = sortedStages.map(([stage, { value, deals }]) => ({
    stage,
    value,
    deals,
    conversion: Math.round((deals / maxDeals) * 1000) / 10,
  }));

  // Estimators — grouped by assigned_to
  const estMap = new Map<string, { handled: number; won: number }>();
  for (const r of rows) {
    const key = r.assigned_to || 'Unassigned';
    const cur = estMap.get(key) ?? { handled: 0, won: 0 };
    estMap.set(key, { handled: cur.handled + 1, won: cur.won + (isWon(r.status) ? 1 : 0) });
  }
  const estimators: EstimatorRow[] = [...estMap.entries()]
    .sort((a, b) => b[1].handled - a[1].handled)
    .slice(0, 8)
    .map(([name, { handled, won }]) => {
      const efficiency = handled > 0 ? Math.round((won / handled) * 100) : 0;
      return { name, leadsHandled: handled, conversions: won, efficiency, status: statusFromRate(efficiency, 70, 50) };
    });

  // Lead segments — grouped by pipeline_stage_name
  const segMap = new Map<string, { leads: number; value: number; won: number }>();
  for (const r of rows) {
    const seg = r.pipeline_stage_name || 'Other';
    const cur = segMap.get(seg) ?? { leads: 0, value: 0, won: 0 };
    segMap.set(seg, { leads: cur.leads + 1, value: cur.value + r.monetary_value, won: cur.won + (isWon(r.status) ? 1 : 0) });
  }
  const leadSegments: LeadSegment[] = [...segMap.entries()]
    .sort((a, b) => b[1].leads - a[1].leads)
    .slice(0, 6)
    .map(([segment, { leads, value, won }]) => {
      const wr = leads > 0 ? Math.round((won / leads) * 100) : 0;
      return { segment, leads, pipeline: value, winRate: wr, status: statusFromRate(wr, 35, 20) };
    });

  const kpi: KPIData = {
    totalLeads: total,
    winRate,
    pipelineValue: totalValue,
    revenueForecast: Math.round(revenueForecast),
    activeProjects,
    avgTurnaround,
    estimatorProductivity,
    rfqResponseRate,
    totalLeadsTrend: 0,
    winRateTrend: 0,
    pipelineValueTrend: 0,
    revenueForecastTrend: 0,
    activeProjectsTrend: 0,
    avgTurnaroundTrend: 0,
    estimatorProductivityTrend: 0,
    rfqResponseRateTrend: 0,
  };

  const riskIndicators: RiskIndicator[] = [
    {
      label: 'RFQ Response Rate',
      value: rfqResponseRate,
      level: riskFromRate(rfqResponseRate, 85, 70),
      description: rfqResponseRate >= 90
        ? 'Responding within SLA target of 90%'
        : rfqResponseRate >= 70
        ? 'Below 90% SLA — monitor closely'
        : 'Significantly below 90% SLA — immediate action needed',
    },
    {
      label: 'Win Rate Performance',
      value: winRate,
      level: riskFromRate(winRate, 38, 28),
      description: winRate >= 40
        ? 'Meeting or exceeding 40% target'
        : winRate >= 30
        ? 'Slightly below 40% target threshold'
        : 'Well below 40% target — pipeline quality concern',
    },
    {
      label: 'Avg Turnaround',
      value: avgTurnaround,
      level: avgTurnaround === 0 ? 'Medium' : avgTurnaround <= 5 ? 'High' : avgTurnaround <= 8 ? 'Medium' : 'Low',
      description: avgTurnaround === 0
        ? 'Insufficient data to calculate turnaround'
        : avgTurnaround <= 5
        ? `${avgTurnaround}d avg — within 5-day benchmark`
        : `${avgTurnaround}d avg — exceeding 5-day benchmark`,
    },
  ];

  const alerts: Alert[] = [];
  if (rfqResponseRate < 80) {
    alerts.push({ type: 'danger', title: 'RFQ Response Rate Critical', description: `At ${rfqResponseRate}% — well below 90% SLA. Escalate to operations.` });
  } else if (rfqResponseRate < 90) {
    alerts.push({ type: 'warning', title: 'RFQ Response Rate Below SLA', description: `At ${rfqResponseRate}% — needs improvement to reach 90% target.` });
  }
  if (winRate < 30) {
    alerts.push({ type: 'danger', title: 'Win Rate Below Target', description: `${unitLabel} win rate at ${winRate}% vs 40% target. Review bid strategy.` });
  } else if (winRate < 38) {
    alerts.push({ type: 'warning', title: 'Win Rate Below Target', description: `${unitLabel} win rate at ${winRate}% — slightly below 40% goal.` });
  }
  if (avgTurnaround > 5) {
    alerts.push({ type: 'warning', title: 'High Average Turnaround', description: `At ${avgTurnaround} days — exceeding the 5-day benchmark.` });
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'info', title: 'Performance On Track', description: `${unitLabel} metrics are within acceptable thresholds.` });
  }

  const summaryMetrics: SummaryMetric[] = [
    { label: 'Revenue Forecast', value: fmt(revenueForecast), sub: 'This Month' },
    { label: 'Pipeline Value', value: fmt(totalValue), sub: 'Active' },
    { label: 'Active Projects', value: String(activeProjects), sub: 'Open Leads' },
    { label: 'Win Rate', value: `${winRate}%`, sub: 'Closed Won' },
    { label: 'Total Leads', value: String(total), sub: 'In Pipeline' },
  ];

  return { kpi, leadSegments, estimators, riskIndicators, pipelineStages, summaryMetrics, alerts };
}

function buildCombined(a: DashboardData, b: DashboardData): DashboardData {
  const totalLeads = a.kpi.totalLeads + b.kpi.totalLeads;
  const totalValue = a.kpi.pipelineValue + b.kpi.pipelineValue;
  const totalForecast = a.kpi.revenueForecast + b.kpi.revenueForecast;
  const winRate = totalLeads > 0
    ? Math.round(((a.kpi.winRate * a.kpi.totalLeads + b.kpi.winRate * b.kpi.totalLeads) / totalLeads) * 10) / 10
    : 0;
  const rfqResponseRate = Math.round(((a.kpi.rfqResponseRate + b.kpi.rfqResponseRate) / 2) * 10) / 10;
  const estimatorProductivity = Math.round((a.kpi.estimatorProductivity + b.kpi.estimatorProductivity) / 2);
  const avgTurnaround = Math.round(((a.kpi.avgTurnaround + b.kpi.avgTurnaround) / 2) * 10) / 10;
  const activeProjects = a.kpi.activeProjects + b.kpi.activeProjects;

  const kpi: KPIData = {
    totalLeads,
    winRate,
    pipelineValue: totalValue,
    revenueForecast: totalForecast,
    activeProjects,
    avgTurnaround,
    estimatorProductivity,
    rfqResponseRate,
    totalLeadsTrend: 0, winRateTrend: 0, pipelineValueTrend: 0,
    revenueForecastTrend: 0, activeProjectsTrend: 0, avgTurnaroundTrend: 0,
    estimatorProductivityTrend: 0, rfqResponseRateTrend: 0,
  };

  // Merge lead segments
  const segMap = new Map<string, LeadSegment>();
  for (const seg of [...a.leadSegments, ...b.leadSegments]) {
    const ex = segMap.get(seg.segment);
    if (ex) {
      const leads = ex.leads + seg.leads;
      const wonA = Math.round(ex.winRate / 100 * ex.leads);
      const wonB = Math.round(seg.winRate / 100 * seg.leads);
      const wr = leads > 0 ? Math.round(((wonA + wonB) / leads) * 100) : 0;
      segMap.set(seg.segment, { segment: seg.segment, leads, pipeline: ex.pipeline + seg.pipeline, winRate: wr, status: statusFromRate(wr, 35, 20) });
    } else {
      segMap.set(seg.segment, { ...seg });
    }
  }

  // Merge estimators (tag with unit label to distinguish)
  const estimators: EstimatorRow[] = [
    ...a.estimators.map(e => ({ ...e, name: `${e.name} (A)` })),
    ...b.estimators.map(e => ({ ...e, name: `${e.name} (B)` })),
  ].sort((x, y) => y.leadsHandled - x.leadsHandled).slice(0, 10);

  // Merge pipeline stages
  const stageMap = new Map<string, PipelineStage>();
  for (const s of [...a.pipelineStages, ...b.pipelineStages]) {
    const ex = stageMap.get(s.stage);
    if (ex) {
      stageMap.set(s.stage, { stage: s.stage, value: ex.value + s.value, deals: ex.deals + s.deals, conversion: 0 });
    } else {
      stageMap.set(s.stage, { ...s });
    }
  }
  const maxDeals = Math.max(...[...stageMap.values()].map(s => s.deals), 1);
  const pipelineStages = [...stageMap.values()]
    .map(s => ({ ...s, conversion: Math.round((s.deals / maxDeals) * 1000) / 10 }));

  const riskIndicators: RiskIndicator[] = [
    {
      label: 'RFQ Response Rate',
      value: rfqResponseRate,
      level: riskFromRate(rfqResponseRate, 85, 70),
      description: `Combined average across both units — A: ${a.kpi.rfqResponseRate}%, B: ${b.kpi.rfqResponseRate}%`,
    },
    {
      label: 'Win Rate Performance',
      value: winRate,
      level: riskFromRate(winRate, 38, 28),
      description: `Combined win rate — A: ${a.kpi.winRate}%, B: ${b.kpi.winRate}%`,
    },
    {
      label: 'Avg Turnaround',
      value: avgTurnaround,
      level: avgTurnaround <= 5 ? 'High' : avgTurnaround <= 8 ? 'Medium' : 'Low',
      description: `Combined average — A: ${a.kpi.avgTurnaround}d, B: ${b.kpi.avgTurnaround}d`,
    },
  ];

  const alerts: Alert[] = [];
  if (b.kpi.rfqResponseRate < a.kpi.rfqResponseRate - 5) {
    alerts.push({ type: 'warning', title: 'Unit B RFQ Rate Lagging', description: `Unit B at ${b.kpi.rfqResponseRate}% vs Unit A at ${a.kpi.rfqResponseRate}%.` });
  }
  if (winRate < 35) {
    alerts.push({ type: 'warning', title: 'Combined Win Rate Below Target', description: `Combined win rate ${winRate}% vs 40% goal. Review both units.` });
  }
  if (b.kpi.winRate < a.kpi.winRate - 5) {
    alerts.push({ type: 'info', title: 'Unit A Outperforming on Win Rate', description: `Unit A: ${a.kpi.winRate}% vs Unit B: ${b.kpi.winRate}% — consider knowledge transfer.` });
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'info', title: 'Combined Performance On Track', description: 'Both units are meeting key performance thresholds.' });
  }

  const summaryMetrics: SummaryMetric[] = [
    { label: 'Revenue Forecast', value: fmt(totalForecast), sub: 'Combined' },
    { label: 'Pipeline Value', value: fmt(totalValue), sub: 'Both Units' },
    { label: 'Active Projects', value: String(activeProjects), sub: 'Open Leads' },
    { label: 'Win Rate', value: `${winRate}%`, sub: 'Combined' },
    { label: 'Total Leads', value: String(totalLeads), sub: 'Both Units' },
  ];

  return {
    kpi,
    leadSegments: [...segMap.values()].sort((a, b) => b.leads - a.leads),
    estimators,
    riskIndicators,
    pipelineStages,
    summaryMetrics,
    alerts,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseUnitA(r: any): NormRow {
  return {
    monetary_value: Number(r.monetary_value ?? 0),
    effective_probability: Number(r.effective_probability ?? 0),
    pipeline_stage_name: String(r.pipeline_stage_name ?? ''),
    assigned_to: String(r.assigned_to ?? ''),
    status: String(r.status ?? ''),
    created_at: String(r.created_at ?? ''),
    last_stage_change: String(r.last_stage_change ?? ''),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseUnitB(r: any): NormRow {
  return {
    monetary_value: Number(r.monetaryValue ?? r.monetary_value ?? 0),
    effective_probability: Number(r.effective_probability ?? 0),
    pipeline_stage_name: String(r.pipeline_stage_name ?? r.pipeline_stage_Id ?? ''),
    assigned_to: String(r.assigned_to ?? ''),
    status: String(r.status ?? ''),
    created_at: String(r.created_at ?? ''),
    last_stage_change: String(r.last_stage_change ?? ''),
  };
}

export async function fetchDashboardData(): Promise<Record<BusinessUnit, DashboardData>> {
  const [{ data: rawA, error: errA }, { data: rawB, error: errB }] = await Promise.all([
    supabase.from('lead_qualification_pipeline').select('*'),
    supabase.from('estimating_workflow_pipeline').select('*'),
  ]);

  if (errA) throw new Error(`Unit A fetch failed: ${errA.message}`);
  if (errB) throw new Error(`Unit B fetch failed: ${errB.message}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsA: NormRow[] = ((rawA as any[]) ?? []).map(normaliseUnitA);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsB: NormRow[] = ((rawB as any[]) ?? []).map(normaliseUnitB);

  const unitA = buildDashboard(rowsA, 'Unit A');
  const unitB = buildDashboard(rowsB, 'Unit B');
  const combined = buildCombined(unitA, unitB);

  return { A: unitA, B: unitB, Combined: combined };
}
