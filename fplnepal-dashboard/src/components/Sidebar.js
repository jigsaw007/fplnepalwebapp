import { NavLink } from "react-router-dom";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  // Tailwind link styles
  const linkBase = "flex items-center gap-2 px-3 py-2 rounded-lg transition";
  const linkInactive = "text-white/90 hover:bg-white/10 hover:text-white";
  const linkActive =
    "bg-white/15 text-white font-semibold ring-1 ring-white/20 shadow-sm";

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={toggleSidebar}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        aria-label="Primary sidebar"
        className={`
          fixed left-0 top-0 z-40
          flex flex-col
          h-screen w-72 md:w-64
          bg-gradient-to-b from-purple-900 via-indigo-900 to-indigo-950
          text-white shadow-2xl md:shadow-none
          border-r border-white/10
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-white/10 bg-gradient-to-b from-purple-900/95 to-indigo-900/95 backdrop-blur-md z-10 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="absolute right-4 top-4 md:hidden text-white/80 hover:text-white text-lg transition"
            aria-label="Close sidebar"
            title="Close"
          >
            ✖
          </button>
          <h2 className="text-xl font-extrabold tracking-tight">FPL Nepal</h2>
          <p className="text-xs text-white/60 mt-0.5">Webapp</p>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {/* Section: Main */}
          <div>
            <p className="px-2 mb-2 text-[11px] uppercase tracking-wider text-white/50">
              Main
            </p>
            <div className="space-y-1">
              <NavLink to="/" end className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>🏠</span> <span>Dashboard</span>
              </NavLink>

              <NavLink to="/players" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>⚽</span> <span>Players</span>
              </NavLink>

              <NavLink to="/compare" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>📊</span> <span>Compare</span>
              </NavLink>

              <NavLink to="/history" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>🕓</span> <span>History</span>
              </NavLink>

              <NavLink to="/squad-compare" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>🧩</span> <span>Squad Compare</span>
              </NavLink>

              <NavLink to="/versus" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>⚔️</span> <span>Versus</span>
              </NavLink>
            </div>
          </div>

          {/* Section: FPL Nepal */}
          <div>
            <p className="px-2 mb-2 text-[11px] uppercase tracking-wider text-white/50">
              FPL Nepal
            </p>
            <div className="space-y-1">
              <NavLink to="/captainmode" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>👑</span> <span>Captain Mode</span>
              </NavLink>

              <NavLink to="/worldcup" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>🌍</span> <span>World Cup</span>
              </NavLink>

              <NavLink to="/classic-league" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>🏆</span> <span>Classic League</span>
              </NavLink>

              <NavLink to="/gwwinner" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>🥇</span> <span>GW Winners</span>
              </NavLink>

              <NavLink to="/monthly-winner" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>🏅</span> <span>Manager of the Month</span>
              </NavLink>

              <NavLink to="/elimination" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>🗑️</span> <span>Elimination</span>
              </NavLink>

              {localStorage.getItem("admin_key") && (
                <NavLink to="/elimination-admin" className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }>
                  <span>🔒</span> <span>Elimination Admin</span>
                </NavLink>
              )}

              <NavLink to="/fpllive" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>📈</span> <span>FPLLIVE</span>
              </NavLink>

              <NavLink to="/league-stats" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>📈</span> <span>League Stats</span>
              </NavLink>

              <NavLink to="/tieanalyzer" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>🔍</span> <span>Tie Analyzer</span>
              </NavLink>

              <NavLink to="/check-registration" className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }>
                <span>🧾</span> <span>Check Registration</span>
              </NavLink>
              

              <a
                href="https://www.fplnepal.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkBase} ${linkInactive}`}
              >
                <span>🏡</span> <span>Homepage</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 text-[11px] text-white/50 border-t border-white/10 flex-shrink-0">
          © {new Date().getFullYear()} FPL Nepal
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
