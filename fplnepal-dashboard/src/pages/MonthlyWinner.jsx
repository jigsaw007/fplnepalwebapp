// src/pages/MonthlyWinner.jsx
import { useEffect, useMemo, useState } from "react";
import { Crown, Trophy } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { fetchMonthlyWinner, fetchMonthlyAvailable } from "../api/fplApi";

const LEAGUE_ID = 235907;

function monthLabel(m) {
  return new Date(2000, m - 1, 1).toLocaleString(undefined, { month: "long" });
}
const now = new Date();
const DEFAULT_YEAR = now.getFullYear();
const DEFAULT_MONTH =
  now.getMonth() === 0 ? 12 : now.getMonth();


const chipLabel = (chip) => {
  if (!chip) return null;
  const map = {
    "3xc": "Triple Captain",
    triple_captain: "Triple Captain",
    bboost: "Bench Boost",
    bench_boost: "Bench Boost",
    freehit: "Free Hit",
    wildcard: "Wildcard",
  };
  return map[chip.toLowerCase()] || chip;
};

const tileColor = (idx) => {
  const colors = [
    "from-amber-50 to-amber-100 ring-amber-200",
    "from-sky-50 to-sky-100 ring-sky-200",
    "from-emerald-50 to-emerald-100 ring-emerald-200",
    "from-fuchsia-50 to-fuchsia-100 ring-fuchsia-200",
    "from-indigo-50 to-indigo-100 ring-indigo-200",
    "from-rose-50 to-rose-100 ring-rose-200",
  ];
  return colors[idx % colors.length];
};

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200/70 rounded ${className}`} />
);

export default function MonthlyWinner() {
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState(DEFAULT_MONTH); // corrected later if not available
  const [availableMonths, setAvailableMonths] = useState([]); // [1..12]

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const years = useMemo(() => {
    const y = DEFAULT_YEAR;
    return [y - 1, y, y + 1];
  }, []);

  const loadAvailableMonths = async (y) => {
    const res = await fetchMonthlyAvailable(y);
    const months = res?.months || [];
    setAvailableMonths(months);
    // If the chosen month isn't available, default to first available (or keep current system month if none)
    if (!months.includes(month)) {
      setMonth(months[0] ?? DEFAULT_MONTH);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const res = await fetchMonthlyWinner(LEAGUE_ID, year, month);
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadAvailableMonths(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const winner = data?.winner;
  const gwBreakdown = data?.winner_gw_breakdown || [];
  const winnerLeagueRank = data?.winner_league_rank ?? winner?.league_rank ?? null;

  // Confetti background (subtle) for hero hover
  const confettiStyle = {
    backgroundImage: `
      radial-gradient(circle at 10% 20%, rgba(255,215,0,0.25) 2px, transparent 3px),
      radial-gradient(circle at 80% 10%, rgba(255,105,180,0.25) 2px, transparent 3px),
      radial-gradient(circle at 30% 80%, rgba(0,128,255,0.22) 2px, transparent 3px),
      radial-gradient(circle at 60% 60%, rgba(0,200,83,0.22) 2px, transparent 3px)
    `,
    backgroundSize: "12px 12px",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Global styles for underline animation */}
      <style>
        {`
          @keyframes gold-underline-sweep {
            0% { transform: scaleX(0); opacity: .6; }
            50% { transform: scaleX(1); opacity: 1; }
            100% { transform: scaleX(0); opacity: .6; }
          }
        `}
      </style>

      {/* Top controls (no headline) */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-end gap-3">
        <div className="flex items-center gap-3 justify-center">
          <select
            className="border rounded-2xl px-3 py-2 shadow-sm text-base"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>

          <select
            className="border rounded-2xl px-3 py-2 shadow-sm text-base"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <button
            className="px-4 py-2 rounded-2xl border shadow-sm hover:shadow-md transition inline-flex items-center gap-2 disabled:opacity-60 text-base"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? (<><ClipLoader size={16} /><span>Loading…</span></>) : "Refresh"}
          </button>
        </div>
      </div>

      {/* ===== LOADING SKELETON ===== */}
      {loading && (
        <>
          <div className="w-full relative overflow-hidden rounded-3xl shadow-2xl ring-2 ring-amber-300/70 bg-gradient-to-b from-amber-100 via-amber-50 to-white px-6 py-10 mb-8">
            <div className="flex flex-col items-center text-center gap-4">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-7 w-40 rounded-full" />
              <Skeleton className="h-12 w-72" />
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-12 w-32 mt-1" />
              <div className="mt-6 grid w-full grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl p-4 ring-1 bg-white/60 shadow-sm">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    {["Rank", "Manager", "Team", "League Pos", "Monthly Points"].map((h) => (
                      <th key={h} className="py-3 px-4 font-semibold text-gray-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-10" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-44" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-44" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-14" /></td>
                      <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== REAL CONTENT ===== */}
      {!loading && (
        <>
          {/* WINNER HERO (group = for confetti hover) */}
          <div className="group w-full relative overflow-hidden rounded-3xl shadow-2xl ring-2 ring-amber-300/70 bg-gradient-to-b from-amber-100 via-amber-50 to-white px-6 py-10 mb-8">
            {/* subtle confetti on hover */}
            <div
              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              
            />

            <div className="absolute -top-6 -left-6 opacity-30">
              <Crown className="w-28 h-28" />
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-30 rotate-12">
              <Trophy className="w-32 h-32" />
            </div>

            <div className="relative flex flex-col items-center text-center">
              {/* Big title inside hero */}
              <div className="text-3xl md:text-4xl font-black tracking-tight leading-tight relative">
                Manager of the Month
                {/* animated gold underline */}
                <span
                  className="block h-[3px] rounded-full mt-2"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,215,0,0) 0%, rgba(255,215,0,1) 25%, rgba(255,215,0,1) 75%, rgba(255,215,0,0) 100%)",
                    transformOrigin: "left center",
                    animation: "gold-underline-sweep 2.2s ease-in-out infinite",
                  }}
                />
              </div>

              {/* Month pill */}
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 ring-1 ring-black/5 text-sm font-semibold">
                {monthLabel(data?.month || month)}
              </div>

              {/* Winner row */}
              <div className="mt-4 flex items-center gap-4">
                <div className="grid place-items-center rounded-2xl p-4 bg-white/80 ring-1 ring-black/5">
                  <Crown className="w-11 h-11" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  {winner ? winner.manager_name : "No data"}
                </h2>
              </div>

              {winner && (
                <>
                  <div className="mt-2 text-lg text-gray-700">{winner.team_name}</div>
                  <div className="mt-3 text-5xl font-extrabold text-amber-800">
                    {winner.monthly_net_points} pts
                  </div>
                  {winnerLeagueRank && (
                    <div className="mt-1 text-base text-gray-800">
                      League Position: <b className="text-amber-800">#{winnerLeagueRank}</b>
                    </div>
                  )}

                  {/* Gameweeks row – full width auto-fit */}
                  <div className="mt-7 w-full">
                    <div className="text-sm text-gray-700 mb-3">
                      Gameweeks: {data?.gameweeks?.length ? data.gameweeks.join(", ") : "—"}
                    </div>

                    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] w-full">
                      {gwBreakdown.map(({ gw, net, points, hits, chip, captain }, idx) => (
                        <div
                          key={gw}
                          className={`rounded-2xl p-4 ring-1 bg-gradient-to-br ${tileColor(idx)} shadow-sm hover:shadow-md transition flex flex-col h-full`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-gray-700 font-bold">
                              GW {gw}
                            </span>
                            {(chip || captain) && (
                              <div className="flex items-center gap-1">
                                {chip && (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-black/70 text-white">
                                    {chipLabel(chip)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Captain (text) */}
                          {captain && (
                            <div className="mt-2 text-sm text-gray-900 font-semibold">
                              Captain: <span className="font-bold">{captain.name}</span>
                              {captain.team ? (
                                <span className="text-gray-700 font-normal"> ({captain.team})</span>
                              ) : null}
                            </div>
                          )}

                          {/* Push points row to bottom for equal heights */}
                          <div className="mt-auto">
                            <div className="mt-2 text-2xl font-extrabold">{net} pts</div>
                            <div className="text-sm text-gray-700">
                              {points} pts <span className="mx-1">•</span> −{hits} hits
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Standings */}
          {data && (
            <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-base">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="py-3 pl-5 pr-4 font-semibold text-gray-700">Rank</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Manager</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Team</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">League Pos</th>
                      <th className="py-3 px-4 font-semibold text-gray-700 text-right">Monthly Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.standings?.map((r, idx) => (
                      <tr
                        key={r.manager_id}
                        className={idx === 0 ? "bg-amber-50/50" : (idx % 2 === 0 ? "bg-white" : "bg-gray-50")}
                      >
                        <td className="py-3 pl-5 pr-4 font-semibold">{r.rank}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{r.manager_name}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{r.team_name}</td>
                        <td className="py-3 px-4">{r.league_rank ?? "-"}</td>
                        <td className="py-3 px-4 font-semibold text-right">{r.monthly_net_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-5 py-3 text-xs text-gray-500">
                Points = Σ (GW points − transfer hits) for all gameweeks whose deadlines fall in the selected month.
              </p>
            </div>
          )}

          {!data && (
            <div className="text-gray-500 text-center mt-6">Select a month and year.</div>
          )}
        </>
      )}
    </div>
  );
}
