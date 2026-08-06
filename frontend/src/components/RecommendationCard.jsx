import React from 'react';
import { getDownloadUrl } from '../services/api';

const RecommendationCard = ({ policy, onViewDetails }) => {
  if (!policy) return null;

  const downloadUrl = getDownloadUrl(policy.file_name || 'policy.pdf');

  const coverage = Number(policy.coverage_amount || 500000).toLocaleString('en-IN');
  const incomeLimit = Number(policy.annual_income_limit || 1000000).toLocaleString('en-IN');
  const relevance = policy.relevance_score || 92;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group relative overflow-hidden">
      {/* Background Subtle Gradient Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 rounded-bl-full pointer-events-none -z-0"></div>

      <div className="relative z-10 space-y-3">
        {/* Top Badges Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {policy.is_eligible === false ? (
              <span
                className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1"
                title={policy.rejection_reason || 'Does not match current criteria'}
              >
                <span>⚠️</span> Ineligible
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <span>✓</span> Eligible
              </span>
            )}

            {policy.is_child_age && (
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs border border-teal-200">
                👶 Child (Age &lt; 15) OK
              </span>
            )}

            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] uppercase tracking-wider">
              {policy.scheme_type || 'Government'}
            </span>
          </div>

          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">
            ⚡ {relevance}% Match
          </span>
        </div>

        {/* Title & Insurer */}
        <div>
          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors leading-tight">
            {policy.policy_name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Issued by <span className="font-semibold text-slate-700">{policy.insurer || 'National Insurance Mission'}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {policy.description || 'Comprehensive medical coverage with zero co-payment and quick claim processing.'}
        </p>

        {/* Categories Tags */}
        <div className="flex flex-wrap gap-1">
          {(policy.disease_categories || []).map((cat, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
              🩺 {cat}
            </span>
          ))}
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="bg-indigo-50/50 p-2 rounded-xl">
            <p className="text-[10px] font-semibold text-indigo-600 uppercase">Coverage Amount</p>
            <p className="font-black text-indigo-950 text-sm mt-0.5">₹{coverage}</p>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl">
            <p className="text-[10px] font-semibold text-slate-500 uppercase">Income Limit</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">₹{incomeLimit}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={() => onViewDetails(policy)}
          type="button"
          className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors text-center"
        >
          👁️ View Details
        </button>

        <a
          href={downloadUrl}
          download={policy.file_name || 'policy.pdf'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm text-center flex items-center justify-center gap-1.5"
        >
          📥 Download PDF
        </a>
      </div>
    </div>
  );
};

export default RecommendationCard;
