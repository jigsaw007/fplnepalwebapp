import { useEffect, useState } from "react";
import { fetchClassicLeagueCaptains } from "../api/fplApi";

const CaptainScore = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const leagueId = "420585";
  const gameweek = 1;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchClassicLeagueCaptains(leagueId, gameweek);
      setEntries(data);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-purple-800 mb-4 text-center">Captain Scores – FPL Nepal Classic</h2>
      {loading ? (
        <div className="text-center">Loading captain scores...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm shadow">
            <thead className="bg-purple-800 text-white">
              <tr>
                <th className="p-2 border">Manager</th>
                <th className="p-2 border">Team</th>
                <th className="p-2 border">Captain Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="hover:bg-purple-100">
                  <td className="p-2 border">{e.manager_name}</td>
                  <td className="p-2 border">{e.team_name}</td>
                  <td className="p-2 border text-center">{e.captain_score}</td>
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
