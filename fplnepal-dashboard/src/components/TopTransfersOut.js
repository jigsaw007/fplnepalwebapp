import { useEffect, useState } from "react";
import { fetchFPLData, fetchTransfersData } from "../api/fplApi";

const TopTransfersOut = () => {
  const [topTransfers, setTopTransfers] = useState([]);
  const [teamsData, setTeamsData] = useState([]);

  useEffect(() => {
    const getTransfers = async () => {
      // ✅ Fetch base FPL data for team info
      const fplData = await fetchFPLData();
      if (fplData) setTeamsData(fplData.teams);

      // ✅ Fetch transfers data and sort top 5 transfers OUT
      const transfers = await fetchTransfersData();
      if (transfers) {
        const sortedPlayers = transfers
          .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
          .slice(0, 5);
        setTopTransfers(sortedPlayers);
      }
    };
    getTransfers();
  }, []);

  // Helper to get team object
  const getTeamById = (teamId) => teamsData.find((t) => t.id === teamId);

  // ✅ Helper to build live kit image URL
  const getKitUrl = (teamCode, elementType) => {
    const suffix = elementType === 1 ? "_1" : ""; // GKP = 1
    return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${suffix}-220.webp`;
  };

  if (topTransfers.length === 0)
    return <p className="text-gray-600 text-center">Loading...</p>;

  // Position mapping from FPL element_type
  const positionMap = {
    1: "GKP",
    2: "DEF",
    3: "MID",
    4: "FWD",
  };

  return (
    <div className="bg-purple-950 text-white p-2 shadow-md rounded-lg text-xs">
      <h2 className="text-sm font-bold text-center mb-1">Top Transfers Out ↓</h2>

      <div className="space-y-1">
        {topTransfers.map((player) => {
          const team = getTeamById(player.team);
          const kitUrl = getKitUrl(team?.code, player.element_type);

          return (
            <div
              key={player.id}
              className="flex justify-between items-center bg-white text-black p-1 rounded-md shadow-sm"
            >
              <div className="flex items-center space-x-1">
                <img
                  src={kitUrl}
                  alt={team?.name || "Team"}
                  className="w-5 h-5"
                  onError={(e) => {
                    // /✅ fallback to badge if kit not found
                    e.target.src = `https://resources.premierleague.com/premierleague/badges/t${team?.code}.png`;
                  }}
                />
                <span className="font-medium text-xs">
                  {player.web_name} ({positionMap[player.element_type] || "N/A"})
                </span>
              </div>

              <span className="bg-red-600 text-white px-1 py-0.5 rounded-md text-xs font-semibold">
                {player.transfers_out_event.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopTransfersOut;
