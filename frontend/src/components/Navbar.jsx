import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/':      { title: 'Get Recommendation', sub: 'AI-powered health insurance advisor' },
  '/admin': { title: 'Admin Panel',        sub: 'Manage and upload policy documents'  },
};

const Navbar = ({ userName = 'User' }) => {
  const location = useLocation();
  const { title, sub } = PAGE_TITLES[location.pathname] ?? { title: 'AarogyaAid', sub: '' };
  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200/70">
      <div className="px-8 h-16 flex items-center justify-between">
        {/* Left: breadcrumb / page title */}
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-tight">{title}</h2>
            <p className="text-xs text-slate-400 leading-tight mt-0.5">{sub}</p>
          </div>
        </div>

        {/* Right: status + avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Live AI status dot */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">AI Online</span>
          </div>

          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            title={userName}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
