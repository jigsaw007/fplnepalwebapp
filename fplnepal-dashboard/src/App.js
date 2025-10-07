import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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

const AppInner = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const AdRefresh = () => {
    useEffect(() => {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    }, [window.location.pathname]);
    return null;
  };

  const { pathname } = useLocation();
  const hideSidebar = pathname.startsWith("/worldcup");

  return (
    <>
      <PageTrackingWrapper />

      {/* ======= PAGE STRUCTURE ======= */}
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Sidebar */}
        {!hideSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            collapsed={sidebarCollapsed}
            toggleCollapse={toggleCollapse}
          />
        )}

        {/* Main Area */}
        <div
          className={`flex-1 flex flex-col w-full transition-all duration-300 ${
            hideSidebar
              ? "ml-0"
              : sidebarCollapsed
              ? "md:ml-20"
              : "md:ml-64"
          }`}
        >
          {/* Navbar */}
          <Navbar toggleSidebar={toggleSidebar} showMenu={!hideSidebar} />

          {/* Scrollable Content */}
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
              <Route
                path="/price-change-prediction"
                element={<PriceChangePrediction />}
              />
              <Route path="/squad-compare" element={<SquadCompare />} />
              <Route path="/versus" element={<Versus />} />
              <Route
                path="/check-registration"
                element={<CheckRegistration />}
              />
              <Route path="/captainmode" element={<CaptainMode />} />
              <Route path="/gwwinner" element={<GWwinner />} />
              <Route path="/league-stats" element={<LeagueStats />} />
              <Route path="/monthly-winner" element={<MonthlyWinner />} />
              <Route path="/elimination" element={<Elimination />} />
              <Route path="/elimination-admin" element={<EliminationAdmin />} />
              <Route path="/fpllive" element={<FPLLive />} />

              {/* World Cup Pages (no sidebar) */}
              <Route path="/worldcup" element={<WorldCupLanding />} />
              <Route path="/worldcup/team/:id" element={<WorldCupTeamPage />} />
              <Route path="/worldcup/admin" element={<WorldCupAdmin />} />
              <Route
                path="/worldcup/all-managers"
                element={<AllManagersPage />}
              />
              <Route path="/worldcup/team" element={<WorldCupTeamLanding />} />
              <Route path="/worldcup/list" element={<ListofManagers />} />
              <Route path="/worldcup/fixtures" element={<FixturePage />} />
              <Route path="/worldcup/results" element={<Results />} />
              <Route path="/worldcup/groups" element={<GroupsPage />} />

              {/* Fallback */}
              <Route path="*" element={<AdRefresh />} />
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

const App = () => (
  <Router>
    <AppInner />
  </Router>
);

const PageTrackingWrapper = () => {
  usePageTracking();
  return null;
};

export default App;
