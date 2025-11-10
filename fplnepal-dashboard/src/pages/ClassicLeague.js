import React, { useState, useEffect } from "react";
import { fetchClassicLeague, fetchManagerHistory } from "../api/fplApi";

const ClassicLeague = () => {
  const [standings, setStandings] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState("235907"); // Default: FPL Nepal Ultimate
  const [selectedGameweek, setSelectedGameweek] = useState(1); // Default: GW1
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState(null); // ✅ Sorting state
  const standingsPerPage = 15;

  useEffect(() => {
    const getStandings = async () => {
      setLoading(true);

      const cacheKey = `${selectedLeague}-${selectedGameweek}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      

      if (cachedData) {
        setStandings(JSON.parse(cachedData));
        setLoading(false);
        return;
      }

      try {
        const data = await fetchClassicLeague(selectedLeague, selectedGameweek);

        // Fetch all manager histories in parallel
        const updatedData = await Promise.all(
          data.map(async (player) => {
            const historyData = await fetchManagerHistory(player.id);
            const gameweekData = historyData?.current.find(gw => gw.event === parseInt(selectedGameweek));

            const negativeScore = gameweekData ? gameweekData.event_transfers_cost : 0;
            const adjustedScore = player.gameweek_score - negativeScore;

            return {
              ...player,
              negative_score: negativeScore,
              adjusted_score: adjustedScore,
            };
          })
        );

        sessionStorage.setItem(cacheKey, JSON.stringify(updatedData));
        setStandings(updatedData);
      } catch (error) {
        console.error("Error fetching standings:", error);
      } finally {
        setLoading(false);
      }
    };

    getStandings();
  }, [selectedLeague, selectedGameweek]);

  // ** Sorting Logic **
  const sortStandings = (column) => {
    let direction = "ascending";
    if (sortConfig && sortConfig.key === column && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key: column, direction });

    const sortedData = [...standings].sort((a, b) => {
      if (a[column] < b[column]) return direction === "ascending" ? -1 : 1;
      if (a[column] > b[column]) return direction === "ascending" ? 1 : -1;
      return 0;
    });

    setStandings(sortedData);
  };

  // ** Pagination Logic **
  const indexOfLastStanding = currentPage * standingsPerPage;
  const indexOfFirstStanding = indexOfLastStanding - standingsPerPage;
  const currentStandings = standings.slice(indexOfFirstStanding, indexOfLastStanding);
  const totalPages = Math.ceil(standings.length / standingsPerPage);

  return (
    <div className="p-4 w-full">
      <h2 className="text-2xl font-bold text-purple-950 mb-4 text-center">
        FPL NEPAL Classic League Standings
      </h2>

      {/* League & Gameweek Selection */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-x-4 md:space-y-0 mb-4">
        <div>
          {/* <label className="font-semibold">Select League: </label> */}
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="border p-2 rounded bg-white w-full md:w-auto"
          >
            {/* <option value="420581">FPL Nepal Ultimate League</option> */}
            <option value="420585">FPL Nepal Classic League</option>
          </select>
        </div>

        <div>
          <label className="font-semibold">Select Gameweek: </label>
          <select
            value={selectedGameweek}
            onChange={(e) => setSelectedGameweek(parseInt(e.target.value))}
            className="border p-2 rounded bg-white w-full md:w-auto"
          >
            {[...Array(38).keys()].map((gw) => (
              <option key={gw + 1} value={gw + 1}>
                Gameweek {gw + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ✅ Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700"></div>
        </div>
      )}

      {/* ✅ Responsive Table Wrapper (Horizontal Scroll) */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 shadow-lg text-xs md:text-sm">
            <thead className="bg-purple-950 text-white">
              <tr>
                <th className="border p-2 md:p-3">Rank</th>
                <th className="border p-2 md:p-3">Manager</th>
                <th className="border p-2 md:p-3">Team</th>
                <th className="border p-2 md:p-3 cursor-pointer" onClick={() => sortStandings("gameweek_score")}>
                  GW Score {sortConfig?.key === "gameweek_score" ? (sortConfig.direction === "ascending" ? "⬆" : "⬇") : ""}
                </th>
                <th className="border p-2 md:p-3 text-red-500 cursor-pointer" onClick={() => sortStandings("negative_score")}>
                  Negative Score {sortConfig?.key === "negative_score" ? (sortConfig.direction === "ascending" ? "⬆" : "⬇") : ""}
                </th>
                <th className="border p-2 md:p-3 font-bold cursor-pointer" onClick={() => sortStandings("adjusted_score")}>
                  Adjusted Score {sortConfig?.key === "adjusted_score" ? (sortConfig.direction === "ascending" ? "⬆" : "⬇") : ""}
                </th>
                <th className="border p-2 md:p-3">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {currentStandings.map((player, index) => (
                <tr key={index} className="border hover:bg-purple-100">
                  <td className="border p-2 md:p-3 text-center">{indexOfFirstStanding + index + 1}</td>
                  <td className="border p-2 md:p-3">{player.manager_name}</td>
                  <td className="border p-2 md:p-3">{player.team_name}</td>
                  <td className="border p-2 md:p-3 text-center">{player.gameweek_score}</td>
                  <td className="border p-2 md:p-3 text-center text-red-500">{player.negative_score > 0 ? `-${player.negative_score}` : "0"}</td>
                  <td className="border p-2 md:p-3 text-center font-bold">{player.adjusted_score}</td>
                  <td className="border p-2 md:p-3 text-center">{player.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        <div className="flex justify-between items-center mt-4">
          <button
            className={`px-3 py-1 border rounded text-sm ${
              currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-purple-600 text-white"
            }`}
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <span className="text-sm font-semibold">
            Page {currentPage} of {totalPages}
          </span>

          <button
            className={`px-3 py-1 border rounded text-sm ${
              currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-purple-600 text-white"
            }`}
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassicLeague;
