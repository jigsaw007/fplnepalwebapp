import { useEffect, useState } from "react";
import { fetchFPLData } from "../api/fplApi";
import { FaStar, FaPlus } from "react-icons/fa";

const Compare = () => {
  const [teams, setTeams] = useState({});          // id -> name
  const [players, setPlayers] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState(["", ""]);
  const [selectedPlayers, setSelectedPlayers] = useState(["", ""]);
  const [playerData, setPlayerData] = useState([null, null]);
  const [showThirdPlayer, setShowThirdPlayer] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetchFPLData();
      if (!data) return;

      // map: id -> name
      const teamsMap = {};
      for (const t of data.teams || []) teamsMap[t.id] = t.name;
      setTeams(teamsMap);

      // keep full list; sort for nicer UI
      setPlayers([...(data.elements || [])].sort((a, b) =>
        a.web_name.localeCompare(b.web_name)
      ));
    })();
  }, []);

  const handleSelectPlayer = (playerId, idx) => {
    const sel = players.find(p => p.id === Number(playerId)) || null;
    setPlayerData(prev => {
      const next = [...prev];
      next[idx] = sel;
      return next;
    });
  };

  const addThirdPlayer = () => {
    setShowThirdPlayer(true);
    setSelectedTeams(prev => [...prev, ""]);
    setSelectedPlayers(prev => [...prev, ""]);
    setPlayerData(prev => [...prev, null]);
  };

  // helper: robust image url (new path -> legacy fallback handled in <img onError>)
  const headshotPrimary = (photoJpg) => {
    if (!photoJpg) return null;
    // FPL `photo` looks like "118748.jpg"; remove .jpg and no 'p' prefix on new path
    const code = photoJpg.replace(".jpg", ".png").replace(/^p/i, "").replace(".png", "");
    return `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`;
  };
  const headshotLegacy = (photoJpg) => {
    if (!photoJpg) return null;
    return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${photoJpg.replace(".jpg", ".png")}`;
  };

  const attributes = [
    { label: "Current Price", key: "now_cost" },
    { label: "Total Points", key: "total_points" },
    { label: "Goals", key: "goals_scored" },
    { label: "Assists", key: "assists" },
    { label: "Clean Sheets", key: "clean_sheets" },
    { label: "Goals Conceded", key: "goals_conceded" },
    { label: "Own Goals", key: "own_goals" },
    { label: "Penalties Saved", key: "penalties_saved" },
    { label: "Penalties Missed", key: "penalties_missed" },
    { label: "Yellow Cards", key: "yellow_cards" },
    { label: "Red Cards", key: "red_cards" },
    { label: "Saves", key: "saves" },
    { label: "Bonus", key: "bonus" },
    { label: "Starts", key: "starts" },
    { label: "Selected by percent", key: "selected_by_percent" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Compare Players</h1>

      {/* Team & Player Selects */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {selectedTeams.map((teamVal, idx) => {
          const teamIdNum = teamVal ? Number(teamVal) : null;
          const teamPlayers = teamIdNum
            ? players.filter(p => p.team === teamIdNum) // strict numeric match
            : [];

          return (
            <div key={idx}>
              {/* Team */}
              <select
                className="w-full p-2 border rounded"
                value={teamVal}
                onChange={(e) => {
                  const val = e.target.value;
                  // 1) update team
                  setSelectedTeams(prev => {
                    const next = [...prev];
                    next[idx] = val;
                    return next;
                  });
                  // 2) clear player for this slot (prevents stale/incorrect player)
                  setSelectedPlayers(prev => {
                    const next = [...prev];
                    next[idx] = "";
                    return next;
                  });
                  setPlayerData(prev => {
                    const next = [...prev];
                    next[idx] = null;
                    return next;
                  });
                }}
              >
                <option value="">Select Team</option>
                {Object.entries(teams).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              {/* Player (disabled until team chosen) */}
              <select
                className="w-full p-2 border rounded mt-2"
                value={selectedPlayers[idx]}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPlayers(prev => {
                    const next = [...prev];
                    next[idx] = val;
                    return next;
                  });
                  handleSelectPlayer(val, idx);
                }}
                disabled={!teamIdNum}
              >
                <option value="">{teamIdNum ? "Select Player" : "Select Team first"}</option>
                {teamPlayers.map(pl => (
                  <option key={pl.id} value={pl.id}>{pl.web_name}</option>
                ))}
              </select>
            </div>
          );
        })}

        {!showThirdPlayer && (
          <button
            onClick={addThirdPlayer}
            className="flex items-center justify-center border p-3 rounded-lg text-gray-500 hover:text-black transition"
          >
            <FaPlus className="mr-2" /> Add Player
          </button>
        )}
      </div>

      {/* Comparison Table */}
      {playerData.some(Boolean) && (
        <div className="border rounded-lg shadow p-4">
          <table className="w-full text-center">
            <thead className="bg-purple-900 text-white">
              <tr>
                {playerData.map((pl, i) =>
                  pl ? (
                    <th key={i} className="p-4">
                      <img
                        src={headshotPrimary(pl.photo)}
                        alt={pl.web_name}
                        className="w-24 mx-auto"
                        loading="lazy"
                        onError={(e) => {
                          const legacy = headshotLegacy(pl.photo);
                          if (legacy && e.currentTarget.src !== legacy) {
                            e.currentTarget.src = legacy;
                          }
                        }}
                      />
                      <p className="font-bold">{pl.web_name}</p>
                    </th>
                  ) : (
                    <th key={i} className="p-4">Select Player</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {attributes.map(({ label, key }) => {
                const maxVal = Math.max(
                  ...playerData.map(p => (p ? Number(p[key]) || 0 : 0))
                );
                return (
                  <tr key={key}>
                    {playerData.map((p, i) => (
                      <td key={i} className="p-2 border">
                        {p ? (
                          <>
                            {p[key]}
                            {Number(p[key]) === maxVal && <FaStar className="inline-block text-yellow-500 ml-1" />}
                          </>
                        ) : "-"}
                      </td>
                    ))}
                    <td className="p-2 border font-bold">{label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Compare;
