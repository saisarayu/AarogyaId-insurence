import { useState } from 'react';

const lifestyles    = ['Sedentary', 'Moderate', 'Active', 'Athlete'];
const incomes       = ['under 3L', '3-8L', '8-15L', '15L+'];
const cities        = ['Metro', 'Tier-2', 'Tier-3'];
const conditionOpts = ['Diabetes', 'Hypertension', 'Asthma', 'Heart disease', 'None'];

const UserForm = ({ onSubmit, loading }) => {
  const [values, setValues] = useState({
    name: '', age: '', lifestyle: '', conditions: [], income: '', city: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!values.name.trim())                                             e.name       = 'Name is required.';
    if (!values.age)                                                     e.age        = 'Age is required.';
    else if (Number(values.age) < 1 || Number(values.age) > 99)         e.age        = 'Age must be between 1 and 99.';
    if (!values.lifestyle)                                               e.lifestyle  = 'Select a lifestyle.';
    if (!values.conditions.length)                                       e.conditions = 'Select at least one condition.';
    if (!values.income)                                                  e.income     = 'Select an income range.';
    if (!values.city)                                                    e.city       = 'Select a city tier.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
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

  const err = (field) =>
    errors[field] ? (
      <p className="mt-1 text-xs" style={{ color: 'var(--accent)' }}>{errors[field]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-7">

      {/* Row 1 — Name + Age */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label">Full name</label>
          <input
            className="field-input"
            type="text"
            placeholder="e.g. Priya Sharma"
            value={values.name}
            onChange={set('name')}
          />
          {err('name')}
        </div>
        <div>
          <label className="field-label">Age</label>
          <input
            className="field-input"
            type="number"
            placeholder="1 – 99"
            min="1" max="99"
            value={values.age}
            onChange={set('age')}
          />
          {err('age')}
        </div>
      </div>

      {/* Row 2 — Lifestyle */}
      <div>
        <label className="field-label">Lifestyle</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {lifestyles.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setValues((v) => ({ ...v, lifestyle: opt }))}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                values.lifestyle === opt
                  ? 'text-white border-transparent'
                  : 'border-stone-300 text-stone-600 hover:border-stone-400'
              }`}
              style={values.lifestyle === opt ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
            >
              {opt}
            </button>
          ))}
        </div>
        {err('lifestyle')}
      </div>

      {/* Row 3 — Conditions (checkbox style) */}
      <div>
        <label className="field-label">Health conditions <span className="normal-case font-normal text-stone-400">(select all that apply)</span></label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {conditionOpts.map((cond) => {
            const active = values.conditions.includes(cond);
            return (
              <button
                key={cond}
                type="button"
                onClick={() => toggleCondition(cond)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'text-white border-transparent'
                    : 'border-stone-300 text-stone-600 hover:border-stone-400'
                }`}
                style={active ? { background: 'var(--navy)', borderColor: 'var(--navy)' } : {}}
              >
                {active && <span>✓</span>}
                {cond}
              </button>
            );
          })}
        </div>
        {err('conditions')}
      </div>

      {/* Row 4 — Income + City */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label">Annual income</label>
          <select className="field-input" value={values.income} onChange={set('income')}>
            <option value="">Select range</option>
            {incomes.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {err('income')}
        </div>
        <div>
          <label className="field-label">City tier</label>
          <select className="field-input" value={values.city} onChange={set('city')}>
            <option value="">Select tier</option>
            {cities.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {err('city')}
        </div>
      </div>

      {/* Submit */}
      <div className="pt-1">
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px]">
          {loading ? (
            <span className="dot-pulse flex items-center gap-1">
              <span /><span /><span />
              <span className="ml-2 font-normal text-orange-100">Finding best policies…</span>
            </span>
          ) : (
            'Get My Recommendation →'
          )}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
