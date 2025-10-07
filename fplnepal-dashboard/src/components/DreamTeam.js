import { useEffect, useState } from "react";
import { fetchDreamTeam, fetchFPLData } from "../api/fplApi";
import { POSITIONS, TEAM_SHORT_NAMES } from "../utils/teamData";

const DreamTeam = () => {
  const [gameweek, setGameweek] = useState(null);
  const [dreamTeam, setDreamTeam] = useState([]);
  const [playersData, setPlayersData] = useState([]);
  const [teamsData, setTeamsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentGameweek, setCurrentGameweek] = useState(null);

  useEffect(() => {
    const getFPLData = async () => {
      setLoading(true);
      const fplData = await fetchFPLData();
      if (fplData) {
        setPlayersData(fplData.elements);
        setTeamsData(fplData.teams);
        const latestGW = fplData.events.find((e) => e.is_current)?.id || 38;
        setCurrentGameweek(latestGW);
        if (gameweek === null) setGameweek(latestGW);
      }
      setLoading(false);
    };
    getFPLData();
  }, []);

  useEffect(() => {
    if (gameweek !== null) fetchDreamTeamData(gameweek);
  }, [gameweek]);

  const fetchDreamTeamData = async (gw) => {
    setLoading(true);
    try {
      const data = await fetchDreamTeam(gw);
      setDreamTeam(data?.team?.length > 0 ? data.team : []);
    } catch (err) {
      console.error("Dream Team fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const changeGameweek = (direction) => {
    setGameweek((prev) => {
      if (prev === null) return prev;
      let newGW = prev + direction;
      if (newGW < 1) newGW = 1;
      if (newGW > currentGameweek) newGW = currentGameweek;
      return newGW;
    });
  };

  const getPlayerDetails = (playerId) =>
    playersData.find((p) => p.id === playerId) || {};

  const getTeamById = (id) => teamsData.find((t) => t.id === id) || {};

  const getKitUrl = (teamCode) =>
    `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-220.webp`;

  const groupByPosition = (players) => {
    const groups = { 1: [], 2: [], 3: [], 4: [] };
    players.forEach((p) => {
      const details = getPlayerDetails(p.element);
      groups[details.element_type]?.push({ ...p, details });
    });
    return groups;
  };

  if (gameweek === null) {
    return (
      <div className="flex justify-center items-center py-6 text-gray-400 text-sm">
        Loading Gameweek Data...
      </div>
    );
  }

  const grouped = groupByPosition(dreamTeam);

  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-950 to-fuchsia-950 p-3 rounded-2xl shadow-md text-white w-full">
      <h2 className="text-base font-bold text-center mb-3 tracking-wide">
        Team of the Week
      </h2>

      {/* Gameweek navigation */}
      <div className="flex justify-center gap-3 mb-3">
        <button
          onClick={() => changeGameweek(-1)}
          disabled={gameweek === 1}
          className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-md disabled:opacity-40"
        >
          ◀ Prev
        </button>
        <span className="text-xs font-semibold bg-white/10 px-2 py-1 rounded-md">
          GW {gameweek}
        </span>
        <button
          onClick={() => changeGameweek(1)}
          disabled={gameweek === currentGameweek}
          className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-md disabled:opacity-40"
        >
          Next ▶
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin h-8 w-8 border-2 border-t-transparent border-white rounded-full"></div>
        </div>
      ) : dreamTeam.length === 0 ? (
        <p className="text-center text-gray-300 text-xs">No data available.</p>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          {Object.entries(grouped).map(([pos, players]) => (
            <div
              key={pos}
              className="flex justify-center flex-wrap gap-2 w-full"
            >
              {players.map((player) => {
                const { details } = player;
                const teamObj = getTeamById(details.team);
                const teamShort = TEAM_SHORT_NAMES[teamObj?.id] || "N/A";
                const teamCode = details.team_code || teamObj?.code;
                const kitSrc = getKitUrl(teamCode);
                const playerImg = `https://resources.premierleague.com/premierleague25/photos/players/110x140/${details.code}.png`;

                return (
                  <div
                    key={player.element}
                    className="relative bg-white/10 hover:bg-white/20 rounded-lg overflow-hidden transition-all duration-200 shadow-sm flex flex-col items-center w-24 sm:w-28"
                  >
                    {/* Player image with overlay */}
                    <div className="relative w-full h-28 flex justify-center items-center bg-black/10">
                      <img
                        src={playerImg}
                        alt={details.web_name}
                        className="max-h-full object-contain"
                        onError={(e) => {
                          e.target.src = kitSrc;
                        }}
                      />
                      <span className="absolute bottom-1 right-1 bg-blue-600 text-white text-[10px] px-2 py-[2px] rounded-full font-semibold shadow-md">
                        {player.points} pts
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col items-center py-1 text-center w-full">
                      <p className="text-[11px] font-semibold leading-tight">
                        {details.web_name}
                      </p>
                      <p className="text-[10px] text-gray-300 leading-tight">
                        {teamShort}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DreamTeam;
