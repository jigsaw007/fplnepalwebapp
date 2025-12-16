import { useEffect, useMemo, useRef, useState } from "react";
import { fetchFPLData, fetchCaptainStandings } from "../api/fplApi";

const LEAGUE_ID = 235907;
const TREND_GWS = 5;

/* =========================
   Rank Change (ARROWS ONLY)
========================= */
function RankChange({ currentRank, prevRank }) {
  if (!prevRank) return null;

  const diff = prevRank - currentRank;

  if (diff > 0) {
    return (
      <span
        title="Rank up since last gameweek"
        className="ml-1 text-green-600 text-xs font-bold animate-[slideUp_0.3s_ease-out]"
      >
        ▲
      </span>
    );
  }

  if (diff < 0) {
    return (
      <span
        title="Rank down since last gameweek"
        className="ml-1 text-red-600 text-xs font-bold animate-[slideDown_0.3s_ease-out]"
      >
        ▼
      </span>
    );
  }

  return <span className="ml-1 text-gray-400 text-xs">—</span>;
}

/* =========================
   Rank Trend (Gradient Bars)
========================= */
function RankTrend({ ranks }) {
  if (!ranks || ranks.length < 2) return null;

  const min = Math.min(...ranks);
  const max = Math.max(...ranks);

  return (
    <div
      title="Rank trend over last gameweeks"
      className="ml-2 flex items-end gap-[2px] h-4"
    >
      {ranks.map((r, i) => {
        const norm =
          max === min ? 0.5 : 1 - (r - min) / (max - min); // higher bar = better rank
        const height = Math.max(4, Math.round(norm * 16));

        const color =
          norm > 0.66
            ? "bg-green-500"
            : norm > 0.33
            ? "bg-yellow-400"
            : "bg-red-500";

        return (
          <span
            key={i}
            className={`${color} w-[3px] rounded-sm opacity-80`}
            style={{ height }}
          />
        );
      })}
    </div>
  );
}

export default function CaptainMode() {
  const [events, setEvents] = useState([]);
  const [mode, setMode] = useState("overall");
  const [loading, setLoading] = useState(false);
  const [standings, setStandings] = useState([]);
  const [prevRankMap, setPrevRankMap] = useState({});
  const [trendMap, setTrendMap] = useState({});

  const cacheRef = useRef({});

  /* =========================
     Load events
  ========================= */
  useEffect(() => {
    const load = async () => {
      const data = await fetchFPLData();
      const evs = (data?.events || []).map((e) => ({
        id: e.id,
        name: e.name,
        finished: !!e.finished,
      }));
      setEvents(evs);
    };
    load();
  }, []);

  /* =========================
     Fetch standings + trend
  ========================= */
  const handleFetch = async (m) => {
    setLoading(true);

    const current = await fetchCaptainStandings(LEAGUE_ID, m);
    const currentStandings = current?.standings || [];
    setStandings(currentStandings);

    const finishedGWs = events
      .filter((e) => e.finished)
      .sort((a, b) => a.id - b.id)
      .map((e) => e.id);

    if (finishedGWs.length >= 2) {
      const lastGW = finishedGWs[finishedGWs.length - 1];
      const prevGW = finishedGWs[finishedGWs.length - 2];

      // previous GW for arrow
      let prevStandings = cacheRef.current[prevGW];
      if (!prevStandings) {
        const prev = await fetchCaptainStandings(LEAGUE_ID, prevGW);
        prevStandings = prev?.standings || [];
        cacheRef.current[prevGW] = prevStandings;
      }

      const rankMap = {};
      prevStandings.forEach((r) => {
        rankMap[r.manager_id] = r.rank;
      });
      setPrevRankMap(rankMap);

      // trend data
      const recentGWs = finishedGWs.slice(-TREND_GWS);
      const trend = {};

      for (const gw of recentGWs) {
        let gwData = cacheRef.current[gw];
        if (!gwData) {
          const res = await fetchCaptainStandings(LEAGUE_ID, gw);
          gwData = res?.standings || [];
          cacheRef.current[gw] = gwData;
        }

        gwData.forEach((r) => {
          if (!trend[r.manager_id]) trend[r.manager_id] = [];
          trend[r.manager_id].push(r.rank);
        });
      }

      setTrendMap(trend);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (mode && events.length) handleFetch(mode);
    // eslint-disable-next-line
  }, [mode, events]);

  const gwOptions = useMemo(
    () =>
      events.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
        </option>
      )),
    [events]
  );

  const isOverall = mode === "overall";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-extrabold mb-4">
        FPL NEPAL – Captain Mode
      </h1>

      <div className="mb-4">
        <select
          className="border rounded-xl px-3 py-2"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="overall">Overall</option>
          {gwOptions}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">Loading…</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">
                  {isOverall ? "Total Captain Pts" : "Captain Pts"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {standings.map((row) => (
                <tr key={row.manager_id}>
                  <td className="px-4 py-3 font-bold">{row.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <a
                        href={
                          isOverall
                            ? `https://fantasy.premierleague.com/entry/${row.manager_id}/history`
                            : `https://fantasy.premierleague.com/entry/${row.manager_id}/event/${mode}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:opacity-70 transition"
                      >
                        {row.manager_name}
                      </a>

                      <RankChange
                        currentRank={row.rank}
                        prevRank={prevRankMap[row.manager_id]}
                      />

                      <RankTrend ranks={trendMap[row.manager_id]} />
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.team_name}</td>
                  <td className="px-4 py-3 font-semibold">
                    {row.captain_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
