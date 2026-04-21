import type { LeadSegment } from '../data/mockData';
import StatusBadge from './StatusBadge';

interface Props {
  segments: LeadSegment[];
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function LeadPipelineHealth({ segments }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">Lead &amp; Pipeline Health</h3>
        <p className="text-xs text-gray-400 mt-0.5">Segment performance vs targets</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Segment</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Leads</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Pipeline</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Win Rate</th>
              <th className="text-center px-4 py-2.5 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {segments.map((s) => (
              <tr key={s.segment} className="hover:bg-gray-50/60 transition-colors duration-150">
                <td className="px-4 py-3 font-medium text-gray-800">{s.segment}</td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{s.leads}</td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums font-medium">{formatCurrency(s.pipeline)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className={`font-semibold ${s.winRate >= 35 ? 'text-emerald-600' : s.winRate >= 25 ? 'text-amber-600' : 'text-red-500'}`}>
                    {s.winRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
