import { useEffect, useMemo, useState } from "react";
import { fetchCleanSheetData } from "../api/fplApi";

/* =========================
   FDR ICONS (UX Friendly)
========================= */
const renderFDRIcons = (fdr) => {
  const map = {
    1: { dots: 3, color: "bg-green-500", label: "Very Easy" },
    2: { dots: 2, color: "bg-green-400", label: "Easy" },
    3: { dots: 2, color: "bg-yellow-400", label: "Medium" },
    4: { dots: 2, color: "bg-red-400", label: "Hard" },
    5: { dots: 3, color: "bg-red-500", label: "Very Hard" },
  };

  const cfg = map[fdr];

  return (
    <div
      className="flex items-center gap-1"
      title={`Fixture Difficulty: ${cfg.label}`}
    >
      {Array.from({ length: cfg.dots }).map((_, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${cfg.color}`}
        />
      ))}
    </div>
  );
};

/* =========================
   POISSON & FORM HELPERS
========================= */
const poissonCS = (lambda) => Math.exp(-lambda);

const getLastNFixtures = (fixtures, teamId, n, currentGw) =>
  fixtures
    .filter(
      (f) =>
        f.finished &&
        f.event < currentGw &&
        (f.team_h === teamId || f.team_a === teamId)
    )
    .sort((a, b) => b.event - a.event)
    .slice(0, n);

const calculateFormStats = (fixtures, teamId) => {
  let conceded = 0;
  let scored = 0;

  fixtures.forEach((f) => {
    if (f.team_h === teamId) {
      scored += f.team_h_score;
      conceded += f.team_a_score;
    } else {
      scored += f.team_a_score;
      conceded += f.team_h_score;
    }
  });

  const games = fixtures.length || 1;
  return {
    avgConceded: conceded / games,
    avgScored: scored / games,
  };
};

/* =========================
   PAGE
========================= */
export default function CleanSheetPrediction() {
  const [gw, setGw] = useState(1);
  const [rows, setRows] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auto-select upcoming GW
  useEffect(() => {
    (async () => {
      const data = await fetchCleanSheetData();
      const nextGw =
        data?.events?.find((e) => !e.finished)?.id || 1;
      setGw(nextGw);
    })();
  }, []);

  const gwOptions = useMemo(
    () => Array.from({ length: 38 }, (_, i) => i + 1),
    []
  );

  const load = async () => {
    setLoading(true);
    const data = await fetchCleanSheetData();
    if (!data) return;

    const { fixtures, teams } = data;
    const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));
    const gwFixtures = fixtures.filter((f) => f.event === gw);
    const result = [];

    gwFixtures.forEach((fx) => {
      const home = teamMap[fx.team_h];
      const away = teamMap[fx.team_a];

      const homeForm = calculateFormStats(
        getLastNFixtures(fixtures, home.id, 5, gw),
        home.id
      );
      const awayForm = calculateFormStats(
        getLastNFixtures(fixtures, away.id, 5, gw),
        away.id
      );

      const homeLambda =
        0.55 * homeForm.avgConceded +
        0.3 * awayForm.avgScored +
        0.15 * fx.team_h_difficulty;

      const awayLambda =
        0.55 * awayForm.avgConceded +
        0.3 * homeForm.avgScored +
        0.15 * fx.team_a_difficulty;

      result.push(
        {
          team: home.name,
          teamCode: home.code,
          opponent: away.name,
          opponentCode: away.code,
          venue: "Home",
          fdr: fx.team_h_difficulty,
          chance: Math.round(
            Math.max(3, Math.min(60, poissonCS(homeLambda) * 100))
          ),
        },
        {
          team: away.name,
          teamCode: away.code,
          opponent: home.name,
          opponentCode: home.code,
          venue: "Away",
          fdr: fx.team_a_difficulty,
          chance: Math.round(
            Math.max(3, Math.min(60, poissonCS(awayLambda) * 100))
          ),
        }
      );
    });

    setRows(result.sort((a, b) => b.chance - a.chance));
    setLoading(false);
  };

  useEffect(() => {
    if (gw) load();
  }, [gw]);

  /* =========================
     FIX: GK / DEF PICKS UPDATE
  ========================= */
  useEffect(() => {
    if (rows.length > 0) {
      setRecommendations(
        rows
          .filter((r) => r.chance >= 30)
          .slice(0, 5)
      );
    } else {
      setRecommendations([]);
    }
  }, [rows]);

  return (
    <div className="max-w-6xl mx-auto px-3 py-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">
          Clean Sheet Possibilities
        </h1>

        <select
          value={gw}
          onChange={(e) => setGw(Number(e.target.value))}
          className="border rounded-xl px-3 py-2 bg-white shadow-sm"
        >
          {gwOptions.map((g) => (
            <option key={g} value={g}>
              GW {g}
            </option>
          ))}
        </select>
      </div>

      {/* GK / DEF RECOMMENDATIONS */}
      {!loading && recommendations.length > 0 && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
          <h2 className="font-bold text-emerald-800 mb-2">
            🧤 Best GK / DEF Picks This GW
          </h2>
          <div className="flex flex-wrap gap-3 text-sm">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/70/t${r.teamCode}.png`}
                  className="w-5 h-5"
                  alt={r.team}
                />
                <span className="font-medium">{r.team}</span>
                <span className="text-emerald-700">{r.chance}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <div className="text-slate-600">
          Calculating realistic probabilities…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 sm:p-3 text-left">Team</th>
                <th className="p-2 sm:p-3 text-left">Opponent</th>
                <th className="p-2 sm:p-3 text-left hidden md:table-cell">
                  Venue
                </th>
                <th className="p-2 sm:p-3 text-left">Fixture</th>
                <th className="p-2 sm:p-3 text-left">CS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  {/* TEAM */}
                  <td className="p-2 sm:p-3">
                    <div className="flex items-center gap-2 font-medium">
                      <img
                        src={`https://resources.premierleague.com/premierleague/badges/70/t${r.teamCode}.png`}
                        className="w-5 h-5"
                        alt={r.team}
                      />
                      {r.team}
                    </div>
                  </td>

                  {/* OPPONENT */}
                  <td className="p-2 sm:p-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://resources.premierleague.com/premierleague/badges/70/t${r.opponentCode}.png`}
                        className="w-5 h-5"
                        alt={r.opponent}
                      />
                      {r.opponent}
                    </div>
                  </td>

                  {/* VENUE */}
                  <td className="p-2 sm:p-3 hidden md:table-cell">
                    {r.venue}
                  </td>

                  {/* FDR */}
                  <td className="p-2 sm:p-3">
                    {renderFDRIcons(r.fdr)}
                  </td>

                  {/* CS */}
                  <td className="p-2 sm:p-3 font-bold">
                    <span
                      className={
                        r.chance >= 40
                          ? "text-green-600"
                          : r.chance >= 25
                          ? "text-yellow-600"
                          : "text-red-600"
                      }
                    >
                      {r.chance}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-slate-500 px-3 py-2">
            * Calculated using last 5 matches, opponent scoring form,
            fixture difficulty and Poisson probability.
          </p>
        </div>
      )}
    </div>
  );
}
