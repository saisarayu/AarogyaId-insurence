import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    path: '/',
    icon: (
      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    desc: 'Get your recommendation',
  },
  {
    name: 'Admin Panel',
    path: '/admin',
    icon: (
      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    desc: 'Upload & manage policies',
  },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside
      className="w-64 flex flex-col sticky top-0 h-screen overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1a1040 60%, #0f172a 100%)' }}
    >
      {/* Decorative glow orbs */}
      <div
        className="absolute top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
      />
      <div
        className="absolute bottom-32 right-4 w-32 h-32 rounded-full opacity-5 blur-2xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
      />

      {/* Brand */}
      <div className="relative p-6 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
          >
            A
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">AarogyaAid</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">
              Smart Insurance
            </p>
          </div>
        </div>
        {/* Separator */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-3 py-2 space-y-1">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative
                ${isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))',
                boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.3)',
              } : {}}
            >
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
                />
              )}
              <span className={`transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="leading-tight">{item.name}</p>
                <p className={`text-[10px] leading-tight mt-0.5 truncate transition-colors ${isActive ? 'text-indigo-300/70' : 'text-slate-600 group-hover:text-slate-500'}`}>
                  {item.desc}
                </p>
              </div>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Chat helper widget */}
      <div className="relative p-4 pb-5">
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'rgba(99,102,241,0.2)' }}
            >
              💬
            </div>
            <p className="font-semibold text-white text-sm">Need Help?</p>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Ask our AI assistant about any insurance policy.
          </p>
          <button
            onClick={() => {
              if (window.location.pathname !== '/') {
                window.location.href = '/';
              } else {
                document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full text-white text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}
          >
            Start Chat →
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-700 mt-4 tracking-wide">
          AarogyaAid © 2025
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
