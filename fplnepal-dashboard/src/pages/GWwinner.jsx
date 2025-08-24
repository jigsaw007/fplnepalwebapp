// src/pages/GWwinner.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchFPLData, fetchGwTop, fetchClassicLeague } from "../api/fplApi";

import SquadGrid from "../components/SquadGrid";

const LEAGUE_ID = 235907;

export default function GWwinner() {
  const [events, setEvents] = useState([]);
  const [gw, setGw] = useState(null);
  const [loading, setLoading] = useState(false);
  const [top3, setTop3] = useState([]);
  const [others, setOthers] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchFPLData();
      const evs = (data?.events || []).map((e) => ({
        id: e.id,
        name: e.name,
        deadline: new Date(e.deadline_time),
        finished: !!e.finished,
      }));
      setEvents(evs);

      const now = new Date();
      const latest =
        evs.filter((e) => e.deadline <= now || e.finished).sort((a, b) => b.id - a.id)[0]?.id ??
        evs[0]?.id ??
        1;
      setGw(latest);
    };
    load();
  }, []);



const handleFetch = async (targetGw) => {
  setLoading(true);

  // fetch both gwTop and full standings
  const gwTop = await fetchGwTop(LEAGUE_ID, targetGw);
  const standings = await fetchClassicLeague(LEAGUE_ID, targetGw);

  // make a map: manager_id → real rank
  const rankMap = {};
  standings.forEach((s) => {
    rankMap[s.id] = s.rank;
  });

  // merge real rank into gwTop data
  const top3WithRank = gwTop.top3.map((r) => ({
    ...r,
    league_rank: rankMap[r.manager_id] || "-",
  }));
  const othersWithRank = gwTop.others.map((r) => ({
    ...r,
    league_rank: rankMap[r.manager_id] || "-",
  }));

  setTop3(top3WithRank);
  setOthers(othersWithRank);
  setLoading(false);
};


  useEffect(() => {
    if (gw) handleFetch(gw);
    // eslint-disable-next-line
  }, [gw]);

  const gwOptions = useMemo(
    () =>
      events.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
        </option>
      )),
    [events]
  );

  // Captain headshot (PL images)
  const captainImg = (row) =>
    row?.captain_code
      ? `https://resources.premierleague.com/premierleague/photos/players/110x140/p${row.captain_code}.png`
      : null;

  // Chip mapping -> label + colors
  const chipInfo = (chip) => {
    if (!chip) return null;
    const map = {
      "3xc": { label: "TC", title: "Triple Captain", cls: "bg-amber-100 text-amber-700 ring-amber-300" },
      bboost: { label: "BB", title: "Bench Boost", cls: "bg-indigo-100 text-indigo-700 ring-indigo-300" },
      freehit: { label: "FH", title: "Free Hit", cls: "bg-rose-100 text-rose-700 ring-rose-300" },
      wildcard: { label: "WC", title: "Wildcard", cls: "bg-teal-100 text-teal-800 ring-teal-300" },
    };
    return map[chip] || { label: chip.toUpperCase(), title: "Chip used", cls: "bg-gray-100 text-gray-700 ring-gray-300" };
  };

  // Rank-specific styles for top 3
  const rankCardStyles = [
    {
      ring: "ring-amber-300/70",
      panel: "from-amber-50 via-amber-100 to-amber-50",
      leftBar: "bg-amber-400",
      medal: "🥇",
      medalClass: "text-6xl md:text-7xl",
      title: "text-amber-800",
      score: "text-amber-700",
      avatarRing: "ring-amber-300",
    },
    {
      ring: "ring-zinc-300/70",
      panel: "from-zinc-50 via-zinc-100 to-zinc-50",
      leftBar: "bg-zinc-400",
      medal: "🥈",
      medalClass: "text-6xl md:text-7xl",
      title: "text-zinc-800",
      score: "text-zinc-700",
      avatarRing: "ring-zinc-300",
    },
    {
      ring: "ring-orange-300/70",
      panel: "from-orange-50 via-orange-100 to-orange-50",
      leftBar: "bg-orange-400",
      medal: "🥉",
      medalClass: "text-6xl md:text-7xl",
      title: "text-orange-800",
      score: "text-orange-700",
      avatarRing: "ring-orange-300",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            FPL NEPAL CLASSIC LEAGUE
          </h1>
          <p className="text-lg font-semibold text-gray-700">
            GAMEWEEK WINNERS
          </p>
        </div>

        <div className="flex items-center gap-3 -mt-3">
          <label className="text-sm font-medium">Gameweek</label>
          <select
            className="border rounded-xl px-3 py-2 shadow-sm focus:outline-none"
            value={gw || ""}
            onChange={(e) => setGw(Number(e.target.value))}
          >
            {gwOptions}
          </select>
          <button
            onClick={() => handleFetch(gw)}
            className="px-4 py-2 rounded-xl border shadow-sm hover:shadow-md transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
{loading ? (
  <div className="col-span-3 flex flex-col items-center justify-center py-12">
    <svg
      className="animate-spin h-10 w-10 text-blue-600 mb-3"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
    <p className="text-gray-600 font-medium">Loading data...</p>
  </div>
) : top3.length === 0 ? (

          <div className="col-span-3 p-8 text-center text-gray-600">No data for this GW.</div>
        ) : (
          top3.map((row, idx) => {
            const style = rankCardStyles[idx] || rankCardStyles[2];
            const imgSrc = captainImg(row);
            const chip = chipInfo(row?.chip);

            return (
              <div
                key={row.manager_id}
                className={`relative overflow-hidden rounded-2xl shadow-2xl ring-1 ${style.ring}`}
              >
                {/* Left accent bar */}
                <div className={`absolute inset-y-0 left-0 w-1 ${style.leftBar} rounded-l-2xl`} />

                {/* Content */}
                <div className={`relative p-6 bg-gradient-to-br ${style.panel}`}>
                  {/* Medal + GW tag + Rank (Rank shown below GW) */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`leading-none ${style.medalClass}`}>{style.medal}</div>
                    <div className="text-center">
                      <div className="text-xs font-semibold px-2 py-1 rounded-md bg-white/70 text-gray-700 ring-1 ring-black/5">
                        GW {gw}
                      </div>
<div className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-extrabold text-blue-600 shadow-lg drop-shadow-md bg-white/80 ring-1 ring-black/5">
  League Position {row.league_rank}
</div>

                    </div>
                  </div>

                  {/* Names */}
                  <div className={`text-xl md:text-2xl font-extrabold tracking-tight ${style.title}`}>
                    {row.manager_name}
                  </div>
                  <div className="text-sm text-gray-600">{row.team_name}</div>

                  {/* Score */}
                  <div className="mt-4">
                    <div className="text-[11px] uppercase tracking-wider text-gray-500">
                      GW Score
                    </div>
                    <div className={`text-3xl md:text-4xl font-black ${style.score}`}>
                      {row.gw_points}
                    </div>
                  </div>

                  {/* Captain row: avatar + name (left)  |  chip badge (right, only if present) */}
                  <div className="mt-4">
                    <div className="text-[11px] uppercase tracking-wider text-gray-500">
                      Captain Picked
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      {/* Left: Avatar + Name */}
                      <div className="flex items-center gap-3">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={`${row.captain_name} portrait`}
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ${style.avatarRing} bg-white`}
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full grid place-items-center ring-2 ${style.avatarRing} bg-white text-xs text-gray-500`}
                            title="No image"
                          >
                            N/A
                          </div>
                        )}
                        <div className="text-base md:text-lg font-bold text-gray-900">
                          {row.captain_name}
                        </div>
                      </div>

                      

                      {/* Right: Chip badge (if any) */}
                      {chip && (
                        <span
                          title={chip.title}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-extrabold text-blue-600 shadow-lg drop-shadow-md ${chip.cls}`}
                        >
                          {chip.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Full squad (below Captain row) */}
{Array.isArray(row.squad) && row.squad.length > 0 && (
  <SquadGrid squad={row.squad} />
)}

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Others table / cards */}
      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="py-3 pl-5 pr-4 font-semibold text-gray-700">Rank</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Manager</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Team</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Captain</th>
                <th className="py-3 px-4 font-semibold text-gray-700">GW Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {others.map((row, idx) => (
                <tr key={row.manager_id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-3 pl-5 pr-4 font-semibold">{row.league_rank}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{row.manager_name}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{row.team_name}</td>
                  <td className="py-3 px-4 font-medium">{row.captain_name}</td>
                  <td className="py-3 px-4 font-semibold">{row.gw_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards for others */}
        <ul className="md:hidden divide-y divide-gray-100">
          {others.map((row) => (
            <li key={`m-${row.manager_id}`} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full grid place-items-center bg-gray-100 text-gray-800 font-extrabold">
                    {row.rank}
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">{row.manager_name}</div>
                    <div className="text-xs text-gray-600">{row.team_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">GW Score</div>
                  <div className="text-base font-semibold">{row.gw_points}</div>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <span className="text-gray-500">Captain: </span>
                <span className="font-medium">{row.captain_name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        GW Score includes transfer hits automatically (net points for the week).
      </p>
    </div>
  );
}
