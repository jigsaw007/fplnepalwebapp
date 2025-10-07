import { NavLink } from "react-router-dom";
import { useState } from "react";

const Sidebar = ({ isOpen, toggleSidebar, collapsed, toggleCollapse }) => {
  const [hovered, setHovered] = useState(false);

  const linkBase =
    "flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm";
  const linkInactive =
    "text-white/90 hover:bg-white/10 hover:text-white";
  const linkActive =
    "bg-white/15 text-white font-semibold ring-1 ring-white/20";

  return (
    <>
      {/* ===== Overlay for mobile ===== */}
      <div
        onClick={toggleSidebar}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity md:hidden z-40 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ===== Sidebar Container ===== */}
      <aside
        aria-label="Sidebar"
        className={`
          fixed left-0 top-0 z-50 flex flex-col h-screen
          ${collapsed ? "md:w-20" : "md:w-64"} w-72
          bg-gradient-to-b from-purple-900 via-indigo-900 to-indigo-950 text-white border-r border-white/10
          transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ===== Header ===== */}
        <div className="relative px-5 py-4 border-b border-white/10 bg-gradient-to-b from-purple-900/90 to-indigo-900/90 backdrop-blur">
          {/* Mobile close button */}
          <button
            onClick={toggleSidebar}
            className="absolute right-4 top-4 md:hidden text-white/80 hover:text-white text-lg"
            aria-label="Close sidebar"
            title="Close"
          >
            ✖
          </button>

          <h2
            className={`text-xl font-extrabold tracking-tight transition-all duration-300 ${
              collapsed && !hovered ? "opacity-0 w-0" : "opacity-100 w-auto"
            }`}
          >
            FPL Nepal
          </h2>
          {!collapsed && (
            <p className="text-xs text-white/60 mt-0.5">Webapp</p>
          )}

          {/* Collapse toggle for desktop */}
          <button
            onClick={toggleCollapse}
            className="hidden md:block absolute right-3 top-4 text-white/70 hover:text-white text-xl transition-transform duration-300"
            title="Toggle collapse"
          >
            ☰
          </button>
        </div>

        {/* ===== Navigation ===== */}
        <nav
          className={`flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none transition-all duration-300 ${
            collapsed ? "items-center" : ""
          }`}
        >
          {/* --- Main Section --- */}
          <div>
            {!collapsed && (
              <p className="px-2 mb-2 text-[11px] uppercase tracking-wider text-white/50">
                Main
              </p>
            )}
            <div className="space-y-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>🏠</span>
                {!collapsed && <span>Dashboard</span>}
              </NavLink>

              <NavLink
                to="/players"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>⚽</span>
                {!collapsed && <span>Players</span>}
              </NavLink>

              <NavLink
                to="/compare"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>📊</span>
                {!collapsed && <span>Compare</span>}
              </NavLink>

              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>🕓</span>
                {!collapsed && <span>History</span>}
              </NavLink>

              <NavLink
                to="/squad-compare"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>🧩</span>
                {!collapsed && <span>Squad Compare</span>}
              </NavLink>

              <NavLink
                to="/versus"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>⚔️</span>
                {!collapsed && <span>Versus</span>}
              </NavLink>
            </div>
          </div>

          {/* --- FPL Nepal Section --- */}
          <div>
            {!collapsed && (
              <p className="px-2 mb-2 text-[11px] uppercase tracking-wider text-white/50">
                FPL Nepal
              </p>
            )}
            <div className="space-y-1">
              <NavLink
                to="/captainmode"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>👑</span>
                {!collapsed && <span>Captain Mode</span>}
              </NavLink>

              <NavLink
                to="/worldcup"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>🌍</span>
                {!collapsed && <span>World Cup</span>}
              </NavLink>

              <NavLink
                to="/classic-league"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>🏆</span>
                {!collapsed && <span>Classic League</span>}
              </NavLink>

              <NavLink
                to="/gwwinner"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>🥇</span>
                {!collapsed && <span>GW Winners</span>}
              </NavLink>

              <NavLink
                to="/monthly-winner"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>🏅</span>
                {!collapsed && <span>Manager of the Month</span>}
              </NavLink>

              <NavLink
                to="/elimination"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>🗑️</span>
                {!collapsed && <span>Elimination</span>}
              </NavLink>

              {localStorage.getItem("admin_key") && (
                <NavLink
                  to="/elimination-admin"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  <span>🔒</span>
                  {!collapsed && <span>Elimination Admin</span>}
                </NavLink>
              )}

              <NavLink
                to="/fpllive"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>📈</span>
                {!collapsed && <span>FPLLIVE</span>}
              </NavLink>

              <NavLink
                to="/league-stats"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>📊</span>
                {!collapsed && <span>League Stats</span>}
              </NavLink>

              <NavLink
                to="/tieanalyzer"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>🔍</span>
                {!collapsed && <span>Tie Analyzer</span>}
              </NavLink>

              <NavLink
                to="/check-registration"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span>🧾</span>
                {!collapsed && <span>Check Registration</span>}
              </NavLink>

              <a
                href="https://www.fplnepal.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkBase} ${linkInactive}`}
              >
                <span>🏡</span>
                {!collapsed && <span>Homepage</span>}
              </a>

              <a
                href="https://blog.fplnepal.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkBase} ${linkInactive}`}
              >
                <span>📰</span>
                {!collapsed && <span>Blog</span>}
              </a>
            </div>
          </div>
        </nav>

        {/* ===== Footer ===== */}
        <div className="text-[10px] text-center text-white/50 py-3 border-t border-white/10">
          © 2025 FPL Nepal
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
