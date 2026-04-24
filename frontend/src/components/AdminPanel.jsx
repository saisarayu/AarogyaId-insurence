import { useEffect, useState } from 'react';
import { uploadPolicy, getPolicies, deletePolicy } from '../services/api';

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const AdminPanel = () => {
  const [file, setFile]         = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [deleting, setDeleting] = useState(''); // track which file is being deleted

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPolicies();
      setPolicies(Array.isArray(data) ? data : []);
    } catch {
      setError('Unable to load policy list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleUpload = async () => {
    if (!file) { setError('Choose a file first.'); return; }
    setError(''); setSuccess(''); setUploading(true);
    try {
      await uploadPolicy(file);
      setSuccess(`"${file.name}" uploaded successfully.`);
      setFile(null);
      // reset the file input
      document.getElementById('policy-file-input').value = '';
      refresh();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileName) => {
    setError(''); setSuccess(''); setDeleting(fileName);
    try {
      await deletePolicy(fileName);
      setSuccess(`"${fileName}" deleted.`);
      refresh();
    } catch {
      setError('Unable to delete policy.');
    } finally {
      setDeleting('');
    }
  };

  return (
    <div className="space-y-8">

      {/* ── Upload section ── */}
      <section className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Upload policy document</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>PDF, TXT or JSON · document will be chunked and stored in the vector database</p>
        </div>
        <div className="px-5 py-5 space-y-4" style={{ background: '#faf9f7' }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="field-label">Select file</label>
              <input
                id="policy-file-input"
                type="file"
                accept=".pdf,.txt,.json"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="field-input cursor-pointer text-sm file:mr-3 file:rounded file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-stone-700 hover:file:bg-stone-200"
              />
              {file && (
                <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {file.name} · {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={uploading || !file}
              onClick={handleUpload}
              className="btn-primary flex-shrink-0 py-2.5 px-5"
            >
              {uploading ? (
                <span className="dot-pulse flex gap-1"><span /><span /><span /></span>
              ) : (
                'Upload'
              )}
            </button>
          </div>

          {error   && <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca' }}>{error}</p>}
          {success && <p className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--green)', background: 'var(--green-lt)', border: '1px solid #bbf7d0' }}>{success}</p>}
        </div>
      </section>

      {/* ── Policy list ── */}
      <section className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Stored policies</p>
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: 'var(--accent-lt)', color: 'var(--accent)', border: '1px solid #fed7aa' }}
          >
            {policies.length}
          </span>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="btn-ghost text-xs py-1 px-2.5"
            title="Refresh"
          >
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr style={{ background: '#faf9f7', borderBottom: '1px solid var(--border)' }}>
                {['File name', 'Uploaded on', ''].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-left" style={{ color: 'var(--ink-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.length ? (
                policies.map((policy) => {
                  const name = policy.file_name ?? policy.policy_name ?? policy;
                  const date = policy.upload_date;
                  const isDeleting = deleting === name;
                  return (
                    <tr
                      key={name}
                      className="transition-colors hover:bg-stone-50"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--ink)' }}>{name}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--ink-muted)' }}>{fmtDate(date)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDelete(name)}
                          className="btn-danger"
                        >
                          {isDeleting ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
                    No policies uploaded yet. Use the form above to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
