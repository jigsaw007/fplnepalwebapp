import { Link } from "react-router-dom";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-red-400 text-white p-6 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform md:relative md:translate-x-0 md:w-1/6 h-screen`}
    >
      <button onClick={toggleSidebar} className="md:hidden text-white text-lg absolute top-4 right-4">
        ✖
      </button>
      <h2 className="text-xl font-bold mb-6">FPL Nepal Dashboard</h2>
      <nav className="space-y-4">
        <Link to="/" className="block hover:bg-gray-700 p-2 rounded">🏠 Dashboard</Link>
        <Link to="/players" className="block hover:bg-gray-700 p-2 rounded">⚽ Players</Link>
        <Link to="/compare" className="block hover:bg-gray-700 p-2 rounded">⚽ Compare</Link>
        <Link to="/history" className="block hover:bg-gray-700 p-2 rounded">⚽ History</Link>
        <Link to="/squad-compare" className="block hover:bg-gray-700 p-2 rounded">⚽ Squad Compare</Link>
        <Link to="/versus" className="block hover:bg-gray-700 p-2 rounded">⚽ Versus</Link>

        <h3 className="text-lg font-semibold mt-4">FPL NEPAL</h3>
        <Link to="/worldcup" className="px-4 py-2 hover:text-purple-600">
  🌍 World Cup
</Link>
        <Link to="/classic-league" className="block hover:bg-gray-700 p-2 rounded">📊 Classic League</Link>
        {/* <Link to="/headtohead-league" className="block hover:bg-gray-700 p-2 rounded">📊 H2H League</Link> */}
        <Link to="/tieanalyzer" className="block hover:bg-gray-700 p-2 rounded">🔍 Tie Analyzer</Link>
        {/* <Link to="/h2htopscorer" className="block hover:bg-gray-700 p-2 rounded">🔍 H2HTopScorer</Link> */}
        <Link to="/check-registration" className="block hover:bg-gray-700 p-2 rounded">🧾 Check Registration</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
