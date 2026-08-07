import React, { useState } from 'react';

export const DISEASE_CATEGORIES = [
  { id: 'Cancer', name: 'Cancer', icon: '🎗️', color: 'from-pink-500 to-rose-600', description: 'Oncology, Chemotherapy & Radiation' },
  { id: 'Heart Disease', name: 'Heart Disease', icon: '❤️', color: 'from-red-500 to-rose-700', description: 'Cardiac Care, Angioplasty & Surgeries' },
  { id: 'Diabetes', name: 'Diabetes', icon: '🩸', color: 'from-amber-500 to-orange-600', description: 'Metabolic & Insulin Management' },
  { id: 'Kidney Disease', name: 'Kidney Disease', icon: '🫘', color: 'from-emerald-500 to-teal-700', description: 'Renal Care & Dialysis Coverage' },
  { id: 'Liver Disease', name: 'Liver Disease', icon: '🧬', color: 'from-yellow-600 to-amber-700', description: 'Hepatology & Hepatic Surgeries' },
  { id: 'Stroke', name: 'Stroke', icon: '🧠', color: 'from-purple-500 to-indigo-700', description: 'Cerebrovascular & Emergency Care' },
  { id: 'Asthma', name: 'Asthma', icon: '🫁', color: 'from-cyan-500 to-blue-600', description: 'Pulmonary Care & Inhaler Support' },
  { id: 'Tuberculosis', name: 'Tuberculosis', icon: '🔬', color: 'from-blue-600 to-indigo-800', description: 'DOTS Treatment & Lung Recovery' },
  { id: 'Arthritis', name: 'Arthritis', icon: '🦴', color: 'from-stone-500 to-slate-700', description: 'Orthopedic & Joint Replacements' },
  { id: 'Parkinson\'s Disease', name: 'Parkinson\'s Disease', icon: '⚡', color: 'from-violet-500 to-purple-800', description: 'Neurological & Movement Disorder Care' },
  { id: 'Alzheimer\'s Disease', name: 'Alzheimer\'s Disease', icon: '💭', color: 'from-indigo-400 to-purple-600', description: 'Memory Care & Cognitive Rehabilitation' },
  { id: 'Hypertension', name: 'Hypertension', icon: '📈', color: 'from-rose-500 to-red-600', description: 'High Blood Pressure & Vascular Care' },
  { id: 'Mental Health Disorders', name: 'Mental Health Disorders', icon: '🧩', color: 'from-teal-400 to-emerald-600', description: 'Psychiatric Care & Counseling Support' },
  { id: 'Eye Disorders', name: 'Eye Disorders', icon: '👁️', color: 'from-sky-400 to-blue-600', description: 'Ophthalmology & Cataract Surgeries' },
  { id: 'Hearing Disorders', name: 'Hearing Disorders', icon: '👂', color: 'from-violet-400 to-purple-600', description: 'ENT, Cochlear & Hearing Implants' },
  { id: 'Blood Disorders', name: 'Blood Disorders', icon: '💉', color: 'from-red-600 to-burgundy-800', description: 'Thalassemia, Anemia & Transfusions' },
  { id: 'Rare Diseases', name: 'Rare Diseases', icon: '🌟', color: 'from-fuchsia-500 to-pink-700', description: 'Specialized Genetic & Orphan Drugs' },
  { id: 'Pregnancy Care', name: 'Pregnancy Care', icon: '🤰', color: 'from-pink-400 to-rose-500', description: 'Maternity, Delivery & Antenatal Support' },
  { id: 'Child Health', name: 'Child Health', icon: '👶', color: 'from-blue-400 to-teal-500', description: 'Pediatric Care & Immunizations' },
  { id: 'Senior Citizen Care', name: 'Senior Citizen Care', icon: '👴', color: 'from-emerald-600 to-green-800', description: 'Geriatric Care, Nursing & ICU Cover' },
];

const DiseaseGrid = ({ selectedDiseases = [], onToggleDisease, onSelectAll, onClearAll }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDiseases = DISEASE_CATEGORIES.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Select Medical Condition(s)
            </h2>
            <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-0.5 rounded-full">
              {selectedDiseases.length} Selected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select one or multiple conditions to find eligible policy recommendations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedDiseases.length > 0 && (
            <button
              onClick={onClearAll}
              type="button"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => onSelectAll(DISEASE_CATEGORIES.map(d => d.name))}
            type="button"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Select All
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
          🔍
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search 20+ disease categories (e.g. Cancer, Diabetes, Heart...)"
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Disease Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredDiseases.map((disease) => {
          const isSelected = selectedDiseases.includes(disease.name);

          return (
            <button
              key={disease.id}
              type="button"
              onClick={() => onToggleDisease(disease.name)}
              className={`relative group text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50/80 border-indigo-500 shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20 scale-[1.02]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm'
              }`}
            >
              {/* Checkbox indicator */}
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-xl group-hover:scale-110 transition-transform">
                  {disease.icon}
                </span>
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 bg-white group-hover:border-slate-400'
                  }`}
                >
                  {isSelected && '✓'}
                </div>
              </div>

              <div>
                <p className={`font-semibold text-xs leading-snug ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                  {disease.name}
                </p>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                  {disease.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {filteredDiseases.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-xs">
          No disease categories match "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default DiseaseGrid;
