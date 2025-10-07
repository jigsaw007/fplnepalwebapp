import { useEffect, useState } from "react";
import { fetchFPLData, fetchFixturesByGameweek } from "../api/fplApi";
import { FaSpinner } from "react-icons/fa";

const Suggestion = () => {
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);
  const [currentGameweek, setCurrentGameweek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictionData = async () => {
      setLoading(true);
      const fplData = await fetchFPLData();
      if (!fplData) {
        setLoading(false);
        return;
      }

      const players = fplData.elements;
      const teams = fplData.teams;
      const events = fplData.events;

      const activeGW = events.find((gw) => gw.is_current)?.id || 1;
      setCurrentGameweek(activeGW);

      const fixtures = await fetchFixturesByGameweek(activeGW + 1);
      const predictions = calculatePredictedScores(players, teams, fixtures);

      setSuggestedPlayers(predictions.slice(0, 4)); // show top 4
      setLoading(false);
    };

    fetchPredictionData();
  }, []);

  const calculatePredictedScores = (players, teams, fixtures) => {
    return players
      .filter((p) => !p.injured && p.minutes > 0)
      .map((p) => {
        const team = teams.find((t) => t.id === p.team);
        const nextFixture = fixtures.find(
          (f) => f.team_h === p.team || f.team_a === p.team
        );
        if (!nextFixture) return null;

        const isHome = nextFixture.team_h === p.team;
        const oppId = isHome ? nextFixture.team_a : nextFixture.team_h;
        const opp = teams.find((t) => t.id === oppId);

        const difficulty = nextFixture?.difficulty || 3;
        const predictedScore =
          (p.expected_goals || 0) * 1.2 +
          (p.form || 0) * 2.5 +
          (5 - difficulty) * 1.2;

        return {
          id: p.id,
          name: p.web_name,
          teamName: team?.name || "Unknown",
          teamCode: p.team_code, // ✅ correct value for kit URL
          nextOpponent: `${opp?.name || "Unknown"} (${isHome ? "H" : "A"})`,
          predictedScore: Number(predictedScore.toFixed(1)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.predictedScore - a.predictedScore);
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-950 to-fuchsia-950 p-4 rounded-2xl shadow-lg text-white w-full mt-4">
      <h2 className="text-center text-base font-bold mb-3 tracking-wide">
        {currentGameweek ? `Top Picks for GW ${currentGameweek + 1}` : "Loading..."}
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-6">
          <FaSpinner className="animate-spin text-fuchsia-500 text-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {suggestedPlayers.map((p) => (
            <div
              key={p.id}
              className="relative bg-white/10 hover:bg-white/20 rounded-xl overflow-hidden transition-all duration-200 shadow-sm flex flex-col items-center text-center"
            >
              {/* ✅ Show Correct Kit like Top Transfers In/Out */}
              <div className="relative w-full h-36 flex justify-center items-center bg-black/10">
                <img
                  src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.teamCode}-220.webp`}
                  alt={`${p.name} kit`}
                  className="h-full w-auto object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_1-220.webp";
                  }}
                />
                <span className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
                  {p.predictedScore} pts
                </span>
              </div>

              {/* Info Section */}
              <div className="flex flex-col items-center py-2 text-center w-full">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-[11px] text-gray-300">{p.teamName}</p>
                <p className="text-[10px] text-gray-400">vs {p.nextOpponent}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Suggestion;
