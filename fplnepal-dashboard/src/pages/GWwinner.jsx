// src/pages/GWwinner.jsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchFPLData,
  fetchGwTop,
  fetchClassicLeague,
  fetchTieAnalyzer,
} from "../api/fplApi";
import GwTopScoreBench from "../components/GwTopScoreBench";
import GwTopScoreTransfer from "../components/GwTopScoreTransfer";

// const LEAGUE_ID = YOUR_LEAGUE_ID;
const LEAGUE_ID = 235907;

// Small badge to show when a tie was present
const TieBadge = ({ title = "Tie resolved" }) => (
  <span
    title={title}
    className="inline-flex items-center gap-1 text-[11px] px-2 py-[2px] rounded-full bg-purple-100 text-purple-700 ring-1 ring-purple-200 ml-2"
  >
    ⚖️ <span className="hidden sm:inline">TIE</span>
  </span>
);

export default function GWwinner() {
  const [events, setEvents] = useState([]);
  const [gw, setGw] = useState(null);
  const [loading, setLoading] = useState(false);
  const [top3, setTop3] = useState([]);     // can be 3 or more if random draw pending at 3rd
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

  // ---------- helpers ----------

  const shirtFromTeamCode = (teamCode) =>
    teamCode
      ? `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-66.png`
      : null;
  const captainImg = (row) => shirtFromTeamCode(row?.captain_team_code);

  const chipInfo = (chip) => {
    if (!chip) return null;
    const map = {
      "3xc": { label: "TC", title: "Triple Captain", cls: "bg-amber-100 text-amber-700 ring-amber-300" },
      bboost: { label: "BB", title: "Bench Boost", cls: "bg-indigo-100 text-indigo-700 ring-indigo-300" },
      freehit: { label: "FH", title: "Free Hit", cls: "bg-rose-100 text-rose-700 ring-rose-300" },
      wildcard: { label: "WC", title: "Wildcard", cls: "bg-teal-100 text-teal-800 ring-teal-300" },
    };
    return map[chip] || { label: chip?.toUpperCase?.() ?? "CHIP", title: "Chip used", cls: "bg-gray-100 text-gray-700 ring-gray-300" };
  };

  // TieAnalyzer-based resolver:
  // Returns: {winnerId, reason, stillTie}
  // reason ∈ {"goals_scored","goals_conceded","random_draw_pending"}
  async function resolveTieForTop(targetGw, tiedRows) {
    if (!tiedRows?.length) return { winnerId: null, reason: null, stillTie: false };
    if (tiedRows.length === 1) {
      return { winnerId: tiedRows[0].manager_id, reason: null, stillTie: false };
    }

    const anchorId = tiedRows[0].manager_id;
    const stats = {}; // manager_id -> { goals_scored, goals_conceded }

    // First call to capture anchor as team1
    const firstOpp = tiedRows[1].manager_id;
    try {
      const first = await fetchTieAnalyzer(anchorId, firstOpp, targetGw);
      if (first?.team1 && typeof first.team1.goals_scored === "number") {
        stats[anchorId] = {
          goals_scored: first.team1.goals_scored,
          goals_conceded: first.team1.goals_conceded,
        };
      }
    } catch {/* ignore */}

    // Other contestants vs anchor
    await Promise.all(
      tiedRows.slice(1).map(async (r) => {
        try {
          const resp = await fetchTieAnalyzer(anchorId, r.manager_id, targetGw);
          if (resp?.team2 && typeof resp.team2.goals_scored === "number") {
            stats[r.manager_id] = {
              goals_scored: resp.team2.goals_scored,
              goals_conceded: resp.team2.goals_conceded,
            };
          }
        } catch {/* ignore */}
      })
    );

    // Fallback any missing
    tiedRows.forEach((r) => {
      if (!stats[r.manager_id]) stats[r.manager_id] = { goals_scored: 0, goals_conceded: 999 };
    });

    // Sort by rules
    const sorted = [...tiedRows].sort((A, B) => {
      const a = stats[A.manager_id];
      const b = stats[B.manager_id];
      if (b.goals_scored !== a.goals_scored) return b.goals_scored - a.goals_scored; // desc
      if (a.goals_conceded !== b.goals_conceded) return a.goals_conceded - b.goals_conceded; // asc
      return 0;
    });

    // Check if still tied at the very top among all candidates
    const topGS = stats[sorted[0].manager_id].goals_scored;
    const topGC = stats[sorted[0].manager_id].goals_conceded;
    const anyoneEqualTop = sorted.filter(
      (r) => stats[r.manager_id].goals_scored === topGS && stats[r.manager_id].goals_conceded === topGC
    );

    if (anyoneEqualTop.length > 1) {
      // Do NOT randomly pick; show "Random draw will be held"
      return { winnerId: null, reason: "random_draw_pending", stillTie: true };
    }

    // Decide reason text
    const second = sorted[1];
    const a = stats[sorted[0].manager_id];
    const b = stats[second.manager_id];
    const reason = a.goals_scored !== b.goals_scored ? "goals_scored" : "goals_conceded";
    return { winnerId: sorted[0].manager_id, reason, stillTie: false };
  }

  // pick strict Top 1/2/3 using tie rules
  function removeByIds(pool, ids) {
    const set = new Set(ids);
    return pool.filter((r) => !set.has(r.manager_id));
  }

  async function pickOnePosition(targetGw, pool) {
    if (pool.length === 0) return { picks: [], remaining: pool };

const bestScore = Math.max(...pool.map((r) => Number(r.net_points ?? -1)));
const candidates = pool.filter((r) => Number(r.net_points) === bestScore);


    if (candidates.length === 1) {
      return { picks: [{ ...candidates[0] }], remaining: removeByIds(pool, [candidates[0].manager_id]) };
    }

    // Resolve with TieAnalyzer
    const { winnerId, reason, stillTie } = await resolveTieForTop(targetGw, candidates);

    if (stillTie || !winnerId) {
      // Mark ALL candidates as random-draw pending and return them all (so 3rd place may show multiple)
      const marked = candidates.map((r) => ({
        ...r,
        _isTie: true,
        _tieReason: "random_draw_pending",
        _randomDrawPending: true,
      }));
      return { picks: marked, remaining: removeByIds(pool, candidates.map((c) => c.manager_id)) };
    }

    // Normal winner
    const markedCandidates = candidates.map((r) => ({
      ...r,
      _isTie: true,
      _isTieWinner: r.manager_id === winnerId,
      _tieReason: reason, // "goals_scored" | "goals_conceded"
    }));
    const winnerRow = markedCandidates.find((r) => r._isTieWinner);
    return { picks: [winnerRow], remaining: removeByIds(pool, candidates.map((c) => c.manager_id)) };
  }

  const handleFetch = async (targetGw) => {
    setLoading(true);

    // fetch both gwTop and full standings
    const gwTop = await fetchGwTop(LEAGUE_ID, targetGw);
    const standings = await fetchClassicLeague(LEAGUE_ID, targetGw);

    // rank map
    const rankMap = {};
    standings.forEach((s) => { rankMap[s.id] = s.rank; });

    // merge
    const top3WithRank = (gwTop?.top3 || []).map((r) => ({ ...r, league_rank: rankMap[r.manager_id] || "-" }));
    const othersWithRank = (gwTop?.others || []).map((r) => ({ ...r, league_rank: rankMap[r.manager_id] || "-" }));

    // Build a single pool to choose Top 1,2,3 strictly with tie rules
    // Compute net_points (points - transferCost)
let pool = [...top3WithRank, ...othersWithRank].map((r) => ({
  ...r,
  net_points: (Number(r.gw_points) || 0) - (Number(r.transfers_cost) || 0),
}));

    const chosen = [];

    // Pick 1st, 2nd, 3rd
    for (let i = 0; i < 3; i++) {
      const { picks, remaining } = await pickOnePosition(targetGw, pool);
      if (picks.length === 0) break;
      chosen.push(...picks);
      pool = remaining;
      // If a position returned multiple (random draw pending), we still proceed:
      // - For 1st or 2nd, we continue to pick next position from *remaining* pool.
      // - For 3rd, it's fine to have >3 cards; we'll display them all.
    }

    // If we selected fewer than 3 cards (because pool ended early), top up from pool by score desc
    if (chosen.length < 3 && pool.length > 0) {
      const sortedPool = [...pool].sort((a, b) => Number(b.net_points) - Number(a.net_points));

      while (chosen.length < 3 && sortedPool.length) chosen.push(sortedPool.shift());
      pool = sortedPool;
    }

    // Compute Others = everything not in chosen (by manager_id)
    const chosenIds = new Set(chosen.map((c) => c.manager_id));
    let othersArr = [...top3WithRank, ...othersWithRank].filter((r) => !chosenIds.has(r.manager_id));

    // Mark ANY score ties (visual badge) across *all* rows we will render
    const everyone = [...chosen, ...othersArr];
    const scoreCounts = {};
    everyone.forEach((r) => {
      const s = Number(r.net_points);

      if (!Number.isNaN(s)) scoreCounts[s] = (scoreCounts[s] || 0) + 1;
    });
    const markScoreTies = (rows) =>
      rows.map((r) => ({
        ...r,
        _hasScoreTie: scoreCounts[Number(r.gw_points)] > 1,
      }));

    setTop3(markScoreTies(chosen));
    setOthers(markScoreTies(othersArr));
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

  // ----- styles -----
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
          <h1 className="text-3xl font-extrabold tracking-tight">FPL NEPAL CLASSIC LEAGUE</h1>
          <p className="text-lg font-semibold text-gray-700">GAMEWEEK WINNERS</p>
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

      {/* Top (1–3). May contain 4+ cards if random draw pending at 3rd */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-12">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
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

            const tieTitle =
              row._tieReason === "goals_conceded"
                ? "Tie resolved: fewest goals conceded"
                : row._tieReason === "random_draw_pending"
                ? "Random draw will be held"
                : "Tie resolved: most goals scored";

            return (
              <div
                key={row.manager_id + ":" + idx}
                className={`relative overflow-hidden rounded-2xl shadow-2xl ring-1 ${style.ring} ${
                  row._randomDrawPending ? "outline outline-2 outline-purple-300" : ""
                }`}
              >
                {/* Left accent bar */}
                <div className={`absolute inset-y-0 left-0 w-1 ${style.leftBar} rounded-l-2xl`} />

                {/* Content */}
                <div className={`relative p-6 bg-gradient-to-br ${style.panel}`}>
                  {/* Medal + GW tag + Rank */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`leading-none ${style.medalClass}`}>{style.medal}</div>
                    <div className="text-center">
                      <div className="text-xs font-semibold px-2 py-1 rounded-md bg-white/70 text-gray-700 ring-1 ring-black/5">GW {gw}</div>
                      <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-extrabold text-blue-600 shadow-lg drop-shadow-md bg-white/80 ring-1 ring-black/5">
                        League Position {row.league_rank}
                      </div>
                    </div>
                  </div>

                  {/* Name + tie badge + reason */}
                  <div className="flex items-center flex-wrap">
                    <a
                      href={`https://fantasy.premierleague.com/entry/${row.manager_id}/event/${gw}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xl md:text-2xl font-extrabold tracking-tight ${style.title} hover:underline text-black`}
                    >
                      {row.manager_name}
                    </a>
                    {(row._isTie || row._hasScoreTie || row._randomDrawPending) && (
                      <TieBadge
                        title={
                          row._randomDrawPending
                            ? "Random draw will be held"
                            : row._isTie
                            ? (row._isTieWinner ? tieTitle : "Tied at this position")
                            : "Score tie (same GW points)"
                        }
                      />
                    )}
                  </div>

                  {/* If resolver chose a reason, show tiny hint line */}
                  {(row._tieReason || row._randomDrawPending) && (
                    <div className="mt-1 text-xs text-purple-800">
                      {row._randomDrawPending
                        ? "Random draw will be held"
                        : row._tieReason === "goals_conceded"
                        ? "Won on fewest goals conceded"
                        : row._tieReason === "goals_scored"
                        ? "Won on most goals scored"
                        : ""}
                    </div>
                  )}

                  <div className="text-sm text-gray-600">{row.team_name}</div>

                  {/* Score */}
                  <div className="mt-4">
                    <div className="text-[11px] uppercase tracking-wider text-gray-500">GW Score</div>
                    <div className="flex items-baseline gap-2">
                      <GwTopScoreBench
  gwPoints={Number(row.gw_points ?? 0) - Number(row.transfers_cost ?? 0)} // Net score
  squad={row.squad}
  chip={row.chip}
  scoreClass={style.score}
/>

                      <GwTopScoreTransfer transfersMade={row.event_transfers} transfersCost={row.transfers_cost} chip={row.chip} />
                    </div>
                  </div>

                  {/* Captain & VC */}
                  <div className="mt-4">
                    <div className="text-[11px] uppercase tracking-wider text-gray-500">Captain & Vice Captain</div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      {/* Captain */}
                      <div className="flex items-center gap-3">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={`${row.captain_name} portrait`}
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ${style.avatarRing} bg-white`}
                            loading="lazy"
                          />
                        ) : (
                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full grid place-items-center ring-2 ${style.avatarRing} bg-white text-xs text-gray-500`} title="No image">
                            N/A
                          </div>
                        )}
                        <div className="text-base md:text-lg font-bold text-gray-900">C: {row.captain_name}</div>
                      </div>

                      {/* Vice Captain */}
                      <div className="flex items-center gap-3">
                        {row.vice_team_code ? (
                          <img
                            src={shirtFromTeamCode(row.vice_team_code)}
                            alt={`${row.vice_name} kit`}
                            className={`w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ${style.avatarRing} bg-white`}
                            loading="lazy"
                          />
                        ) : (
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full grid place-items-center ring-2 ${style.avatarRing} bg-white text-xs text-gray-500`}>N/A</div>
                        )}
                        <div className="text-sm font-semibold text-gray-800">VC: {row.vice_name}</div>
                      </div>

                      {/* Chip badge */}
                      {chip && (
                        <span title={chip.title} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-extrabold text-blue-600 shadow-lg drop-shadow-md ${chip.cls}`}>
                          {chip.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Others */}
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
    <th className="py-3 px-4 font-semibold text-gray-700">Bench</th>
    <th className="py-3 px-4 font-semibold text-gray-700 text-right">Hit</th>
  </tr>
</thead>


            <tbody className="divide-y divide-gray-100">
              {others.map((row, idx) => {
                const tieTitle =
                  row._tieReason === "goals_conceded"
                    ? "Tie resolved: fewest goals conceded"
                    : row._tieReason === "random_draw_pending"
                    ? "Random draw will be held"
                    : "Tie resolved: most goals scored";
                return (
                  <tr key={row.manager_id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="py-3 pl-5 pr-4 font-semibold">{row.league_rank}</td>
                    <td className="py-3 px-4">
                      <a
                        href={`https://fantasy.premierleague.com/entry/${row.manager_id}/event/${gw}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-black hover:underline"
                      >
                        {row.manager_name}
                      </a>

                    </td>
                    <td className="py-3 px-4 text-gray-700">{row.team_name}</td>
                    <td className="py-3 px-4 font-medium">{row.captain_name}</td>
{/* GW Score */}
<td className="py-3 px-4 font-semibold">{row.gw_points}</td>

{/* ✅ New Bench column */}
<td className="py-3 px-4 text-gray-700">
  {row.squad
    ? row.squad
        .filter(p => (p.position ?? 0) > 11)
        .reduce((sum, p) => sum + Number(p.points ?? 0), 0)
    : 0}
</td>

{/* Hit column */}
<td className="py-3 px-4 text-right font-semibold text-red-600">
  {row.transfers_cost > 0 ? `-${row.transfers_cost}` : "—"}
</td>


                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="md:hidden divide-y divide-gray-100">
          {others.map((row) => {
            const tieTitle =
              row._tieReason === "goals_conceded"
                ? "Tie resolved: fewest goals conceded"
                : row._tieReason === "random_draw_pending"
                ? "Random draw will be held"
                : "Tie resolved: most goals scored";
            return (
              <li key={`m-${row.manager_id}`} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full grid place-items-center bg-gray-100 text-gray-800 font-extrabold">
                      {row.rank}
                    </div>
                    <div>
                      <div className="font-semibold leading-tight flex items-center flex-wrap">
                        {row.manager_name}

                      </div>

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
            );
          })}
        </ul>
      </div>

      <p className="mt-4 text-xs text-gray-500">GW Score includes transfer hits automatically (net points for the week).</p>
    </div>
  );
}
