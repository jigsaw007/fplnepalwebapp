// src/components/Suggestion.jsx
import { useEffect, useState } from "react";
import { fetchFPLData, fetchFixturesByGameweek } from "../api/fplApi";
// ❌ remove getTeamKit / TEAM_SHORT_NAMES (old mapping shows old kits)
// import { TEAM_SHORT_NAMES, getTeamKit } from "../utils/teamData";
import { FaSpinner } from "react-icons/fa";
import "./suggestion.css";

// Build shirt/badge URLs from team_code (NOT team id)
const shirtFromTeamCode = (teamCode) =>
  teamCode
    ? `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-66.png`
    : null;

const badgeFromTeamCode = (teamCode) =>
  teamCode
    ? `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`
    : null;

const Suggestion = () => {
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);
  const [currentGameweek, setCurrentGameweek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictionData = async () => {
      setLoading(true);

      // Bootstrap FPL data
      const fplData = await fetchFPLData();
      if (!fplData) {
        setLoading(false);
        return;
      }

      const allPlayers = fplData.elements; // has team_code per player
      const teams = fplData.teams;
      const events = fplData.events;

      // Current GW
      const activeGW = events.find((gw) => gw.is_current)?.id || 1;
      setCurrentGameweek(activeGW);

      // Fixtures for NEXT GW
      const fixtures = await fetchFixturesByGameweek(activeGW + 1);

      // Score & pick
      const predictions = calculatePredictedScores(allPlayers, teams, fixtures);
      setSuggestedPlayers(predictions.slice(0, 4));

      setLoading(false);
    };

    fetchPredictionData();
  }, []);

  // Prediction Logic (same as yours; just swapping kit URL source)
  const calculatePredictedScores = (players, teams, fixtures) => {
    return players
      .filter((player) => !player.injured && player.minutes > 0)
      .map((player) => {
        const team = teams.find((t) => t.id === player.team);
        const nextFixture = fixtures.find(
          (f) => f.team_h === player.team || f.team_a === player.team
        );
        if (!nextFixture) return null;

        const isHome = nextFixture.team_h === player.team;
        const opponentTeamId = isHome ? nextFixture.team_a : nextFixture.team_h;
        const opponent = teams.find((t) => t.id === opponentTeamId);
        const fixtureDifficulty = nextFixture?.difficulty || 3;

        const predictedScore =
          (player.expected_goals || 0) * 1.5 +
          (player.form || 0) * 2 +
          (5 - fixtureDifficulty) * 1;

        // ✅ Use player.team_code for CURRENT shirt; fallback to PL badge
        const kitUrl =
          shirtFromTeamCode(player.team_code) ||
          badgeFromTeamCode(player.team_code);

        return {
          id: player.id,
          name: player.web_name,
          team: team?.name || "Unknown",
          kit: kitUrl,
          nextOpponent: `${opponent?.name || "Unknown"} (${isHome ? "H" : "A"})`,
          predictedScore: Number(predictedScore.toFixed(1)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.predictedScore - a.predictedScore);
  };

  return (
    <div className="suggestion-container mt-5">
      <h2 className="title">
        {currentGameweek ? `Top Picks for GW ${currentGameweek + 1}` : "Loading..."}
      </h2>

      {loading ? (
        <div className="text-center flex justify-center items-center h-32">
          <FaSpinner className="animate-spin text-purple-700 text-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {suggestedPlayers.map((player) => (
            <div
              key={player.id}
              className="bg-white p-3 rounded-lg shadow flex flex-col items-center text-center"
            >
              {player.kit ? (
                <img
                  src={player.kit}
                  alt={`${player.name} kit`}
                  className="w-16 h-16 mb-2"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-16 h-16 mb-2 rounded bg-gray-100 grid place-items-center text-xs text-gray-500"
                  title="No image"
                >
                  N/A
                </div>
              )}
              <h3 className="text-sm font-bold">{player.name}</h3>
              <p className="text-xs text-gray-600">{player.team}</p>
              <p className="text-xs text-gray-500">vs {player.nextOpponent}</p>
              {/* <p className="text-lg font-semibold text-green-600">{player.predictedScore} Pts</p> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Suggestion;
