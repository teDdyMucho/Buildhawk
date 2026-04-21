import type { PipelineStage } from '../data/mockData';

interface Props {
  stages: PipelineStage[];
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const stageColors = [
  'bg-blue-500',
  'bg-blue-400',
  'bg-sky-400',
  'bg-cyan-400',
  'bg-emerald-500',
];

export default function PipelinePerformance({ stages }: Props) {
  const maxValue = Math.max(...stages.map(s => s.value));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">Pipeline Performance</h3>
        <p className="text-xs text-gray-400 mt-0.5">Stage-by-stage funnel breakdown</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Stage</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Value</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Deals</th>
              <th className="text-left px-4 py-2.5 text-gray-500 font-medium w-28">Progress</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Conv.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {stages.map((s, i) => (
              <tr key={s.stage} className="hover:bg-gray-50/60 transition-colors duration-150">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stageColors[i]}`} />
                    <span className="font-medium text-gray-800">{s.stage}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800 tabular-nums">{formatCurrency(s.value)}</td>
                <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{s.deals}</td>
                <td className="px-4 py-3">
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${stageColors[i]}`}
                      style={{ width: `${(s.value / maxValue) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className={`font-semibold ${s.conversion >= 70 ? 'text-emerald-600' : s.conversion >= 50 ? 'text-amber-600' : 'text-blue-600'}`}>
                    {s.conversion.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
