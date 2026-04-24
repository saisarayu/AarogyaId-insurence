import { BrowserRouter as Router, NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

        {/* ── Nav ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">

            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md text-white text-xs font-bold"
                style={{ background: 'var(--accent)' }}
              >
                A
              </span>
              <div>
                <span className="font-display text-base font-medium tracking-tight" style={{ color: 'var(--ink)' }}>
                  AarogyaAid
                </span>
                <span className="ml-2 hidden text-xs text-stone-400 sm:inline">Health Insurance Advisor</span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? 'btn-primary text-xs py-1.5 px-3.5'
                    : 'btn-ghost text-xs py-1.5 px-3.5'
                }
              >
                Recommend
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive
                    ? 'btn-primary text-xs py-1.5 px-3.5'
                    : 'btn-ghost text-xs py-1.5 px-3.5'
                }
              >
                Admin
              </NavLink>
            </nav>
          </div>
        </header>

        {/* ── Page ────────────────────────────────────────── */}
        <main className="mx-auto max-w-5xl px-5 py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="mt-16 border-t py-6 text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}>
          AarogyaAid · AI recommendations are based on uploaded policy documents only · Not financial or medical advice
        </footer>
      </div>
    </Router>
  );
}

export default App;
