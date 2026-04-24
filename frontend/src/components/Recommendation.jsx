const Recommendation = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center card-shadow">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium tracking-wide">Analyzing policy documents...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { peerComparison, coverageDetails, whyThisPolicy } = data;
  const hasPeers = Array.isArray(peerComparison) && peerComparison.length > 0;

  const getScoreColor = (scoreStr) => {
    // If it's a number/percentage-like string, we try to parse it
    const val = parseInt(String(scoreStr).replace(/\D/g, ''), 10);
    if (!isNaN(val)) {
      if (val >= 85) return 'text-green-500 border-green-500';
      if (val >= 70) return 'text-yellow-500 border-yellow-500';
      return 'text-red-500 border-red-500';
    }
    return 'text-indigo-500 border-indigo-500'; // fallback
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden p-6 space-y-6">
      
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Your Top Insurance Recommendations</h2>
          <p className="text-sm text-slate-500 mt-1">Based on your profile and our AI analysis</p>
        </div>
        {hasPeers && (
          <div className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
            ⭐ {peerComparison.length} Best Matches Found
          </div>
        )}
      </div>

      {/* Styled Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header border-b border-indigo-700">
              <tr>
                {['Policy Name', 'Insurer', 'Premium (Annual)', 'Cover Amount', 'Waiting Period', 'Key Benefit', 'Suitability Score'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {hasPeers ? peerComparison.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-slate-800 font-medium">{item.policy_name ?? item.policyName ?? '—'}</td>
                  <td className="px-5 py-4 text-slate-600 font-medium flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-100 rounded text-[10px] flex items-center justify-center font-bold text-slate-400 border border-slate-200 overflow-hidden">
                       {(item.insurer || 'IC').substring(0,2).toUpperCase()}
                    </div>
                    {item.insurer ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-slate-800 font-medium">{item.premium ?? '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{item.cover ?? '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{item.waiting_period ?? item.waitingPeriod ?? '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{item.benefit ?? item.key_benefit ?? '—'}</td>
                  <td className="px-5 py-4 text-center">
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-[11px] mx-auto ${getScoreColor(item.score ?? item.suitability_score)}`}>
                      {item.score ?? item.suitability_score ?? '--'}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={7} className="text-center py-6 text-slate-500">No peers data extracted from document.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-5 py-2.5 text-xs text-slate-500 border-t border-slate-200 flex items-center gap-1.5">
          <span className="text-slate-400">ℹ</span> Scores are based on your profile match, coverage, and benefits analysis
        </div>
      </div>

      {/* Cards Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Coverage Details */}
        <div className="border border-indigo-100 bg-[#FBFAFF] rounded-xl p-5 card-shadow">
          <div className="flex items-center gap-2 mb-4">
             <span className="text-indigo-600 bg-indigo-100 rounded-lg p-1.5 w-7 h-7 flex items-center justify-center">🛡</span>
             <h3 className="font-semibold text-indigo-900">Coverage Details</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { icon: '✓', color: 'text-green-500', name: 'Inclusions', val: coverageDetails?.inclusions },
              { icon: '✕', color: 'text-red-500', name: 'Exclusions', val: coverageDetails?.exclusions },
              { icon: '✓', color: 'text-green-500', name: 'Sub-limits', val: coverageDetails?.sub_limits },
              { icon: '◷', color: 'text-blue-500', name: 'Co-pay', val: coverageDetails?.co_pay },
              { icon: '🏥', color: 'text-indigo-500', name: 'Claim Type', val: coverageDetails?.claim_type },
            ].map(item => (
              <div key={item.name} className="flex items-start gap-4 text-sm">
                <span className={`font-bold mt-0.5 w-4 text-center ${item.color}`}>{item.icon}</span>
                <div>
                  <p className="font-medium text-slate-700">{item.name}</p>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">{item.val && item.val !== 'Not available' ? item.val : 'Not specified'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why this policy */}
        <div className="border border-indigo-100 bg-[#FBFAFF] rounded-xl p-5 card-shadow flex flex-col">
          <div className="flex items-center gap-2 mb-4">
             <span className="text-indigo-600 bg-indigo-100 rounded-lg p-1.5 w-7 h-7 flex items-center justify-center">💡</span>
             <h3 className="font-semibold text-indigo-900">Why This Policy?</h3>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed flex-1 whitespace-pre-line">
            {whyThisPolicy || 'No subjective explanation provided by the model.'}
          </div>
          <div className="mt-4 pt-4 border-t border-indigo-100 flex flex-wrap gap-2">
            {['Age Appropriate', 'Condition Coverage', 'City Relevant'].map(badge => (
              <span key={badge} className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-semibold px-2 py-1 rounded-md">
                {badge}
              </span>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Recommendation;
