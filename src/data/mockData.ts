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

interface NormRow {
  name: string;
  monetary_value: number;
  effective_probability: number;
  pipeline_stage_name: string;
  assigned_to: string;
  status: string;
  source: string;
  created_at: string;
  last_stage_change: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function isWon(s: string)  { return /^won$/i.test(s.trim()); }
function isLost(s: string) { return /^lost$/i.test(s.trim()); }
function isOpen(s: string) { return /^open$/i.test(s.trim()); }

function fmt(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function statusFromRate(rate: number, good: number, risk: number): StatusLevel {
  if (rate >= good) return 'Good';
  if (rate >= risk) return 'At Risk';
  return 'Critical';
}

function riskFromRate(rate: number, highMin: number, medMin: number): RiskLevel {
  if (rate >= highMin) return 'High';
  if (rate >= medMin)  return 'Medium';
  return 'Low';
}

// Split rows into two halves by created_at so we can compute period-over-period trends
function splitHalves(rows: NormRow[]): [NormRow[], NormRow[]] {
  if (rows.length === 0) return [[], []];
  const sorted = [...rows].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const mid = Math.floor(sorted.length / 2);
  return [sorted.slice(0, mid), sorted.slice(mid)];
}

function pctChange(prev: number, curr: number): number {
  if (prev === 0) return 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

// Win rate = won ÷ (won + lost) — open leads are undecided and excluded
function calcWinRate(rows: NormRow[]): number {
  const decided = rows.filter(r => isWon(r.status) || isLost(r.status));
  if (decided.length === 0) return 0;
  const won = decided.filter(r => isWon(r.status)).length;
  return Math.round((won / decided.length) * 1000) / 10;
}

// Avg days from created_at to last_stage_change, excluding same-day entries (< 1 day)
function calcAvgTurnaround(rows: NormRow[]): number {
  const durations = rows
    .map(r => {
      const a = Date.parse(r.created_at);
      const b = Date.parse(r.last_stage_change);
      if (isNaN(a) || isNaN(b)) return NaN;
      return (b - a) / 86_400_000;
    })
    .filter(d => !isNaN(d) && d >= 1); // exclude same-day — no meaningful data
  if (durations.length === 0) return 0;
  const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
  return Math.round(avg * 10) / 10;
}

// RFQ response rate = leads that have been assigned to someone ÷ total leads
// A lead is "responded to" when assigned_to is non-empty
function calcRfqRate(rows: NormRow[]): number {
  if (rows.length === 0) return 0;
  const assigned = rows.filter(r => r.assigned_to && r.assigned_to.trim() !== '').length;
  return Math.round((assigned / rows.length) * 1000) / 10;
}

// Estimator productivity = win rate among leads they handled
function calcEstimatorProductivity(rows: NormRow[]): number {
  const assigned = rows.filter(r => r.assigned_to && r.assigned_to.trim() !== '');
  return calcWinRate(assigned);
}

// Readable source label
function sourceLabel(raw: string): string {
  if (!raw || raw.trim() === '') return 'Direct';
  const s = raw.trim().toLowerCase();
  if (s.includes('referral'))   return 'Referral';
  if (s.includes('site-brief')) return 'Website Brief';
  if (s.includes('site-chat'))  return 'Website Chat';
  if (s.includes('site-wait'))  return 'Waitlist';
  if (s.includes('site'))       return 'Website';
  if (s.includes('lead-gen') || s.includes('lead generation')) return 'Lead Gen';
  if (s.includes('console'))    return 'Console';
  return raw.trim().replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── build dashboard from normalised rows ────────────────────────────────────

function buildDashboard(rows: NormRow[], unitLabel: string): DashboardData {
  const total          = rows.length;
  const openRows       = rows.filter(r => isOpen(r.status));
  const wonRows        = rows.filter(r => isWon(r.status));
  const decidedRows    = rows.filter(r => isWon(r.status) || isLost(r.status));

  const totalValue     = rows.reduce((s, r) => s + r.monetary_value, 0);
  const revenueForecast = rows.reduce((s, r) => s + r.monetary_value * (r.effective_probability / 100), 0);
  const activeLeads    = openRows.length;
  const winRate        = calcWinRate(rows);
  const avgTurnaround  = calcAvgTurnaround(rows);
  const rfqResponseRate = calcRfqRate(rows);
  const estimatorProductivity = calcEstimatorProductivity(rows);

  // ── Trends (current half vs prior half) ──────────────────────────────────
  const [prev, curr] = splitHalves(rows);
  const prevWin      = calcWinRate(prev);
  const currWin      = calcWinRate(curr);
  const prevForecast = prev.reduce((s, r) => s + r.monetary_value * (r.effective_probability / 100), 0);
  const currForecast = curr.reduce((s, r) => s + r.monetary_value * (r.effective_probability / 100), 0);
  const prevValue    = prev.reduce((s, r) => s + r.monetary_value, 0);
  const currValue    = curr.reduce((s, r) => s + r.monetary_value, 0);
  const prevRfq      = calcRfqRate(prev);
  const currRfq      = calcRfqRate(curr);
  const prevTurn     = calcAvgTurnaround(prev);
  const currTurn     = calcAvgTurnaround(curr);

  const kpi: KPIData = {
    totalLeads:              total,
    winRate,
    pipelineValue:           totalValue,
    revenueForecast:         Math.round(revenueForecast),
    activeProjects:          activeLeads,
    avgTurnaround,
    estimatorProductivity,
    rfqResponseRate,
    totalLeadsTrend:         pctChange(prev.length, curr.length),
    winRateTrend:            pctChange(prevWin, currWin),
    pipelineValueTrend:      pctChange(prevValue, currValue),
    revenueForecastTrend:    pctChange(prevForecast, currForecast),
    activeProjectsTrend:     pctChange(prev.filter(r => isOpen(r.status)).length, curr.filter(r => isOpen(r.status)).length),
    avgTurnaroundTrend:      pctChange(prevTurn, currTurn),
    estimatorProductivityTrend: pctChange(calcEstimatorProductivity(prev), calcEstimatorProductivity(curr)),
    rfqResponseRateTrend:    pctChange(prevRfq, currRfq),
  };

  // ── Pipeline stages ───────────────────────────────────────────────────────
  const STAGE_ORDER = [
    'New Inquiry', 'New Lead', 'Initial Call', 'Site Visit',
    'Proposal Sent', 'Pricing Consolidation', 'Proposal Accepted',
    'Pre-Construction', 'Under Construction', 'Closed', 'Lost',
  ];
  const stageMap = new Map<string, { value: number; deals: number }>();
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
  // Conversion = this stage deals ÷ first stage deals (true funnel drop-off)
  const firstStageDeals = sortedStages[0]?.[1].deals ?? 1;
  const pipelineStages: PipelineStage[] = sortedStages.map(([stage, { value, deals }]) => ({
    stage,
    value,
    deals,
    conversion: Math.round((deals / firstStageDeals) * 1000) / 10,
  }));

  // ── Estimators ────────────────────────────────────────────────────────────
  // assigned_to are GHL user IDs — we show a shortened hash label until real names are mapped
  const idLabelMap = new Map<string, string>();
  let labelCounter = 1;
  function estimatorLabel(id: string): string {
    if (!idLabelMap.has(id)) {
      idLabelMap.set(id, `Estimator ${labelCounter++}`);
    }
    return idLabelMap.get(id)!;
  }

  const estMap = new Map<string, { handled: number; won: number }>();
  for (const r of rows) {
    if (!r.assigned_to || r.assigned_to.trim() === '') continue;
    const key = r.assigned_to;
    const cur = estMap.get(key) ?? { handled: 0, won: 0 };
    estMap.set(key, { handled: cur.handled + 1, won: cur.won + (isWon(r.status) ? 1 : 0) });
  }
  const estimators: EstimatorRow[] = [...estMap.entries()]
    .sort((a, b) => b[1].handled - a[1].handled)
    .slice(0, 8)
    .map(([id, { handled, won }]) => {
      // Win rate for estimator = won ÷ handled (all their leads, consistent with overall metric)
      const efficiency = handled > 0 ? Math.round((won / handled) * 100) : 0;
      return {
        name: estimatorLabel(id),
        leadsHandled: handled,
        conversions: won,
        efficiency,
        status: statusFromRate(efficiency, 40, 25),
      };
    });

  // ── Lead segments by SOURCE (not pipeline stage) ──────────────────────────
  const segMap = new Map<string, { leads: number; value: number; won: number; lost: number }>();
  for (const r of rows) {
    const seg = sourceLabel(r.source);
    const cur = segMap.get(seg) ?? { leads: 0, value: 0, won: 0, lost: 0 };
    segMap.set(seg, {
      leads: cur.leads + 1,
      value: cur.value + r.monetary_value,
      won:   cur.won  + (isWon(r.status)  ? 1 : 0),
      lost:  cur.lost + (isLost(r.status) ? 1 : 0),
    });
  }
  const leadSegments: LeadSegment[] = [...segMap.entries()]
    .sort((a, b) => b[1].leads - a[1].leads)
    .slice(0, 6)
    .map(([segment, { leads, value, won, lost }]) => {
      const decided = won + lost;
      const wr = decided > 0 ? Math.round((won / decided) * 100) : 0;
      return { segment, leads, pipeline: value, winRate: wr, status: statusFromRate(wr, 40, 25) };
    });

  // ── Risk indicators ───────────────────────────────────────────────────────
  const riskIndicators: RiskIndicator[] = [
    {
      label: 'RFQ Response Rate',
      value: rfqResponseRate,
      level: riskFromRate(rfqResponseRate, 80, 60),
      description: rfqResponseRate >= 80
        ? `${rfqResponseRate}% of leads have been assigned — within SLA`
        : rfqResponseRate >= 60
        ? `${rfqResponseRate}% of leads assigned — below 80% target, monitor closely`
        : `${rfqResponseRate}% of leads assigned — significantly below 80% target, action needed`,
    },
    {
      label: 'Win Rate (Decided)',
      value: winRate,
      level: riskFromRate(winRate, 40, 25),
      description: decidedRows.length === 0
        ? 'No won/lost leads yet to calculate win rate'
        : winRate >= 40
        ? `${winRate}% on ${decidedRows.length} decided leads — meeting target`
        : winRate >= 25
        ? `${winRate}% on ${decidedRows.length} decided leads — below 40% target`
        : `${winRate}% on ${decidedRows.length} decided leads — well below target, review bid strategy`,
    },
    {
      label: 'Avg Days in Pipeline',
      value: avgTurnaround,
      level: avgTurnaround === 0 ? 'Medium' : avgTurnaround <= 7 ? 'High' : avgTurnaround <= 14 ? 'Medium' : 'Low',
      description: avgTurnaround === 0
        ? 'Insufficient data — all leads resolved same day or no date recorded'
        : avgTurnaround <= 7
        ? `${avgTurnaround}d avg — leads moving efficiently through pipeline`
        : `${avgTurnaround}d avg — leads taking longer than 7-day benchmark`,
    },
  ];

  // ── Alerts ────────────────────────────────────────────────────────────────
  const alerts: Alert[] = [];

  if (rfqResponseRate < 60) {
    alerts.push({ type: 'danger', title: 'RFQ Assignment Rate Critical', description: `Only ${rfqResponseRate}% of leads assigned to an estimator. ${Math.round(total * (1 - rfqResponseRate / 100))} leads unassigned — escalate immediately.` });
  } else if (rfqResponseRate < 80) {
    alerts.push({ type: 'warning', title: 'RFQ Assignment Below Target', description: `${rfqResponseRate}% of leads assigned vs 80% target. ${Math.round(total * (1 - rfqResponseRate / 100))} leads still unassigned.` });
  }

  if (decidedRows.length > 0 && winRate < 25) {
    alerts.push({ type: 'danger', title: 'Win Rate Critical', description: `${unitLabel} win rate at ${winRate}% (${wonRows.length} won of ${decidedRows.length} decided). Review pricing and proposal quality.` });
  } else if (decidedRows.length > 0 && winRate < 40) {
    alerts.push({ type: 'warning', title: 'Win Rate Below Target', description: `${unitLabel} win rate at ${winRate}% vs 40% target (${wonRows.length} won of ${decidedRows.length} decided).` });
  }

  if (avgTurnaround > 14) {
    alerts.push({ type: 'warning', title: 'Long Pipeline Duration', description: `Average ${avgTurnaround} days per lead — exceeding 14-day benchmark. Review stage blockers.` });
  }

  const unassigned = rows.filter(r => isOpen(r.status) && (!r.assigned_to || r.assigned_to.trim() === '')).length;
  if (unassigned > 0) {
    alerts.push({ type: 'warning', title: `${unassigned} Open Lead${unassigned > 1 ? 's' : ''} Unassigned`, description: `${unassigned} active open lead${unassigned > 1 ? 's have' : ' has'} no estimator assigned.` });
  }

  if (alerts.length === 0) {
    alerts.push({ type: 'info', title: 'Performance On Track', description: `${unitLabel} all key metrics within acceptable thresholds.` });
  }

  // ── Summary metrics ───────────────────────────────────────────────────────
  const summaryMetrics: SummaryMetric[] = [
    { label: 'Revenue Forecast',   value: fmt(revenueForecast),  sub: 'Probability-weighted' },
    { label: 'Pipeline Value',     value: fmt(totalValue),        sub: `${total} total leads` },
    { label: 'Open Leads',         value: String(activeLeads),    sub: `${total - activeLeads} closed` },
    { label: 'Win Rate',           value: decidedRows.length > 0 ? `${winRate}%` : 'N/A', sub: `${wonRows.length} won / ${decidedRows.length} decided` },
    { label: 'Avg Pipeline Days',  value: avgTurnaround > 0 ? `${avgTurnaround}d` : 'N/A', sub: 'Days to stage change' },
  ];

  return { kpi, leadSegments, estimators, riskIndicators, pipelineStages, summaryMetrics, alerts };
}

// ─── combine two units ────────────────────────────────────────────────────────

function buildCombined(a: DashboardData, b: DashboardData): DashboardData {
  const totalLeads    = a.kpi.totalLeads + b.kpi.totalLeads;
  const totalValue    = a.kpi.pipelineValue + b.kpi.pipelineValue;
  const totalForecast = a.kpi.revenueForecast + b.kpi.revenueForecast;
  const activeLeads   = a.kpi.activeProjects + b.kpi.activeProjects;

  // Weighted win rate across both units
  const aDecided = a.kpi.totalLeads; // approx — we blend via weighted avg
  const bDecided = b.kpi.totalLeads;
  const winRate = (aDecided + bDecided) > 0
    ? Math.round(((a.kpi.winRate * aDecided + b.kpi.winRate * bDecided) / (aDecided + bDecided)) * 10) / 10
    : 0;

  const rfqResponseRate = Math.round(((a.kpi.rfqResponseRate * a.kpi.totalLeads + b.kpi.rfqResponseRate * b.kpi.totalLeads) / Math.max(totalLeads, 1)) * 10) / 10;
  const estimatorProductivity = Math.round(((a.kpi.estimatorProductivity + b.kpi.estimatorProductivity) / 2) * 10) / 10;
  const avgTurnaround = Math.round(((a.kpi.avgTurnaround + b.kpi.avgTurnaround) / 2) * 10) / 10;

  const kpi: KPIData = {
    totalLeads, winRate, pipelineValue: totalValue, revenueForecast: totalForecast,
    activeProjects: activeLeads, avgTurnaround, estimatorProductivity, rfqResponseRate,
    totalLeadsTrend:            pctChange(a.kpi.totalLeads, b.kpi.totalLeads),
    winRateTrend:               pctChange(a.kpi.winRate, b.kpi.winRate),
    pipelineValueTrend:         pctChange(a.kpi.pipelineValue, b.kpi.pipelineValue),
    revenueForecastTrend:       pctChange(a.kpi.revenueForecast, b.kpi.revenueForecast),
    activeProjectsTrend:        pctChange(a.kpi.activeProjects, b.kpi.activeProjects),
    avgTurnaroundTrend:         pctChange(a.kpi.avgTurnaround, b.kpi.avgTurnaround),
    estimatorProductivityTrend: pctChange(a.kpi.estimatorProductivity, b.kpi.estimatorProductivity),
    rfqResponseRateTrend:       pctChange(a.kpi.rfqResponseRate, b.kpi.rfqResponseRate),
  };

  // Merge lead segments
  const segMap = new Map<string, LeadSegment>();
  for (const seg of [...a.leadSegments, ...b.leadSegments]) {
    const ex = segMap.get(seg.segment);
    if (ex) {
      const leads = ex.leads + seg.leads;
      const wonA  = Math.round(ex.winRate / 100 * ex.leads);
      const wonB  = Math.round(seg.winRate / 100 * seg.leads);
      const wr    = leads > 0 ? Math.round(((wonA + wonB) / leads) * 100) : 0;
      segMap.set(seg.segment, { segment: seg.segment, leads, pipeline: ex.pipeline + seg.pipeline, winRate: wr, status: statusFromRate(wr, 40, 25) });
    } else {
      segMap.set(seg.segment, { ...seg });
    }
  }

  // Merge estimators (tag with unit)
  const estimators: EstimatorRow[] = [
    ...a.estimators.map(e => ({ ...e, name: `${e.name} (A)` })),
    ...b.estimators.map(e => ({ ...e, name: `${e.name} (B)` })),
  ].sort((x, y) => y.leadsHandled - x.leadsHandled).slice(0, 10);

  // Merge pipeline stages
  const stageMap = new Map<string, PipelineStage>();
  for (const s of [...a.pipelineStages, ...b.pipelineStages]) {
    const ex = stageMap.get(s.stage);
    if (ex) stageMap.set(s.stage, { stage: s.stage, value: ex.value + s.value, deals: ex.deals + s.deals, conversion: 0 });
    else     stageMap.set(s.stage, { ...s });
  }
  const firstDeals = Math.max(...[...stageMap.values()].map(s => s.deals), 1);
  const pipelineStages = [...stageMap.values()]
    .map(s => ({ ...s, conversion: Math.round((s.deals / firstDeals) * 1000) / 10 }));

  const riskIndicators: RiskIndicator[] = [
    {
      label: 'RFQ Response Rate',
      value: rfqResponseRate,
      level: rfqResponseRate >= 80 ? 'High' : rfqResponseRate >= 60 ? 'Medium' : 'Low',
      description: `Combined — A: ${a.kpi.rfqResponseRate}%, B: ${b.kpi.rfqResponseRate}%`,
    },
    {
      label: 'Win Rate (Decided)',
      value: winRate,
      level: winRate >= 40 ? 'High' : winRate >= 25 ? 'Medium' : 'Low',
      description: `Combined win rate — A: ${a.kpi.winRate}%, B: ${b.kpi.winRate}%`,
    },
    {
      label: 'Avg Days in Pipeline',
      value: avgTurnaround,
      level: avgTurnaround <= 7 ? 'High' : avgTurnaround <= 14 ? 'Medium' : 'Low',
      description: `Combined average — A: ${a.kpi.avgTurnaround}d, B: ${b.kpi.avgTurnaround}d`,
    },
  ];

  const alerts: Alert[] = [];
  if (b.kpi.rfqResponseRate < a.kpi.rfqResponseRate - 10) {
    alerts.push({ type: 'warning', title: 'Unit B Assignment Rate Lagging', description: `Unit B at ${b.kpi.rfqResponseRate}% vs Unit A at ${a.kpi.rfqResponseRate}%.` });
  }
  if (winRate < 25) {
    alerts.push({ type: 'danger', title: 'Combined Win Rate Critical', description: `Combined win rate ${winRate}% vs 40% target. Review both units urgently.` });
  } else if (winRate < 40) {
    alerts.push({ type: 'warning', title: 'Combined Win Rate Below Target', description: `Combined win rate ${winRate}% vs 40% goal.` });
  }
  if (b.kpi.winRate < a.kpi.winRate - 10) {
    alerts.push({ type: 'info', title: 'Unit A Outperforming on Win Rate', description: `Unit A: ${a.kpi.winRate}% vs Unit B: ${b.kpi.winRate}% — consider knowledge transfer.` });
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'info', title: 'Combined Performance On Track', description: 'Both units meeting key thresholds.' });
  }

  const summaryMetrics: SummaryMetric[] = [
    { label: 'Revenue Forecast',  value: fmt(totalForecast), sub: 'Combined, probability-weighted' },
    { label: 'Pipeline Value',    value: fmt(totalValue),    sub: 'Both units' },
    { label: 'Open Leads',        value: String(activeLeads), sub: `of ${totalLeads} total` },
    { label: 'Win Rate',          value: `${winRate}%`,      sub: 'Combined decided leads' },
    { label: 'Avg Pipeline Days', value: avgTurnaround > 0 ? `${avgTurnaround}d` : 'N/A', sub: 'Combined average' },
  ];

  return {
    kpi, leadSegments: [...segMap.values()].sort((a, b) => b.leads - a.leads),
    estimators, riskIndicators, pipelineStages, summaryMetrics, alerts,
  };
}

// ─── normalise raw rows ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseA(r: any): NormRow {
  return {
    name:                String(r.name ?? ''),
    monetary_value:      Number(r.monetary_value ?? 0),
    effective_probability: Number(r.effective_probability ?? 0),
    pipeline_stage_name: String(r.pipeline_stage_name ?? ''),
    assigned_to:         String(r.assigned_to ?? ''),
    status:              String(r.status ?? ''),
    source:              String(r.source ?? ''),
    created_at:          String(r.created_at ?? ''),
    last_stage_change:   String(r.last_stage_change ?? ''),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseB(r: any): NormRow {
  return {
    name:                String(r.name ?? ''),
    monetary_value:      Number(r.monetaryValue ?? r.monetary_value ?? 0),
    effective_probability: Number(r.effective_probability ?? 0),
    pipeline_stage_name: String(r.pipeline_stage_name ?? r.pipeline_stage_Id ?? ''),
    assigned_to:         String(r.assigned_to ?? ''),
    status:              String(r.status ?? ''),
    source:              String(r.source ?? ''),
    created_at:          String(r.created_at ?? ''),
    last_stage_change:   String(r.last_stage_change ?? ''),
  };
}

// ─── fetch ────────────────────────────────────────────────────────────────────

export async function fetchDashboardData(): Promise<Record<BusinessUnit, DashboardData>> {
  const [
    { data: rawWorkflow,  error: eWorkflow  },
    { data: rawLeadQual,  error: eLeadQual  },
    { data: rawSales,     error: eSales     },
    { data: rawContract,  error: eContract  },
    { data: rawEstPipe,   error: eEstPipe   },
    { data: rawRFQ,       error: eRFQ       },
  ] = await Promise.all([
    supabase.from('estimating_workflow_pipeline').select('*'),
    supabase.from('lead_qualification_pipeline').select('*'),
    supabase.from('Sales_&_Project_Pipeline').select('*'),
    supabase.from('Contract_Administration').select('*'),
    supabase.from('Estimating_Pipeline').select('*'),
    supabase.from('RFQ_Pipeline').select('*'),
  ]);

  if (eWorkflow) console.warn('estimating_workflow_pipeline:', eWorkflow.message);
  if (eLeadQual) console.warn('lead_qualification_pipeline:', eLeadQual.message);
  if (eSales)    console.warn('Sales_&_Project_Pipeline:', eSales.message);
  if (eContract) console.warn('Contract_Administration:', eContract.message);
  if (eEstPipe)  console.warn('Estimating_Pipeline:', eEstPipe.message);
  if (eRFQ)      console.warn('RFQ_Pipeline:', eRFQ.message);

  // Unit A = BuildHawk: estimating_workflow_pipeline + lead_qualification_pipeline
  const rowsA: NormRow[] = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((rawWorkflow as any[]) ?? []).map(normaliseB),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((rawLeadQual as any[]) ?? []).map(normaliseA),
  ];

  // Unit B = Homes by NH: Sales_&_Project_Pipeline + Contract_Administration + Estimating_Pipeline + RFQ_Pipeline
  const rowsB: NormRow[] = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((rawSales    as any[]) ?? []).map(normaliseA),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((rawContract as any[]) ?? []).map(normaliseA),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((rawEstPipe  as any[]) ?? []).map(normaliseA),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((rawRFQ      as any[]) ?? []).map(normaliseA),
  ];

  const unitA    = buildDashboard(rowsA, 'BuildHawk');
  const unitB    = buildDashboard(rowsB, 'Homes by NH');
  const combined = buildCombined(unitA, unitB);

  return { A: unitA, B: unitB, Combined: combined };
}
