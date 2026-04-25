import { useEffect, useState, useRef } from 'react';
import { uploadPolicy, getPolicies, deletePolicy } from '../services/api';

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const AdminPanel = () => {
  const [policies, setPolicies]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting]   = useState('');
  const [search, setSearch]       = useState('');
  const fileInputRef              = useRef(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getPolicies();
      setPolicies(Array.isArray(data) ? data : []);
    } catch {
      // Handle silently for demo visual
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadPolicy(file);
      refresh();
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || JSON.stringify(err);
      alert(message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (fileName) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) return;
    setDeleting(fileName);
    try {
      await deletePolicy(fileName);
      refresh();
    } catch {
      alert('Unable to delete policy.');
    } finally {
      setDeleting('');
    }
  };

  const filteredPolicies = policies.filter(p => {
    const name = (p.file_name ?? p.policy_name ?? p).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="p-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Manage insurance policy documents</p>
        </div>
        <div>
          <input 
             type="file" 
             className="hidden" 
             ref={fileInputRef} 
             accept=".pdf,.txt,.json" 
             onChange={handleFileChange} 
          />
          <button 
             onClick={handleUploadClick}
             disabled={uploading}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
             {uploading ? 'Uploading...' : '↑ Upload New Policy'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Policies', val: policies.length, sub: 'Documents uploaded' },
          { label: 'Active Policies', val: policies.length, sub: 'Currently active' },
          { label: 'Total Chunks', val: policies.length * 150, sub: 'In vector database' }, // Mock stat
          { label: 'Total Size', val: `${(policies.length * 4.2).toFixed(1)} MB`, sub: 'Document storage' }, // Mock stat
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 card-shadow p-5 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
             <p className="text-sm font-medium text-slate-500 mb-2">{m.label}</p>
             <p className="text-3xl font-bold text-slate-800 mb-1">{m.val}</p>
             <p className="text-xs text-slate-400">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-lg font-bold text-slate-800">Policy Documents</h2>
           <div>
              <input 
                 type="text" 
                 placeholder="🔍 Search policies..." 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="field-input w-64 rounded-full py-2 !pr-4"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wide text-xs">
                {['Policy Name', 'Upload Date', 'Status', 'Actions'].map(h => (
                   <th key={h} className="pb-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPolicies.map((policy) => {
                const name = policy.file_name ?? policy.policy_name ?? policy;
                const isDeleting = deleting === name;
                return (
                  <tr key={name} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 font-medium text-slate-800">{name}</td>
                    <td className="py-4 text-slate-500">{fmtDate(policy.upload_date)}</td>
                    <td className="py-4">
                       <span className="bg-green-50 text-green-600 border border-green-100 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                          Active
                       </span>
                    </td>
                    <td className="py-4">
                       <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                             disabled={isDeleting}
                             onClick={() => handleDelete(name)}
                             title="Delete"
                             className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded disabled:opacity-50 transition-colors"
                          >
                             {isDeleting ? '⏳' : '🗑'}
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPolicies.length === 0 && (
                <tr>
                   <td colSpan={4} className="py-12 text-center text-slate-400">
                      {loading ? 'Loading...' : 'No policies found.'}
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info matching design */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
           <p>Showing 1 to {filteredPolicies.length} of {policies.length} results</p>
           <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-400 bg-slate-50">{'<'}</button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-indigo-600 text-white font-medium">1</button>
              <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-600 hover:bg-slate-50">2</button>
              <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-400 bg-slate-50">{'>'}</button>
           </div>
        </div>

      </div>

    </div>
  );
};

export default AdminPanel;
