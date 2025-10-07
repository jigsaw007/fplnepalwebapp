import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import usePageTracking from "./pages/usePageTracking";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Compare from "./pages/Compare";
import ClassicLeague from "./pages/ClassicLeague";
// import HeadToHeadLeague from "./pages/HeadToHeadLeague";
import DreamTeam from "./components/DreamTeam";
import Suggestion from "./components/Suggestion";
import Footer from "./components/Footer";
import TieAnalyzer from "./components/TieAnalyzer";
// import H2HTopScorer from "./components/h2htopscorer";
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
import Elimination from "./pages/Elimination"; // public
import EliminationAdmin from "./pages/EliminationAdmin"; // admin
import FPLLive from "./pages/FPLLive";

const AppInner = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Refresh ads on route change
  const AdRefresh = () => {
    useEffect(() => {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    }, [window.location.pathname]);
    return null;
  };

  // Hide sidebar on any /worldcup route
  const { pathname } = useLocation();
  const hideSidebar = pathname.startsWith("/worldcup");

  return (
    <>
      <PageTrackingWrapper />

      {/* ======= PAGE LAYOUT ======= */}
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar (fixed on desktop, slide-in on mobile) */}
        {!hideSidebar && (
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        )}

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            !hideSidebar ? "ml-72 md:ml-64" : "ml-0"
          }`}
        >
          {/* Navbar */}
          <Navbar toggleSidebar={toggleSidebar} showMenu={!hideSidebar} />

          {/* Main Scrollable Area */}
          <main className="flex-1 p-6 overflow-x-hidden overflow-y-auto">
            <Routes>
              {/* --- General Pages --- */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/players" element={<Players />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/classic-league" element={<ClassicLeague />} />
              {/* <Route path="/headtohead-league" element={<HeadToHeadLeague />} /> */}
              <Route path="/dream-team" element={<DreamTeam />} />
              <Route path="/suggestion" element={<Suggestion />} />
              <Route path="/tieanalyzer" element={<TieAnalyzer />} />
              {/* <Route path="/h2htopscorer" element={<H2HTopScorer />} /> */}
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

              {/* --- World Cup Pages (Sidebar Hidden) --- */}
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

              {/* --- Fallback Ad Refresh --- */}
              <Route path="*" element={<AdRefresh />} />
            </Routes>

            {/* Ads Section Below Main Content */}
            <div className="mt-6">
              <AdComponent />
            </div>
          </main>

          {/* Footer Always at Bottom */}
          <Footer />
        </div>
      </div>
    </>
  );
};

// Router wrapper so useLocation works
const App = () => (
  <Router>
    <AppInner />
  </Router>
);

// Wrapper to ensure <Router> exists before usePageTracking()
const PageTrackingWrapper = () => {
  usePageTracking();
  return null;
};

export default App;
