import React, { useState, useEffect } from 'react';
import {
  getAdminPolicies,
  getAdminStats,
  createPolicyAdmin,
  deleteAdminPolicy,
  updatePolicyAdmin,
  getDownloadUrl,
  refreshVectorDB
} from '../services/api';
import { DISEASE_CATEGORIES } from './DiseaseGrid';
import PolicyDetailsModal from './PolicyDetailsModal';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AdminPanel = () => {
  const [policies, setPolicies] = useState([]);
  const [stats, setStats] = useState({ total_policies: 0, active_policies: 0, inactive_policies: 0, total_coverage_value: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State for Add / Edit Policy
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [viewingPolicy, setViewingPolicy] = useState(null);

  // Form State for Policy Creation/Edit
  const [formData, setFormData] = useState({
    policy_name: '',
    description: '',
    insurer: 'National Health Insurance Authority',
    disease_categories: [],
    eligibility_criteria: 'Resident of India with valid ID proof',
    annual_income_limit: '500000',
    min_age: '0',
    max_age: '80',
    scheme_type: 'Government',
    coverage_amount: '500000',
    required_documents: 'Aadhaar Card, Income Certificate, Bank Details',
    status: 'Active',
    activation_days: ALL_DAYS,
    pdf_file: null,
  });

  const [uploading, setUploading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [policiesData, statsData] = await Promise.all([
        getAdminPolicies(),
        getAdminStats().catch(() => null)
      ]);
      setPolicies(policiesData || []);
      if (statsData) {
        setStats(statsData);
      } else {
        const total = policiesData.length;
        const active = policiesData.filter(p => p.status?.toLowerCase() === 'active').length;
        setStats({
          total_policies: total,
          active_policies: active,
          inactive_policies: total - active,
          total_coverage_value: policiesData.reduce((acc, curr) => acc + (parseFloat(curr.coverage_amount) || 0), 0)
        });
      }
    } catch (err) {
      setError('Failed to load admin policies. Check backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingPolicy(null);
    setFormData({
      policy_name: '',
      description: '',
      insurer: 'National Health Care',
      disease_categories: ['Cancer'],
      eligibility_criteria: 'Standard government eligibility criteria apply.',
      annual_income_limit: '500000',
      min_age: '0',
      max_age: '80',
      scheme_type: 'Government',
      coverage_amount: '500000',
      required_documents: 'Aadhaar Card, Income Certificate, Medical Reports',
      status: 'Active',
      activation_days: ALL_DAYS,
      pdf_file: null,
    });
    setIsModalOpen(true);
  };

  const handleToggleCategory = (catName) => {
    setFormData((prev) => {
      const exists = prev.disease_categories.includes(catName);
      return {
        ...prev,
        disease_categories: exists
          ? prev.disease_categories.filter((c) => c !== catName)
          : [...prev.disease_categories, catName],
      };
    });
  };

  const handleToggleDay = (day) => {
    setFormData((prev) => {
      const exists = prev.activation_days.includes(day);
      return {
        ...prev,
        activation_days: exists
          ? prev.activation_days.filter((d) => d !== day)
          : [...prev.activation_days, day],
      };
    });
  };

  const handleSubmitPolicy = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = new FormData();
      data.append('policy_name', formData.policy_name);
      data.append('description', formData.description);
      data.append('insurer', formData.insurer);
      data.append('disease_categories', JSON.stringify(formData.disease_categories));
      data.append('eligibility_criteria', formData.eligibility_criteria);
      data.append('annual_income_limit', formData.annual_income_limit);
      data.append('min_age', formData.min_age);
      data.append('max_age', formData.max_age);
      data.append('scheme_type', formData.scheme_type);
      data.append('coverage_amount', formData.coverage_amount);
      data.append('required_documents', JSON.stringify(formData.required_documents.split(',').map(s => s.trim()).filter(Boolean)));
      data.append('status', formData.status);
      data.append('activation_days', JSON.stringify(formData.activation_days));

      if (formData.pdf_file) {
        data.append('file', formData.pdf_file);
      }

      await createPolicyAdmin(data);
      setSuccessMsg('Policy created successfully!');
      setIsModalOpen(false);
      fetchAdminData();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create policy.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (identifier) => {
    if (!window.confirm(`Are you sure you want to delete policy "${identifier}"?`)) return;
    try {
      await deleteAdminPolicy(identifier);
      setSuccessMsg(`Policy "${identifier}" deleted.`);
      fetchAdminData();
    } catch (err) {
      setError('Failed to delete policy.');
    }
  };

  const handleToggleStatus = async (policy) => {
    const newStatus = policy.status?.toLowerCase() === 'active' ? 'Inactive' : 'Active';
    try {
      await updatePolicyAdmin(policy.id || policy.file_name, { status: newStatus });
      fetchAdminData();
    } catch (err) {
      setError('Failed to update status.');
    }
  };

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch =
      p.policy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.insurer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || p.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notifications */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs flex justify-between items-center shadow-sm">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 text-xs flex justify-between items-center shadow-sm">
          <span>🎉 {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Admin Control Panel</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">Policy Management System</h1>
          <p className="text-slate-300 text-xs mt-1">
            Manage scheme policies, upload PDF documents, configure activation days & income limits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshVectorDB().then(() => fetchAdminData())}
            type="button"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm border border-white/10 transition-all flex items-center gap-1.5"
          >
            🔄 Sync Vector Index
          </button>
          <button
            onClick={handleOpenAddModal}
            type="button"
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            ➕ Add Unlimited Policies
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-sm mb-1">
            <span>Total Uploaded Policies</span>
            <span>📄</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total_policies}</p>
          <p className="text-[11px] text-slate-400 mt-1">Displayed on admin dashboard</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center text-emerald-600 text-sm mb-1">
            <span>Active Policies Today</span>
            <span>✅</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.active_policies}</p>
          <p className="text-[11px] text-slate-400 mt-1">Visible to eligible users</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center text-amber-600 text-sm mb-1">
            <span>Inactive Policies</span>
            <span>⏸️</span>
          </div>
          <p className="text-2xl font-black text-slate-500">{stats.inactive_policies}</p>
          <p className="text-[11px] text-slate-400 mt-1">Hidden from recommendation engine</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center text-indigo-600 text-sm mb-1">
            <span>Total Coverage Pool</span>
            <span>💰</span>
          </div>
          <p className="text-2xl font-black text-indigo-900">
            ₹{(stats.total_coverage_value / 100000).toFixed(1)} Lakhs
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative coverage pool</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search policies by name, insurer, filename..."
            className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Status:</span>
          {['All', 'Active', 'Inactive'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Policy List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Policy Inventory ({filteredPolicies.length})</h3>
          <span className="text-xs text-slate-400">PDF Storage: backend/policies/</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Loading policies...</div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No policies match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Policy Name</th>
                  <th className="py-3.5 px-4">Disease Categories</th>
                  <th className="py-3.5 px-4">Income Limit</th>
                  <th className="py-3.5 px-4">Coverage</th>
                  <th className="py-3.5 px-4">Active Days</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPolicies.map((pol) => {
                  const isActive = pol.status?.toLowerCase() === 'active';
                  const days = pol.activation_days || ALL_DAYS;

                  return (
                    <tr key={pol.id || pol.file_name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[200px] truncate">
                        <p className="font-bold text-slate-900">{pol.policy_name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{pol.file_name}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {(pol.disease_categories || []).slice(0, 3).map((cat, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium text-[10px]">
                              {cat}
                            </span>
                          ))}
                          {(pol.disease_categories || []).length > 3 && (
                            <span className="text-[10px] text-slate-400">+{pol.disease_categories.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        ₹{Number(pol.annual_income_limit || 1000000).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-900">
                        ₹{Number(pol.coverage_amount || 500000).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          {days.length === 7 ? 'Every Day' : `${days.length} Days`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(pol)}
                          type="button"
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {isActive ? '● Active' : '○ Inactive'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingPolicy(pol)}
                            type="button"
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                            title="View Details"
                          >
                            👁️
                          </button>
                          <a
                            href={getDownloadUrl(pol.file_name)}
                            download={pol.file_name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            📥
                          </a>
                          <button
                            onClick={() => handleDelete(pol.id || pol.file_name)}
                            type="button"
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                            title="Delete Policy"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Policy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">Add Unlimited Policy Document</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-slate-300 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitPolicy} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800">Policy Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.policy_name}
                    onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                    placeholder="e.g. Swastha Cancer Protection Plan"
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800">Insurer Name</label>
                  <input
                    type="text"
                    value={formData.insurer}
                    onChange={(e) => setFormData({ ...formData, insurer: e.target.value })}
                    placeholder="e.g. Star Health Insurance"
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800">Policy Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of benefits, coverage terms, waiting period..."
                  className="w-full mt-1 p-2.5 border rounded-xl text-xs"
                />
              </div>

              {/* Disease Categories Selection */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Target Disease Categories *</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border rounded-xl">
                  {DISEASE_CATEGORIES.map((d) => {
                    const isSel = formData.disease_categories.includes(d.name);
                    return (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => handleToggleCategory(d.name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isSel ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {d.icon} {d.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Financial & Age Fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-800">Max Income Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.annual_income_limit}
                    onChange={(e) => setFormData({ ...formData, annual_income_limit: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800">Coverage Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.coverage_amount}
                    onChange={(e) => setFormData({ ...formData, coverage_amount: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs font-semibold text-indigo-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800">Min Age (Yrs)</label>
                  <input
                    type="number"
                    value={formData.min_age}
                    onChange={(e) => setFormData({ ...formData, min_age: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800">Max Age (Yrs)</label>
                  <input
                    type="number"
                    value={formData.max_age}
                    onChange={(e) => setFormData({ ...formData, max_age: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Scheme Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800">Scheme Type</label>
                  <select
                    value={formData.scheme_type}
                    onChange={(e) => setFormData({ ...formData, scheme_type: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="Government">Government Scheme</option>
                    <option value="Private">Private Insurance</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Activation Days Checkboxes */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Activation Days (Policy Schedule)</label>
                <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border rounded-xl">
                  {ALL_DAYS.map((day) => {
                    const isSel = formData.activation_days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          isSel ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PDF Document Upload */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Upload PDF Document</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormData({ ...formData, pdf_file: e.target.files[0] })}
                  className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {uploading ? 'Saving Policy...' : 'Save & Upload Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewingPolicy && (
        <PolicyDetailsModal policy={viewingPolicy} onClose={() => setViewingPolicy(null)} />
      )}
    </div>
  );
};

export default AdminPanel;
