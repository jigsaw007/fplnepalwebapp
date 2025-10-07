import { useEffect, useState } from "react";
import { fetchFPLData, fetchTransfersData } from "../api/fplApi";

const TopTransfersIn = () => {
  const [topTransfers, setTopTransfers] = useState([]);
  const [teamsData, setTeamsData] = useState([]);

  useEffect(() => {
    const getTransfers = async () => {
      const fplData = await fetchFPLData(); // ✅ for team info
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
    // ✅ Proper official kit URL pattern
    const suffix = elementType === 1 ? "_1" : ""; // GK kits if needed
    return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${suffix}-220.webp`;
  };

  if (topTransfers.length === 0)
    return (
      <div className="flex justify-center items-center py-6 text-gray-400 text-xs">
        Loading top transfers...
      </div>
    );

  const positionMap = {
    1: "GKP",
    2: "DEF",
    3: "MID",
    4: "FWD",
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-950 to-fuchsia-950 p-4 rounded-2xl shadow-lg text-white w-full">
      <h2 className="text-lg font-bold text-center mb-4 tracking-wide">
        Top Transfers In
      </h2>

      <div className="flex flex-col gap-3">
        {topTransfers.map((player, index) => {
          const team = getTeamById(player.team);
          const kitUrl = team
            ? getKitUrl(team.code, player.element_type)
            : "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_1-220.webp"; // fallback kit

          return (
            <div
              key={player.id}
              className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl p-2 transition-all duration-200 shadow-sm"
            >
              {/* Left side — player kit */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={kitUrl}
                    alt={team?.name || "Team"}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      e.target.src =
                        "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_1-220.webp";
                    }}
                  />
                  <span className="absolute -top-1 -left-1 bg-green-600 text-[10px] px-1 rounded-sm">
                    #{index + 1}
                  </span>
                </div>

                {/* Player info */}
                <div className="flex flex-col">
                  <span className="font-semibold text-sm leading-tight">
                    {player.web_name}
                  </span>
                  <span className="text-[10px] text-gray-300">
                    {team?.short_name || "UNK"} •{" "}
                    {positionMap[player.element_type] || "N/A"}
                  </span>
                </div>
              </div>

              {/* Right side — transfer count */}
              <div className="text-right">
                <span className="text-xs bg-green-600 px-2 py-1 rounded-md font-semibold shadow-sm">
                  +{player.transfers_in_event.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopTransfersIn;
