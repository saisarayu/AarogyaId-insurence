import React from 'react';
import { getDownloadUrl } from '../services/api';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PolicyDetailsModal = ({ policy, onClose }) => {
  if (!policy) return null;

  const downloadUrl = getDownloadUrl(policy.file_name || 'policy.pdf');

  const activationDays = policy.activation_days || ALL_DAYS;
  const diseaseCategories = policy.disease_categories || [];
  const requiredDocs = policy.required_documents || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                policy.scheme_type?.toLowerCase() === 'government'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                🏛️ {policy.scheme_type || 'Government'} Scheme
              </span>

              <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                policy.status?.toLowerCase() === 'active'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
              }`}>
                ● {policy.status || 'Active'}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight">
              {policy.policy_name}
            </h2>
            <p className="text-xs text-indigo-200 mt-1">
              Issued by <span className="font-semibold text-white">{policy.insurer || 'National Insurance Authority'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-base"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 custom-scrollbar">

          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/80">
              <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Coverage Amount</p>
              <p className="text-lg font-black text-indigo-950 mt-0.5">
                ₹{Number(policy.coverage_amount || 500000).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100/80">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Max Income Limit</p>
              <p className="text-lg font-black text-emerald-950 mt-0.5">
                ₹{Number(policy.annual_income_limit || 1000000).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100/80">
              <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Eligible Age Range</p>
              <p className="text-lg font-black text-purple-950 mt-0.5">
                {policy.min_age ?? 0} - {policy.max_age ?? 100} Yrs
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
              Policy Description
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              {policy.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Disease Categories */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Covered Disease Categories
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {diseaseCategories.map((cat, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-indigo-100/80 text-indigo-800 font-semibold text-xs border border-indigo-200/60"
                >
                  🩺 {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Activation Days Schedule */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Active Day Schedule
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map((day) => {
                const isActive = activationDays.map(d => d.toLowerCase()).includes(day.toLowerCase());
                return (
                  <span
                    key={day}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 line-through opacity-60'
                    }`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Backend automatically filters out policies on days when they are not scheduled as active.
            </p>
          </div>

          {/* Eligibility & Required Docs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Eligibility Criteria
              </h3>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                {policy.eligibility_criteria || 'Standard scheme eligibility conditions apply.'}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Required Documents
              </h3>
              <ul className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                {requiredDocs.length > 0 ? (
                  requiredDocs.map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-indigo-600 font-bold">✓</span> {doc}
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic">Identity Proof, Income Certificate</li>
                )}
              </ul>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            File: <span className="font-semibold text-slate-700">{policy.file_name || 'document.pdf'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>

            <a
              href={downloadUrl}
              download={policy.file_name || 'policy.pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-indigo-200 flex items-center gap-2 transition-all"
            >
              📥 Download Policy PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetailsModal;
