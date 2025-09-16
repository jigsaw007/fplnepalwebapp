// src/pages/Players.js (or Players.jsx)
import { useEffect, useMemo, useState } from "react";
import { fetchFPLData } from "../api/fplApi";
import { FaSquare, FaSquareFull } from "react-icons/fa";
import PlayerChart from "../components/PlayerChart";

const POSITIONS = { 1: "Goalkeeper", 2: "Defender", 3: "Midfielder", 4: "Forward" };

const Players = () => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);              // ← dynamic teams from API
  const [sortKey, setSortKey] = useState("total_points");
  const [sortOrder, setSortOrder] = useState("desc");
  const [teamFilter, setTeamFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 15;

  // load fresh bootstrap-static
  useEffect(() => {
    const getPlayers = async () => {
      const data = await fetchFPLData();
      if (!data) return;

      // players
      const sortedPlayers = [...data.elements].sort((a, b) => b.total_points - a.total_points);
      setPlayers(sortedPlayers);

      // teams (id + name) – use API to guarantee IDs match player.team
      const liveTeams = (data.teams || []).map(t => ({ id: t.id, name: t.name }));
      setTeams(liveTeams);
    };
    getPlayers();
  }, []);

  // sort handler (string-safe)
  const sortPlayers = (key) => {
    const nextOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortOrder(nextOrder);
    setPlayers(prev => {
      const arr = [...prev];
      arr.sort((a, b) => {
        const av = a[key], bv = b[key];
        if (typeof av === "string" || typeof bv === "string") {
          return nextOrder === "asc"
            ? String(av).localeCompare(String(bv))
            : String(bv).localeCompare(String(av));
        }
        return nextOrder === "asc" ? av - bv : bv - av;
      });
      return arr;
    });
    setCurrentPage(1); // reset page on sort change
  };

  // filters
  const filteredPlayers = useMemo(() => {
    const teamId = teamFilter ? Number(teamFilter) : null;
    const posId = positionFilter ? Number(positionFilter) : null;
    const out = players.filter(p =>
      (teamId ? p.team === teamId : true) &&
      (posId ? p.element_type === posId : true)
    );
    return out;
  }, [players, teamFilter, positionFilter]);

  // pagination
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage) || 1;
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  // reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [teamFilter, positionFilter]);

  return (
    <div className="p-4 md:p-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          className="border p-2 rounded shadow-md"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        >
          <option value="">All Teams</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded shadow-md"
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
        >
          <option value="">All Positions</option>
          {Object.entries(POSITIONS).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        {/* Optional: manual refresh */}
        <button
          className="px-3 py-2 rounded bg-indigo-600 text-white"
          onClick={async () => {
            const data = await fetchFPLData();
            if (data?.elements) {
              setPlayers([...data.elements].sort((a,b)=>b.total_points-a.total_points));
            }
            if (data?.teams) {
              setTeams(data.teams.map(t => ({ id: t.id, name: t.name })));
            }
            setCurrentPage(1);
          }}
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-sm shadow-lg rounded-lg">
          <thead className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white uppercase tracking-wider">
            <tr>
              {[
                { key: "web_name", label: "Name" },
                { key: "now_cost", label: "Cost" },
                { key: "points_per_game", label: "Points/Game" },
                { key: "total_points", label: "Total Points" },
                { key: "goals_scored", label: "Goals" },
                { key: "assists", label: "Assists" },
                { key: "clean_sheets", label: "Clean Sheets" },
                { key: "selected_by_percent", label: "Selected %" },
                { key: "yellow_cards", label: "Yellow Card" },
                { key: "red_cards", label: "Red Card" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="border border-gray-300 p-3 cursor-pointer hover:bg-indigo-700 transition duration-200"
                  onClick={() => sortPlayers(key)}
                >
                  {label} {sortKey === key ? (sortOrder === "asc" ? "🔼" : "🔽") : ""}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedPlayers.map((player) => (
              <tr
                key={player.id}
                className="border border-gray-300 text-gray-800 hover:bg-gray-100 transition duration-200 cursor-pointer"
                onClick={() => setSelectedPlayer(player)}
              >
                <td className="p-3">{player.web_name}</td>
                <td className="p-3">£{(player.now_cost / 10).toFixed(1)}m</td>
                <td className="p-3">{player.points_per_game}</td>
                <td className="p-3">{player.total_points}</td>
                <td className="p-3">{player.goals_scored}</td>
                <td className="p-3">{player.assists}</td>
                <td className="p-3">{player.clean_sheets}</td>
                <td className="p-3">{player.selected_by_percent}%</td>

                {/* Yellow Cards */}
                <td className="p-3 text-center">
                  {player.yellow_cards > 0 ? (
                    <>
                      <FaSquareFull className="text-yellow-500 inline-block text-lg" /> {player.yellow_cards}
                    </>
                  ) : "0"}
                </td>

                {/* Red Cards */}
                <td className="p-3 text-center">
                  {player.red_cards > 0 ? (
                    <>
                      <FaSquare className="text-red-600 inline-block text-lg" /> {player.red_cards}
                    </>
                  ) : "0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedPlayer && (
          <PlayerChart player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 space-x-4">
        <button
          className="px-4 py-2 rounded-md bg-indigo-600 text-white shadow-md hover:bg-indigo-800 transition disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          ⬅ Previous
        </button>
        <span className="text-lg font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-4 py-2 rounded-md bg-indigo-600 text-white shadow-md hover:bg-indigo-800 transition disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next ➡
        </button>
      </div>
    </div>
  );
};

export default Players;
