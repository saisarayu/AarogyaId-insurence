import React, { useState } from 'react';

const INCOME_PRESETS = [
  { label: 'Below ₹3,00,000', value: 280000 },
  { label: 'Below ₹5,00,000', value: 480000 },
  { label: '₹5,00,000–₹10,00,000', value: 750000 },
  { label: 'Above ₹10,00,000', value: 1500000 },
];

const UserForm = ({ onSubmit, loading, selectedDiseases = [] }) => {
  const [name, setName] = useState('Subrahmanyam');
  const [income, setIncome] = useState(280000);
  const [age, setAge] = useState(35);
  const [schemeType, setSchemeType] = useState('All');
  const [dayOfWeek, setDayOfWeek] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: name.trim() || 'Subrahmanyam',
      diseases: selectedDiseases,
      annual_income: parseFloat(income) || 280000,
      age: parseInt(age, 10) || 35,
      scheme_type: schemeType,
      day_of_week: dayOfWeek || null,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Applicant Eligibility Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">Filter policies matching your disease, income & age</p>
        </div>
        <span className="text-xl">📋</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Applicant Name */}
        <div>
          <label className="font-bold text-slate-800 block mb-1">Applicant Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name (e.g. Subrahmanyam)"
            className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Selected Diseases Badge Summary */}
        <div>
          <label className="font-bold text-slate-800 block mb-1.5">Selected Condition(s)</label>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[44px] flex flex-wrap gap-1.5 items-center">
            {selectedDiseases.length > 0 ? (
              selectedDiseases.map((d) => (
                <span key={d} className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] shadow-sm">
                  🩺 {d}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic">Select one or more conditions from the grid above</span>
            )}
          </div>
        </div>

        {/* Annual Income Selection */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-bold text-slate-800">Annual Family Income (₹)</label>
            <span className="font-black text-indigo-700 text-xs">
              ₹{Number(income).toLocaleString('en-IN')}
            </span>
          </div>

          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="Enter income in ₹ (e.g. 280000)"
            className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />

          {/* Quick Income Band Buttons */}
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {INCOME_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setIncome(preset.value)}
                className={`p-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                  income === preset.value
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age & Scheme Type */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800">Age (Years)</label>
                {Number(age) < 15 ? (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                    Age &lt; 15 (Child OK)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    Age ≥ 15 (Adult)
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={`w-full mt-1 p-2.5 border rounded-xl font-semibold text-slate-800 ${
                  Number(age) < 15 ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="font-bold text-slate-800">Scheme Type</label>
              <select
                value={schemeType}
                onChange={(e) => setSchemeType(e.target.value)}
                className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl font-semibold bg-white text-slate-800"
              >
                <option value="All">All Schemes</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>
            </div>
          </div>

          {/* Quick Child & Adult Age Presets */}
          <div className="flex gap-1.5 mt-2">
            {[
              { label: '👶 Child (5 Yrs)', val: 5 },
              { label: '👶 Child (12 Yrs)', val: 12 },
              { label: 'Adult (35 Yrs)', val: 35 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setAge(p.val)}
                className={`flex-1 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                  Number(age) === p.val
                    ? Number(age) < 15
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {Number(age) < 15 && (
            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
              <span>👶</span>
              <span><strong>Child Age Approved (Age {age}):</strong> Below 15 years limit OK for Pediatric & Child Health coverage.</span>
            </div>
          )}

          {Number(age) >= 15 && selectedDiseases.some(d => d.toLowerCase().includes('child')) && (
            <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-medium flex items-center gap-1.5">
              <span>⚠️</span>
              <span><strong>Age Limit Restriction:</strong> Applicant age is {age} (≥ 15). Children schemes require age strictly below 15!</span>
            </div>
          )}
        </div>

        {/* Activation Day Tester (Optional override) */}
        <div>
          <label className="font-bold text-slate-800 block mb-1">Check Schedule For Specific Day</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-700"
          >
            <option value="">Today (Auto-detect server day)</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Backend automatically verifies policy schedule & hides inactive policies.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Evaluating Combined Eligibility...
            </>
          ) : (
            <>🎯 Generate Combined Policy Recommendations</>
          )}
        </button>
      </form>
    </div>
  );
};

export default UserForm;
