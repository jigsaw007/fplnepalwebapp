// src/pages/CaptainScore.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const CaptainScore = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const leagueId = "420585";

  useEffect(() => {
    const fetchAllPages = async () => {
      let page = 1;
      let allResults = [];
      let hasMore = true;

      try {
        while (hasMore) {
          const res = await axios.get(
            `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_new_entries=1&page_standings=${page}&phase=1`
          );
          const results = res.data.standings.results;
          allResults = allResults.concat(results);
          hasMore = res.data.standings.has_next;
          page += 1;
        }

        // Fetch captain data for each entry
        const withCaptainScores = await Promise.all(
          allResults.map(async (entry) => {
            const historyRes = await axios.get(
              `https://fantasy.premierleague.com/api/entry/${entry.entry}/event/${res.data.standings.event}/picks/`
            );
            const picks = historyRes.data.picks;
            const captainId = picks.find(p => p.is_captain)?.element;
            const captainScore = historyRes.data.entry_history.points;

            return {
              manager_name: entry.player_name,
              team_name: entry.entry_name,
              captain_id: captainId,
              captain_score: captainScore
            };
          })
        );

        setEntries(withCaptainScores);
      } catch (err) {
        console.error("Error loading captain scores:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPages();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-center text-purple-900">
        Captain Scores – FPL Nepal Classic League
      </h2>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border text-sm shadow">
            <thead className="bg-purple-800 text-white">
              <tr>
                <th className="p-2 border">Manager</th>
                <th className="p-2 border">Team Name</th>
                <th className="p-2 border">Captain Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={index} className="hover:bg-purple-100">
                  <td className="p-2 border">{entry.manager_name}</td>
                  <td className="p-2 border">{entry.team_name}</td>
                  <td className="p-2 border text-center font-semibold">{entry.captain_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CaptainScore;
