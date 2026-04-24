import { useState } from 'react';

const lifestyles    = ['Sedentary', 'Moderate', 'Active', 'Athlete'];
const incomes       = ['under 3L', '3-8L', '8-15L', '15L+'];
const cities        = ['Metro', 'Tier-2', 'Tier-3'];
const conditionOpts = ['Diabetes', 'Hypertension', 'Asthma', 'Heart disease'];

const UserForm = ({ onSubmit, loading }) => {
  const [values, setValues] = useState({
    name: 'Ravi Kumar', age: '45', lifestyle: 'Sedentary', conditions: ['Diabetes', 'Hypertension'], income: '3-8L', city: 'Tier-2',
  });

  const handleSubmit = (ev) => {
    ev.preventDefault();
    onSubmit({ ...values, age: Number(values.age) });
  };

  const set = (field) => (ev) =>
    setValues((v) => ({ ...v, [field]: ev.target.value }));

  const toggleCondition = (cond) =>
    setValues((v) => ({
      ...v,
      conditions: v.conditions.includes(cond)
        ? v.conditions.filter((c) => c !== cond)
        : [...v.conditions, cond],
    }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800 text-lg">Your Profile</h2>
        <p className="text-xs text-slate-500 mt-0.5">Tell us about yourself</p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Name */}
        <div>
          <label className="field-label flex items-center gap-2"><span className="text-slate-400">👤</span> Name</label>
          <input className="field-input" type="text" value={values.name} onChange={set('name')} />
        </div>

        {/* Age */}
        <div>
          <label className="field-label flex items-center gap-2"><span className="text-slate-400">🎂</span> Age</label>
          <input className="field-input" type="number" value={values.age} onChange={set('age')} />
        </div>

        {/* Lifestyle */}
        <div>
          <label className="field-label flex items-center gap-2"><span className="text-slate-400">🏃</span> Lifestyle</label>
          <select className="field-input" value={values.lifestyle} onChange={set('lifestyle')}>
            <option value="">Select lifestyle</option>
            {lifestyles.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Medical Conditions */}
        <div>
          <label className="field-label flex items-center gap-2"><span className="text-slate-400">🫀</span> Medical Conditions</label>
          <div className="border border-slate-200 rounded-lg p-2 flex flex-wrap gap-1.5 min-h-[42px] bg-white">
            {values.conditions.map(c => (
              <span key={c} className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                {c}
                <button type="button" onClick={() => toggleCondition(c)} className="hover:text-indigo-800 ml-1">×</button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-1 flex-wrap">
             {conditionOpts.map(c => !values.conditions.includes(c) && (
                 <button type="button" key={c} onClick={() => toggleCondition(c)} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded hover:bg-slate-200">+{c}</button>
             ))}
          </div>
        </div>

        {/* Income Range */}
        <div>
          <label className="field-label flex items-center gap-2"><span className="text-slate-400">💰</span> Income Range</label>
          <select className="field-input" value={values.income} onChange={set('income')}>
            <option value="">Select income</option>
            {incomes.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="field-label flex items-center gap-2"><span className="text-slate-400">🏙</span> City</label>
          <select className="field-input" value={values.city} onChange={set('city')}>
            <option value="">Select city</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Analyzing...' : '✨ Get Recommendations'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
