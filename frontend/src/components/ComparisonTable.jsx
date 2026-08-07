const getScoreStyle = (scoreStr) => {
  const val = parseFloat(String(scoreStr).replace(/[^\d.]/g, ''));
  if (isNaN(val)) return { ring: 'border-indigo-400 text-indigo-600 bg-indigo-50' };
  if (val >= 80) return { ring: 'border-emerald-500 text-emerald-700 bg-emerald-50' };
  if (val >= 60) return { ring: 'border-amber-500 text-amber-700 bg-amber-50' };
  return { ring: 'border-red-400 text-red-700 bg-red-50' };
};

const ScoreRing = ({ score }) => {
  const { ring } = getScoreStyle(score);
  const display = score ? String(score).replace('.0', '') : '—';
  return (
    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-bold text-xs mx-auto transition-all ${ring}`}>
      {display}
    </div>
  );
};

const COLS = [
  { key: ['policy_name', 'policyName'], label: 'Policy Name' },
  { key: ['insurer'], label: 'Insurer' },
  { key: ['premium'], label: 'Annual Premium' },
  { key: ['cover', 'coverage'], label: 'Cover Amount' },
  { key: ['waiting_period', 'waitingPeriod'], label: 'Waiting Period' },
  { key: ['benefit', 'key_benefit'], label: 'Key Benefit' },
  { key: ['score', 'suitability_score', 'numeric_score'], label: 'Score' },
];

const val = (row, keys) => {
  for (const k of keys) if (row[k] != null && row[k] !== '') return row[k];
  return '—';
};

const ComparisonTable = ({ data = [] }) => {
  if (!data.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">📋</div>
      <p className="font-semibold text-slate-700">No policy data extracted</p>
      <p className="text-sm text-slate-400 mt-1">Upload a policy and try again</p>
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm min-w-[820px]">
        <thead>
          <tr className="table-header">
            <th className="w-8 px-4 py-3.5 text-left text-xs font-semibold text-indigo-200">#</th>
            {COLS.map(c => (
              <th key={c.label} className="px-4 py-3.5 text-left text-xs font-semibold text-indigo-100 tracking-wide whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row, i) => (
            <tr
              key={i}
              className={`hover:bg-indigo-50/40 transition-colors group ${i === 0 ? 'bg-indigo-50/20' : ''}`}
            >
              <td className="px-4 py-4">
                {i === 0 ? (
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    ★
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs font-medium pl-1">{i + 1}</span>
                )}
              </td>

              {/* Policy Name */}
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{val(row, COLS[0].key)}</span>
                  {i === 0 && (
                    <span className="badge badge-indigo text-[10px]">Top Pick</span>
                  )}
                </div>
              </td>

              {/* Insurer */}
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">
                    {String(val(row, COLS[1].key)).slice(0, 2)}
                  </div>
                  <span className="text-slate-600 font-medium">{val(row, COLS[1].key)}</span>
                </div>
              </td>

              {/* Premium */}
              <td className="px-4 py-4 text-slate-800 font-semibold">{val(row, COLS[2].key)}</td>

              {/* Cover */}
              <td className="px-4 py-4 text-slate-600">{val(row, COLS[3].key)}</td>

              {/* Waiting Period */}
              <td className="px-4 py-4">
                <span className="badge badge-amber text-[10px]">{val(row, COLS[4].key)}</span>
              </td>

              {/* Benefit */}
              <td className="px-4 py-4 text-slate-500 max-w-[160px] truncate" title={String(val(row, COLS[5].key))}>
                {val(row, COLS[5].key)}
              </td>

              {/* Score */}
              <td className="px-4 py-4">
                <ScoreRing score={val(row, COLS[6].key)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center gap-2">
        <span className="text-slate-400 text-xs">ℹ</span>
        <span className="text-xs text-slate-400">
          Scores computed by multi-factor engine: waiting period, coverage, co-pay, exclusions & affordability
        </span>
      </div>
    </div>
  );
};

export default ComparisonTable;
