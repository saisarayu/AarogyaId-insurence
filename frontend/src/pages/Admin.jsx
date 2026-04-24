import AdminPanel from '../components/AdminPanel';

const Admin = () => {
  return (
    <div className="space-y-10">
      
      {/* ── Header ── */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--accent)' }}>
          System Administration
        </p>
        <h1 className="font-display text-3xl sm:text-4xl" style={{ color: 'var(--ink)' }}>
          Policy Management
        </h1>
        <p className="text-base max-w-xl" style={{ color: 'var(--ink-muted)' }}>
          Upload, manage, and delete insurance policy documents. The AI model relies strictly on the structured content and embeddings generated from these files.
        </p>
      </div>

      <AdminPanel />
    </div>
  );
};

export default Admin;
