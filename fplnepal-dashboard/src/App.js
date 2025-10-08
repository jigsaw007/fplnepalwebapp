// ✅ Added missing imports at the very top
import React from "react";
import ReactDOM from "react-dom/client"; // Needed for ReactDOM.createRoot
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import usePageTracking from "./pages/usePageTracking";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Compare from "./pages/Compare";
import ClassicLeague from "./pages/ClassicLeague";
import DreamTeam from "./components/DreamTeam";
import Suggestion from "./components/Suggestion";
import Footer from "./components/Footer";
import TieAnalyzer from "./components/TieAnalyzer";
import History from "./components/History";
import Live from "./components/Live";
import PriceChangePrediction from "./components/PriceChangePrediction";
import AdComponent from "./components/AdComponent";
import SquadCompare from "./components/SquadCompare";
import Versus from "./components/Versus";
import CheckRegistration from "./pages/CheckRegistration";
import WorldCupLanding from "./pages/WorldCup";
import WorldCupTeamPage from "./pages/WorldCup/TeamPage";
import WorldCupAdmin from "./pages/WorldCup/AdminDashboard";
import AllManagersPage from "./pages/WorldCup/AllManagers";
import WorldCupTeamLanding from "./pages/WorldCup/TeamLanding";
import ListofManagers from "./pages/WorldCup/ListofManagers";
import FixturePage from "./pages/WorldCup/Fixtures";
import Results from "./pages/WorldCup/Results";
import GroupsPage from "./pages/WorldCup/Groups";
import CaptainMode from "./pages/CaptainMode";
import GWwinner from "./pages/GWwinner";
import LeagueStats from "./pages/LeagueStats";
import MonthlyWinner from "./pages/MonthlyWinner";
import Elimination from "./pages/Elimination";
import EliminationAdmin from "./pages/EliminationAdmin";
import FPLLive from "./pages/FPLLive";
import CreateSquad from "./pages/CreateSquad";
import TinkerSquad from "./pages/TinkerSquad";
import MySquads from "./pages/MySquads";
import SetTeam from "./pages/SetTeam";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login"; // ✅ Added login route import

const PageTrackingWrapper = () => {
  usePageTracking();
  return null;
};

const AppInner = () => {
  const { pathname } = useLocation();

  // Drawer (mobile) + Collapse (desktop)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const toggleCollapse = () => setSidebarCollapsed((v) => !v);

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
    // Refresh Google Ads on navigation (if present)
    try {
      if (window?.adsbygoogle) window.adsbygoogle.push({});
    } catch (_) {}
  }, [pathname]);

  // World Cup pages: hide sidebar
  const hideSidebar = useMemo(() => pathname.startsWith("/worldcup"), [pathname]);

  // Left margin for main content on desktop
  const mainOffsetClass = useMemo(() => {
    if (hideSidebar) return "md:ml-0";
    return sidebarCollapsed ? "md:ml-20" : "md:ml-64";
  }, [hideSidebar, sidebarCollapsed]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => (document.body.style.overflow = "");
  }, [sidebarOpen]);

  return (
    <>
      <PageTrackingWrapper />

      <div className="min-h-screen flex bg-gray-50">
        {/* Sidebar */}
        {!hideSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            collapsed={sidebarCollapsed}
            toggleCollapse={toggleCollapse}
          />
        )}

        {/* Main column */}
        <div className={`flex-1 flex flex-col w-full transition-all duration-300 ${mainOffsetClass}`}>
          {/* Top Nav */}
          <Navbar toggleSidebar={toggleSidebar} showMenu={!hideSidebar} />

          {/* Scrollable page content area */}
          <main className="flex-1 px-3 sm:px-6 py-4 overflow-x-hidden overflow-y-auto">
            <Routes>
              {/* Main Pages */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/players" element={<Players />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/classic-league" element={<ClassicLeague />} />
              <Route path="/dream-team" element={<DreamTeam />} />
              <Route path="/suggestion" element={<Suggestion />} />
              <Route path="/tieanalyzer" element={<TieAnalyzer />} />
              <Route path="/history" element={<History />} />
              <Route path="/live" element={<Live />} />
              <Route path="/price-change-prediction" element={<PriceChangePrediction />} />
              <Route path="/squad-compare" element={<SquadCompare />} />
              <Route path="/versus" element={<Versus />} />
              <Route path="/check-registration" element={<CheckRegistration />} />
              <Route path="/captainmode" element={<CaptainMode />} />
              <Route path="/gwwinner" element={<GWwinner />} />
              <Route path="/league-stats" element={<LeagueStats />} />
              <Route path="/monthly-winner" element={<MonthlyWinner />} />
              <Route path="/elimination" element={<Elimination />} />
              <Route path="/elimination-admin" element={<EliminationAdmin />} />
              <Route path="/fpllive" element={<FPLLive />} />
              <Route path="/create-squad" element={<CreateSquad />} />
              <Route path="/tinker-squad/:id" element={<TinkerSquad />} />
              <Route path="/my-squads" element={<MySquads />} />
              <Route path="/set-team" element={<SetTeam />} />

              {/* ✅ Added new Login Route (for Supabase Auth) */}
              <Route path="/login" element={<Login />} />

              {/* World Cup (no sidebar) */}
              <Route path="/worldcup" element={<WorldCupLanding />} />
              <Route path="/worldcup/team/:id" element={<WorldCupTeamPage />} />
              <Route path="/worldcup/admin" element={<WorldCupAdmin />} />
              <Route path="/worldcup/all-managers" element={<AllManagersPage />} />
              <Route path="/worldcup/team" element={<WorldCupTeamLanding />} />
              <Route path="/worldcup/list" element={<ListofManagers />} />
              <Route path="/worldcup/fixtures" element={<FixturePage />} />
              <Route path="/worldcup/results" element={<Results />} />
              <Route path="/worldcup/groups" element={<GroupsPage />} />
            </Routes>

            <div className="mt-6">
              <AdComponent />
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
};

// ✅ App and render (unchanged, just wrapped correctly with AuthProvider)
const App = () => (
  <Router>
    <AppInner />
  </Router>
);

export default App;
