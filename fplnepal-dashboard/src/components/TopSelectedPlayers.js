import { useEffect, useState } from "react";
import { fetchFPLData } from "../api/fplApi";

const TopSelectedPlayers = () => {
  const [topPlayers, setTopPlayers] = useState([]);
  const [teamsData, setTeamsData] = useState([]);

  useEffect(() => {
    const getTopPlayers = async () => {
      const data = await fetchFPLData();
      if (data) {
        setTeamsData(data.teams);

        // Sort by highest "selected_by_percent"
        const sortedPlayers = [...data.elements].sort(
          (a, b) =>
            parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent)
        );

        // Top 3 most selected
        setTopPlayers(sortedPlayers.slice(0, 3));
      }
    };
    getTopPlayers();
  }, []);

  const getTeamById = (teamId) => teamsData.find((t) => t.id === teamId);

  if (topPlayers.length === 0)
    return <p className="text-gray-600 text-center">Loading...</p>;

  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-950 to-fuchsia-950 p-4 rounded-2xl shadow-md text-white">
      <h2 className="text-base font-bold text-center mb-4 tracking-wide">
        Most Selected Players
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topPlayers.map((player) => {
          const team = getTeamById(player.team);

          // ✅ Correct 2025 player image URL (no "p" prefix)
          const playerPhoto = `https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`;

          // Fallbacks in case a face image is missing
          const kitFallback = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${player.team_code}-220.webp`;
          const badgeFallback = team
            ? `https://resources.premierleague.com/premierleague/badges/t${team.code}.png`
            : `https://fantasy.premierleague.com/dist/img/badges/badge-default.png`;

          return (
            <div
              key={player.id}
              className="bg-white/10 hover:bg-white/20 rounded-xl flex flex-col items-center text-center p-3 transition-all duration-200"
            >
              {/* Player Photo (with robust fallback chain) */}
              <img
                src={playerPhoto}
                alt={player.web_name}
                className="w-20 h-24 mb-2 object-cover rounded-md border border-white/20 shadow"
                onError={(e) => {
                  // try kit, then badge
                  if (!e.target.dataset.triedkit) {
                    e.target.dataset.triedkit = "1";
                    e.target.src = kitFallback;
                  } else {
                    e.target.src = badgeFallback;
                  }
                }}
              />

              <h3 className="text-sm font-semibold mb-1">{player.web_name}</h3>
              <p className="text-[11px] text-gray-300 mb-1">
                {team?.name || "Unknown"}
              </p>

              <p className="text-xs font-semibold text-green-400 bg-white/10 px-2 py-1 rounded-md">
                {parseFloat(player.selected_by_percent).toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopSelectedPlayers;
