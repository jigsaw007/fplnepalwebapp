import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_TRACKING_ID = "G-9HXXFE93ZC"; // Replace with your actual Google Analytics ID//

const usePageTracking = () => {
  const location = useLocation();  // ✅ Ensures it is used inside <Router>

  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", GA_TRACKING_ID, {
        page_path: location.pathname,
      });
    }
  }, [location]);  // ✅ Runs only when route changes
};

export default usePageTracking;
