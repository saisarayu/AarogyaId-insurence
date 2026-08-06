import React, { useState, useMemo } from 'react';
import RecommendationCard from './RecommendationCard';
import PolicyDetailsModal from './PolicyDetailsModal';

const Recommendation = ({ data, loading }) => {
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState('all_matching');

  // Filters state
  const [filterScheme, setFilterScheme] = useState('All');
  const [filterMinCoverage, setFilterMinCoverage] = useState(0);
  const [filterSearch, setFilterSearch] = useState('');

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm text-center space-y-4 animate-pulse">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto animate-spin">
          ⚡
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Evaluating Policy Match Engine</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Checking today's active schedule, income limits, age eligibility & disease coverage...
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const targetDay = data.target_day || data.coverageDetails?.target_day || 'Today';
  const selectedDiseases = data.selected_diseases || [];

  const rawRecommended = data.recommended_policies || data.peerComparison || [];
  const rawCombo = data.combo_policies || rawRecommended.filter((p) => (p.match_count || 0) >= 2);
  const byDiseaseMap = data.by_disease || {};
  const allSystemPolicies = data.all_system_policies || rawRecommended;

  // Build active list based on activeTab
  let activeList = rawRecommended;
  if (activeTab === 'combo') {
    activeList = rawCombo;
  } else if (activeTab.startsWith('disease:')) {
    const dName = activeTab.replace('disease:', '');
    activeList = byDiseaseMap[dName] || rawRecommended.filter((p) => {
      const cats = (p.disease_categories || []).map((c) => c.toLowerCase());
      return cats.some((c) => c.includes(dName.toLowerCase()));
    });
  } else if (activeTab === 'all_system') {
    activeList = allSystemPolicies;
  }

  // Apply User Dashboard Filters
  const filteredPolicies = activeList.filter((p) => {
    const scheme = p.scheme_type || 'Government';
    const coverage = p.coverage_amount || 500000;
    const name = p.policy_name || '';
    const desc = p.description || '';

    const matchScheme = filterScheme === 'All' || scheme.toLowerCase() === filterScheme.toLowerCase();
    const matchCoverage = coverage >= filterMinCoverage;
    const matchSearch =
      name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      desc.toLowerCase().includes(filterSearch.toLowerCase());

    return matchScheme && matchCoverage && matchSearch;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-black tracking-tight">Recommended Policies</h2>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              {rawRecommended.length} Eligible Found
            </span>
            {selectedDiseases.length > 0 && (
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Selected: {selectedDiseases.join(', ')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Active on <span className="font-bold text-white">{targetDay}</span> · Grounded in verified policy specifications
          </p>
        </div>

        <div className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-slate-200">
          📅 Active Schedule Verified
        </div>
      </div>

      {/* Category View Tabs (All Matching, Combos, Disease Tabs, All System Policies) */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap gap-1.5 text-xs font-bold">
        <button
          onClick={() => setActiveTab('all_matching')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'all_matching'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span>🎯 All Matching</span>
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">
            {rawRecommended.length}
          </span>
        </button>

        {rawCombo.length > 0 && (
          <button
            onClick={() => setActiveTab('combo')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'combo'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span>✨ Combo Policies</span>
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px]">
              {rawCombo.length}
            </span>
          </button>
        )}

        {/* Individual Selected Disease Tabs */}
        {selectedDiseases.map((d) => {
          const tabKey = `disease:${d}`;
          const dCount = (byDiseaseMap[d] || []).length;
          return (
            <button
              key={d}
              onClick={() => setActiveTab(tabKey)}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === tabKey
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>🩺 {d} Policies</span>
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px]">
                {dCount}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setActiveTab('all_system')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'all_system'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span>📁 All System Policies</span>
          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">
            {allSystemPolicies.length}
          </span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder={`Search ${activeTab.replace('disease:', '')} policies...`}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Scheme:</span>
            {['All', 'Government', 'Private'].map((sc) => (
              <button
                key={sc}
                onClick={() => setFilterScheme(sc)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterScheme === sc ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Min Coverage:</span>
            <select
              value={filterMinCoverage}
              onChange={(e) => setFilterMinCoverage(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700"
            >
              <option value={0}>Any Coverage</option>
              <option value={300000}>₹3 Lakhs+</option>
              <option value={500000}>₹5 Lakhs+</option>
              <option value={750000}>₹7.5 Lakhs+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommended Policies Cards Grid */}
      {filteredPolicies.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          No policies match the current tab and filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map((policy, idx) => (
            <RecommendationCard
              key={policy.id || policy.file_name || idx}
              policy={policy}
              onViewDetails={(p) => setSelectedPolicy(p)}
            />
          ))}
        </div>
      )}

      {/* Details View Modal */}
      {selectedPolicy && (
        <PolicyDetailsModal policy={selectedPolicy} onClose={() => setSelectedPolicy(null)} />
      )}
    </div>
  );
};

export default Recommendation;
