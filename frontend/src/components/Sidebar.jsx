import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Admin Panel', path: '/admin' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3 border-b border-transparent">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          A
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight">AarogyaAid</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">Smart Insurance, Better Future</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Help Widget */}
      <div className="p-4 mb-4">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">💬</div>
            <p className="font-semibold text-slate-800 text-sm">Need Help?</p>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">Our AI assistant is here to help you</p>
          <button 
            onClick={() => {
              if (window.location.pathname !== '/') {
                window.location.href = '/';
              } else {
                document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
          >
            Start Chat
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
