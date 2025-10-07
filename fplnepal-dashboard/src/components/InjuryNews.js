import { useEffect, useState } from "react";
import { fetchInjuryNews } from "../api/fplApi"; 
import { 
  FaUserInjured, FaBandAid, FaPlane, FaMoneyBillWave, FaBan, 
  FaQuestionCircle, FaExclamationTriangle 
} from "react-icons/fa";

const InjuryNews = () => {
  const [news, setNews] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5; // ✅ Show 5 items per page

  useEffect(() => {
    const getInjuryNews = async () => {
      setLoading(true);
      const data = await fetchInjuryNews();
      if (data) {
        const shuffledNews = data.sort(() => Math.random() - 0.5); // ✅ Shuffle the order
        setNews(shuffledNews);
      }
      setLoading(false);
    };
    getInjuryNews();
  }, []);

  // ✅ Get relevant icon based on news text
  const getNewsIcon = (newsText) => {
    if (!newsText) return <FaExclamationTriangle className="text-yellow-400 text-lg" />;

    const lower = newsText.toLowerCase();
    if (lower.includes("injury")) return <FaUserInjured className="text-red-600 text-lg" />;
    if (lower.includes("knock")) return <FaBandAid className="text-yellow-500 text-lg" />;
    if (lower.includes("loan")) return <FaPlane className="text-blue-500 text-lg" />;
    if (lower.includes("transfer")) return <FaMoneyBillWave className="text-green-400 text-lg" />;
    if (lower.includes("suspend")) return <FaBan className="text-red-700 text-lg" />;
    if (lower.includes("parent club")) return <FaBan className="text-gray-500 text-lg" />;
    if (lower.includes("unknown")) return <FaQuestionCircle className="text-gray-400 text-lg" />;
    return <FaExclamationTriangle className="text-yellow-400 text-lg" />;
  };

  // ✅ Pagination logic
  const startIndex = currentPage * itemsPerPage;
  const paginatedNews = news.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(news.length / itemsPerPage);

  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-950 to-fuchsia-950 p-4 rounded-2xl shadow-lg text-white text-sm">
      <h2 className="text-base font-bold text-center mb-3 tracking-wide">
        Injuries & Suspensions
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : (
        <>
          {/* ✅ Player Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {paginatedNews.map((player) => {
              const kitUrl = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${player.team_code}-220.webp`;
              const newsIcon = getNewsIcon(player.news);

              return (
                <div
                  key={player.id}
                  className="bg-white/10 hover:bg-white/20 rounded-xl shadow-md flex flex-col items-center text-center p-3 transition-all duration-200"
                >
                  {/* ✅ Team Kit */}
                  <img
                    src={kitUrl}
                    alt={player.web_name}
                    className="w-14 h-14 mb-2 object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://resources.premierleague.com/premierleague/badges/t${player.team_code}.png`;
                    }}
                  />

                  {/* Player Info */}
                  <h3 className="text-sm font-semibold mb-1">{player.web_name}</h3>
                  {newsIcon}
                  <p className="text-[11px] text-gray-300 mt-1 line-clamp-2 px-2">
                    {player.news || "No update available"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ✅ Pagination Buttons */}
          <div className="flex justify-center mt-5 gap-3">
            <button
              className="px-4 py-1.5 bg-gray-500/70 hover:bg-gray-500 text-white rounded-md text-xs font-semibold disabled:opacity-40"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              ◀ Prev
            </button>
            <button
              className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs font-semibold disabled:opacity-40"
              disabled={currentPage + 1 >= totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next ▶
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default InjuryNews;
