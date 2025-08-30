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
import WorldCupLanding from './pages/WorldCup';
import WorldCupTeamPage from './pages/WorldCup/TeamPage';
import WorldCupAdmin from './pages/WorldCup/AdminDashboard';
import AllManagersPage from './pages/WorldCup/AllManagers';
import WorldCupTeamLanding from './pages/WorldCup/TeamLanding';
import ListofManagers from './pages/WorldCup/ListofManagers';
import FixturePage from './pages/WorldCup/Fixtures';
import Results from './pages/WorldCup/Results';
import GroupsPage from './pages/WorldCup/Groups';
import CaptainMode from "./pages/CaptainMode";
import GWwinner from "./pages/GWwinner";
import LeagueStats from "./pages/LeagueStats";


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
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-1 flex-col md:flex-row">
          {/* Sidebar is hidden for /worldcup routes */}
          {!hideSidebar && (
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          )}

          <div className="flex-1 flex flex-col min-w-0">
            {/* Hide hamburger menu when sidebar is hidden */}
            <Navbar toggleSidebar={toggleSidebar} showMenu={!hideSidebar} />

            {/* Main Content Wrapper */}
            <div className="flex-1 p-6 min-w-0 overflow-x-hidden">
              <Routes>
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
                <Route path="/price-change-prediction" element={<PriceChangePrediction />} />
                <Route path="/squad-compare" element={<SquadCompare />} />
                <Route path="/versus" element={<Versus />} />
                <Route path="/check-registration" element={<CheckRegistration />} /> 
                <Route path="/captainmode" element={<CaptainMode />} />
                <Route path="/gwwinner" element={<GWwinner />} />
                 <Route path="/league-stats" element={<LeagueStats />} />



                {/* World Cup routes */}
                <Route path="/worldcup" element={<WorldCupLanding />} />
                <Route path="/worldcup/team/:id" element={<WorldCupTeamPage />} />
                <Route path="/worldcup/admin" element={<WorldCupAdmin />} />
                <Route path="/worldcup/all-managers" element={<AllManagersPage />} />
                <Route path="/worldcup/team" element={<WorldCupTeamLanding />} />
                <Route path="/worldcup/list" element={<ListofManagers />} />
                <Route path="/worldcup/fixtures" element={<FixturePage />} />
                <Route path="/worldcup/results" element={<Results />} />
                <Route path="/worldcup/groups" element={<GroupsPage />} />

                {/* Ad Refresh trigger */}
                <Route path="*" element={<AdRefresh />} />
              </Routes>

              {/* Ad Component Placed Below Routes */}
              <div className="mt-6">
                <AdComponent />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Always Stays at Bottom */}
        <Footer />
      </div>
    </>
  );
};

// App with Router wrapper so useLocation works
const App = () => (
  <Router>
    <AppInner />
  </Router>
);

// Wrapper Component to Ensure <Router> Exists Before usePageTracking()
const PageTrackingWrapper = () => {
  usePageTracking();
  return null;
};

export default App;
