import type { EstimatorRow } from '../data/mockData';
import StatusBadge from './StatusBadge';

interface Props {
  estimators: EstimatorRow[];
}

export default function EstimatorProductivity({ estimators }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">Estimator Productivity</h3>
        <p className="text-xs text-gray-400 mt-0.5">Individual performance overview</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Estimator</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Leads</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Conversions</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Efficiency</th>
              <th className="text-center px-4 py-2.5 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {estimators.map((e) => (
              <tr key={e.name} className="hover:bg-gray-50/60 transition-colors duration-150">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                      {e.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-gray-800 truncate">{e.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{e.leadsHandled}</td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{e.conversions}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${e.efficiency >= 80 ? 'bg-emerald-500' : e.efficiency >= 65 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${e.efficiency}%`, transition: 'width 0.6s ease' }}
                      />
                    </div>
                    <span className={`font-semibold tabular-nums ${e.efficiency >= 80 ? 'text-emerald-600' : e.efficiency >= 65 ? 'text-amber-600' : 'text-red-500'}`}>
                      {e.efficiency}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
