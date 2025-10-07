import { useEffect, useState } from "react";
import { FaFutbol, FaHandsHelping, FaHandPaper } from "react-icons/fa";
import { fetchFPLData } from "../api/fplApi";

const TopStats = () => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchFPLData();
      if (!data || !data.elements) return;
      setPlayers(data.elements);
    };
    loadData();
  }, []);

  // Helper: get top 1 player by stat type
  const getTopPlayer = (key) => {
    const sorted = [...players].sort((a, b) => b[key] - a[key]);
    const p = sorted[0];
    if (!p) return null;

    return {
      id: p.id,
      name: p.web_name,
      stat: p[key],
      code: p.code,
      team: p.team,
      // ✅ Correct 2025 image URL pattern
      image: `https://resources.premierleague.com/premierleague25/photos/players/110x140/${p.code}.png`,
    };
  };

  const topScorer = getTopPlayer("goals_scored");
  const topAssist = getTopPlayer("assists");
  const topCleanSheet = getTopPlayer("clean_sheets");

  const sections = [
    {
      title: "Top Scorer",
      icon: <FaFutbol className="text-green-400 text-xl" />,
      player: topScorer,
      color: "from-green-900/50 to-green-800/30",
    },
    {
      title: "Top Assists",
      icon: <FaHandsHelping className="text-yellow-300 text-xl" />,
      player: topAssist,
      color: "from-yellow-900/50 to-yellow-800/30",
    },
    {
      title: "Clean Sheets",
      icon: <FaHandPaper className="text-cyan-300 text-xl" />,
      player: topCleanSheet,
      color: "from-cyan-900/50 to-cyan-800/30",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-950 to-fuchsia-950 p-4 rounded-2xl shadow-lg text-white w-full">
      <h2 className="text-lg font-bold text-center mb-4 tracking-wide">
        Top Stats
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sections.map((section, i) => (
          <div
            key={i}
            className={`bg-gradient-to-b ${section.color} rounded-xl p-4 shadow-inner border border-white/10 flex flex-col items-center justify-center hover:scale-[1.03] transition-all duration-200`}
          >
            <div className="flex items-center gap-2 mb-3">
              {section.icon}
              <h3 className="text-sm font-semibold">{section.title}</h3>
            </div>

            {section.player ? (
              <div className="flex flex-col items-center text-center">
                <img
                  src={section.player.image}
                  alt={section.player.name}
                  className="w-28 h-36 mb-2 object-cover rounded-md border border-white/20 shadow-md"
                />
                <p className="text-sm font-semibold">{section.player.name}</p>
                <p className="text-xs text-white/70 mt-1">
                  {section.title === "Top Scorer"
                    ? `${section.player.stat} Goals`
                    : section.title === "Top Assists"
                    ? `${section.player.stat} Assists`
                    : `${section.player.stat} Clean Sheets`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-300">Loading...</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopStats;
