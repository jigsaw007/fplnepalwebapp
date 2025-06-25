import React, { useEffect, useState } from "react";
import { fetchAllClassicLeagueEntries, fetchCaptainScore } from "../api/fplApi";

const CaptainScore = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const leagueId = "420585";
  const gameweek = 1; // or dynamically set this if needed

  useEffect(() => {
    const loadData = async () => {
      try {
        const allEntries = await fetchAllClassicLeagueEntries(leagueId);
        const data = await Promise.all(
          allEntries.map(async (entry) => {
            const captain = await fetchCaptainScore(entry.entry, gameweek);
            return {
              manager_name: entry.player_name,
              team_name: entry.entry_name,
              captain_score: captain.captain_score,
            };
          })
        );
        setEntries(data);
      } catch (error) {
        console.error("Failed to load captain scores", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center text-purple-800 mb-4">
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
