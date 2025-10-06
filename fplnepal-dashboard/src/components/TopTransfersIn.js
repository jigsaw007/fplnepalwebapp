import { useEffect, useState } from "react";
import { fetchFPLData, fetchTransfersData } from "../api/fplApi";

const TopTransfersIn = () => {
  const [topTransfers, setTopTransfers] = useState([]);
  const [teamsData, setTeamsData] = useState([]);

  useEffect(() => {
    const getTransfers = async () => {
      const fplData = await fetchFPLData(); // ✅ to get team info
      if (fplData) {
        setTeamsData(fplData.teams);
      }

      const transfers = await fetchTransfersData();
      if (transfers) {
        const sortedPlayers = transfers
          .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
          .slice(0, 5);
        setTopTransfers(sortedPlayers);
      }
    };
    getTransfers();
  }, []);

  const getTeamById = (teamId) => teamsData.find((t) => t.id === teamId);

  const getKitUrl = (teamCode, elementType) => {
    const suffix = elementType === 1 ? "_1" : ""; // GKP = 1
    return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${suffix}-220.webp`;
  };

  if (topTransfers.length === 0)
    return <p className="text-gray-600 text-center">Loading...</p>;

  const positionMap = {
    1: "GKP",
    2: "DEF",
    3: "MID",
    4: "FWD",
  };

  return (
    <div className="bg-purple-950 text-white p-2 shadow-md rounded-lg text-xs">
      <h2 className="text-sm font-bold text-center mb-1">Top Transfers In ↑</h2>
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
                    e.target.src = `https://resources.premierleague.com/premierleague/badges/t${team?.code}.png`;
                  }}
                />
                <span className="font-medium text-xs">
                  {player.web_name} ({positionMap[player.element_type] || "N/A"})
                </span>
              </div>
              <span className="bg-green-600 text-white px-1 py-0.5 rounded-md text-xs font-semibold">
                {player.transfers_in_event.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopTransfersIn;
