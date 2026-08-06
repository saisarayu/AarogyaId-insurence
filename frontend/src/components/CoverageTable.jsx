const COVERAGE_FIELDS = [
  {
    key: 'inclusions',
    label: 'Inclusions',
    icon: '✓',
    iconClass: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    dot: 'bg-emerald-500',
  },
  {
    key: 'exclusions',
    label: 'Exclusions',
    icon: '✕',
    iconClass: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    dot: 'bg-red-500',
  },
  {
    key: 'sub_limits',
    label: 'Sub-limits',
    icon: '≤',
    iconClass: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    dot: 'bg-amber-500',
  },
  {
    key: 'co_pay',
    label: 'Co-payment',
    icon: '%',
    iconClass: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    dot: 'bg-blue-500',
  },
  {
    key: 'claim_type',
    label: 'Claim Type',
    icon: '🏥',
    iconClass: '',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    dot: 'bg-violet-500',
  },
];

const CoverageTable = ({ data = {} }) => {
  const hasData = data && typeof data === 'object' && Object.keys(data).length > 0;

  if (!hasData) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-3xl mb-2">🛡️</div>
      <p className="text-sm font-medium text-slate-600">Coverage details will appear here</p>
      <p className="text-xs text-slate-400 mt-1">After a recommendation is generated</p>
    </div>
  );

  return (
    <div className="grid gap-3">
      {COVERAGE_FIELDS.map((field) => {
        const value = data[field.key];
        const isEmpty = !value || value === 'Not available' || value === '';
        return (
          <div
            key={field.key}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl border ${field.bg} ${field.border} transition-all hover:shadow-sm`}
          >
            {/* Icon */}
            <div
              className={`w-8 h-8 rounded-lg ${field.bg} border ${field.border} flex items-center justify-center font-bold text-sm flex-shrink-0 ${field.iconClass}`}
            >
              {field.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{field.label}</p>
                <span className={`w-1.5 h-1.5 rounded-full ${field.dot}`} />
              </div>
              <p className={`text-sm leading-relaxed ${isEmpty ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                {isEmpty ? 'Not specified in documents' : value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CoverageTable;
