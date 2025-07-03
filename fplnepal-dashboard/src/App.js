import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import usePageTracking from "./pages/usePageTracking";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Compare from "./pages/Compare";
import ClassicLeague from "./pages/ClassicLeague";
import HeadToHeadLeague from "./pages/HeadToHeadLeague";
import DreamTeam from "./components/DreamTeam";
import Suggestion from "./components/Suggestion";
import Footer from "./components/Footer";
import TieAnalyzer from "./components/TieAnalyzer";
import H2HTopScorer from "./components/h2htopscorer";
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


const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Ad Refresh on Route Change
  const AdRefresh = () => {
    useEffect(() => {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    }, [window.location.pathname]); // Refresh ads on route change

    return null;
  };

  return (
    <Router>
      <PageTrackingWrapper />
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-1 flex-col md:flex-row">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          
          <div className="flex-1 flex flex-col">
            <Navbar toggleSidebar={toggleSidebar} />

            {/* Main Content Wrapper */}
            <div className="flex-1 p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/players" element={<Players />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/classic-league" element={<ClassicLeague />} />
                <Route path="/headtohead-league" element={<HeadToHeadLeague />} />
                <Route path="/dream-team" element={<DreamTeam />} />
                <Route path="/suggestion" element={<Suggestion />} />
                <Route path="/tieanalyzer" element={<TieAnalyzer />} />
                <Route path="/h2htopscorer" element={<H2HTopScorer />} />
                <Route path="/history" element={<History />} />
                <Route path="/live" element={<Live />} />
                <Route path="/price-change-prediction" element={<PriceChangePrediction />} />
                <Route path="/squad-compare" element={<SquadCompare />} />
                <Route path="/versus" element={<Versus />} />
                <Route path="/check-registration" element={<CheckRegistration />} /> 
                <Route path="/worldcup" element={<WorldCupLanding />} />
                <Route path="/worldcup/team/:id" element={<WorldCupTeamPage />} />
                <Route path="/worldcup/admin" element={<WorldCupAdmin />} />

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
    </Router>
  );
};

// Wrapper Component to Ensure <Router> Exists Before usePageTracking()
const PageTrackingWrapper = () => {
  usePageTracking();
  return null;
};

export default App;