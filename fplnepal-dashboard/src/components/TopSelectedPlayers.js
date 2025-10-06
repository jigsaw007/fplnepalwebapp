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

        // Sort players by selected percentage
        const sortedPlayers = data.elements.sort(
          (a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent)
        );

        // Top 3 most selected players
        setTopPlayers(sortedPlayers.slice(0, 3));
      }
    };
    getTopPlayers();
  }, []);

  // Helper to get team object by ID
  const getTeamById = (teamId) => teamsData.find((t) => t.id === teamId);

  // Helper to get live kit URL
  const getKitUrl = (teamCode, elementType) => {
    // GKP = 1 in FPL, add _1 suffix for goalkeeper kits
    const suffix = elementType === 1 ? "_1" : "";
    return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${suffix}-220.webp`;
  };

  if (topPlayers.length === 0)
    return <p className="text-gray-600 text-center">Loading...</p>;

  return (
    <div className="bg-purple-950 p-2 shadow-md rounded-lg text-sm">
      <h2 className="text-md font-bold text-center mb-2 text-white">
        Most Selected Players
      </h2>

      <div className="flex flex-col items-center w-full gap-6">
        {topPlayers.map((player) => {
          const team = getTeamById(player.team);
          const kitUrl = getKitUrl(team?.code, player.element_type);

          return (
            <div
              key={player.id}
              className="bg-green-300 p-2 rounded-lg shadow flex items-center justify-between w-full h-15"
            >
              <img
                src={kitUrl}
                alt={team?.name || "Team"}
                className="w-10 h-10"
                onError={(e) => {
                  // fallback to badge if kit fails
                  e.target.src = `https://resources.premierleague.com/premierleague/badges/t${team?.code}.png`;
                }}
              />
              <h3 className="text-xs font-semibold w-16 text-center">
                {player.web_name}
              </h3>
              <p className="text-xs text-purple-950 w-10 text-right">
                {player.selected_by_percent}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopSelectedPlayers;
