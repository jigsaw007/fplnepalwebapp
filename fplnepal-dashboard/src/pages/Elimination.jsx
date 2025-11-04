import { useEffect, useMemo, useState } from "react";
import {
  fetchFPLData,
  fetchEliminatedByGW,
  fetchRemainingAfterGW,
  fetchEliminationRules,
  fetchClassicLeague,
  fetchManagerInfo, // used to resolve missing names
} from "../api/fplApi";

const tone = {
  blue:   "bg-blue-50 text-blue-700 ring-blue-200",
  red:    "bg-rose-50 text-rose-700 ring-rose-200",
  slate:  "bg-slate-100 text-slate-700 ring-slate-200",
  green:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  gray:   "bg-gray-100 text-gray-700 ring-gray-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
};

const Chip = ({ children, color = "gray" }) => (
  <span className={`text-[11px] px-2 py-0.5 rounded-full ring-1 ${tone[color]}`}>
    {children}
  </span>
);

const StatPill = ({ label, value, color = "slate" }) => (
  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${tone[color]}`}>
    <span className="uppercase">{label}</span>
    <span>{value}</span>
  </span>
);

const Spinner = ({ size = 24, message = "Loading..This might take few seconds." }) => (
  <div className="flex items-center gap-2 text-gray-600">
    <div
      className="animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
    <span className="text-sm">{message}</span>
  </div>
);

const DEFAULT_LEAGUE_ID = "235907";

// Small concurrency runner
async function runWithLimit(tasks, limit = 4) {
  const results = new Array(tasks.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    for (; i < tasks.length; ) {
      const cur = i++;
      try {
        results[cur] = await tasks[cur]();
      } catch {
        results[cur] = null;
      }
    }
  });
  await Promise.all(workers);
  return results;
}

// Stage chip
function stageForGW(gw) {
  if (gw >= 6 && gw <= 13) return "Stage 1";
  if (gw >= 14 && gw <= 24) return "Stage 2";
  if (gw >= 25 && gw <= 37) return "Stage 3";
  if (gw === 38) return "Final";
  return null;
}

// Row that ensures name is loaded
function EliminatedRow({ gw, row, namesById, ensureName }) {
  const key = String(row.entry_id);
  const nameObj = namesById.get(key);

  useEffect(() => {
    if (!nameObj) ensureName(row.entry_id);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const mgr = nameObj?.manager_name?.trim();
  const team = nameObj?.team_name?.trim();
  const primary = mgr && team ? `${mgr}` : (mgr || team || `Entry ${row.entry_id}`);

  const hasHits = typeof row.hits === "number";
  const net = hasHits ? (Number(row.gw_points || 0) - Number(row.hits || 0)) : row.gw_points;

  // Determine tone by performance
  const netColor =
    net >= 70 ? "text-green-700 bg-green-50 border-green-200" :
    net >= 50 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
    net >= 35 ? "text-yellow-700 bg-yellow-50 border-yellow-200" :
    "text-rose-700 bg-rose-50 border-rose-200";

  return (
    <div
      className="
        flex justify-between items-center
        bg-white/90 backdrop-blur-sm
        border border-slate-200 rounded-2xl p-3 md:p-4
        shadow-sm hover:shadow-md transition-all duration-200
        hover:-translate-y-0.5
      "
    >
      <div>
        <div className="font-semibold text-gray-800 text-sm md:text-base">{primary}</div>
        <div className="text-[11px] text-gray-500">{team || "—"} • ID {row.entry_id}</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200 font-medium">
          Pts {row.gw_points}
        </div>
        {hasHits && (
          <div className="text-[11px] bg-rose-50 text-rose-700 px-2 py-1 rounded-full border border-rose-200 font-medium">
            Hits {row.hits}
          </div>
        )}
        <div
          className={`text-[12px] md:text-sm font-bold px-3 py-1.5 rounded-full border ${netColor}`}
        >
          Final Score {net}
        </div>
      </div>
    </div>
  );
}


function GWCard({ gw, dateLabel, eliminated, remainingCount, namesById, expectedElims, ensureName }) {
  const stage = stageForGW(gw);

  const stageGradient =
    stage === "Stage 1"
      ? "from-indigo-100 to-blue-50"
      : stage === "Stage 2"
      ? "from-emerald-100 to-green-50"
      : stage === "Stage 3"
      ? "from-amber-100 to-yellow-50"
      : "from-violet-100 to-pink-50";

  return (
    <div
      className={`rounded-3xl p-5 md:p-6 border border-slate-200 shadow-md
                  bg-gradient-to-br ${stageGradient} transition-all hover:shadow-xl`}
    >
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg md:text-xl font-bold text-gray-800">GW {gw}</h3>
          {dateLabel && <span className="text-xs text-gray-600">{dateLabel}</span>}
          {stage && (
            <span className="bg-slate-900 text-white text-[11px] px-2.5 py-0.5 rounded-full">
              {stage}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {typeof expectedElims === "number" && expectedElims > 0 && (
            <Chip color="green">{expectedElims} expected out</Chip>
          )}
          <Chip color="blue">Remaining {remainingCount ?? "-"}</Chip>
        </div>
      </div>

      {/* Body */}
      {eliminated.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-white/40 rounded-2xl text-gray-500">
          No eliminations this week 🎉
        </div>
      ) : (
        <div className="space-y-3">
{eliminated
  .slice()
  .sort((a, b) => {
    const netA = (a.gw_points || 0) - (a.hits || 0);
    const netB = (b.gw_points || 0) - (b.hits || 0);
    return netA - netB; // low to high
  })
  .map((r) => (
    <EliminatedRow
      key={`${gw}-${r.entry_id}`}
      gw={gw}
      row={r}
      namesById={namesById}
      ensureName={ensureName}
    />
  ))}

        </div>
      )}
    </div>
  );
}

export default function Elimination() {
  const [leagueId] = useState(DEFAULT_LEAGUE_ID);
  const [events, setEvents] = useState([]);       // bootstrap-static events
  const [latestFinished, setLatestFinished] = useState(0);

  // Map<string, {manager_name, team_name}>
  const [namesById, setNamesById] = useState(new Map());

  // right sidebar: full remaining after latest finished
  const [remainingNow, setRemainingNow] = useState({ count: 0, remaining: [] });
  const [loadingRemaining, setLoadingRemaining] = useState(false);

  // all GW cards
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // ensureName: fetch on-demand and cache in namesById (keyed by String(id))
  const ensureName = async (entryId) => {
    const key = String(entryId);
    const existing = namesById.get(key);

    // Only skip if we already have a real name (not a placeholder)
    if (existing && existing.manager_name && !/^Entry\s/.test(existing.manager_name)) return;

    try {
      const info = await fetchManagerInfo(entryId); // {manager_name, team_name}
      if (info) {
        setNamesById((prev) => {
          const m = new Map(prev);
          m.set(key, {
            manager_name: info.manager_name || `Entry ${entryId}`,
            team_name: info.team_name || "",
          });
          return m;
        });
      }
    } catch {
      // don't cache a permanent placeholder on error; try again on next render if needed
    }
  };

  // 1) bootstrap + league standings (for names) + latest finished GW
  useEffect(() => {
    (async () => {
      try {
        const boot = await fetchFPLData();
        const evts = boot?.events || [];
        setEvents(evts);

        const now = new Date();
        const finished = evts
          .filter((e) => e.finished || e.data_checked || new Date(e.deadline_time) <= now)
          .sort((a, b) => a.id - b.id)
          .pop();
        if (finished?.id) setLatestFinished(finished.id);

        // Seed names from classic league (page can be partial, still helps)
        const table = await fetchClassicLeague(leagueId);
        const rows =
          table?.standings?.results ||
          table?.standings?.entries ||
          table?.standings ||
          [];
        setNamesById((prev) => {
          const m = new Map(prev);
          (rows || []).forEach((r) => {
            const key = String(r.entry);
            m.set(key, { manager_name: r.player_name, team_name: r.entry_name });
          });
          return m;
        });
      } catch (e) {
        console.error("Initial load failed:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute finished GWs list (1..latestFinished)
  const gwsFinished = useMemo(
    () => Array.from({ length: Math.max(latestFinished || 0, 0) }, (_, i) => i + 1),
    [latestFinished]
  );

  // helper: date under GW title
  const dateLabelForGW = (gw) => {
    const e = events.find((x) => x.id === gw);
    if (!e?.deadline_time) return "";
    try {
      const d = new Date(e.deadline_time);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Build a single GW card
  const fetchGWCard = async (gw) => {
    const [elim, remaining, rule] = await Promise.all([
      fetchEliminatedByGW(gw).catch(() => []),
      fetchRemainingAfterGW(leagueId, gw).catch(() => ({ count: 0, remaining: [] })),
      fetchEliminationRules(gw).catch(() => null),
    ]);
    // fire & forget ensureName for any eliminated IDs we don't know yet
    (elim || []).forEach((r) => {
      const k = String(r.entry_id);
      if (!namesById.has(k)) ensureName(r.entry_id);
    });
    return {
      gw,
      dateLabel: dateLabelForGW(gw),
      eliminated: Array.isArray(elim) ? elim : [],
      remainingCount: Number(remaining?.count ?? 0),
      expectedElims: rule?.eliminate_count ?? null,
    };
  };

  // 2) Load only FINISHED GWs, newest first, with limited concurrency
  useEffect(() => {
    (async () => {
      if (!gwsFinished.length) return;
      setLoadingCards(true);
      try {
        const newestFirst = [...gwsFinished].sort((a, b) => b - a);
        const tasks = newestFirst.map((gw) => () => fetchGWCard(gw));
        const results = await runWithLimit(tasks, 4);
        // keep newest first in state
        setCards(results.filter(Boolean));
      } finally {
        setLoadingCards(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gwsFinished.length]);

  // 3) Remaining AFTER latest finished GW for the right sidebar
  useEffect(() => {
    (async () => {
      if (!latestFinished) return;
      setLoadingRemaining(true);
      try {
        const rem = await fetchRemainingAfterGW(leagueId, latestFinished);
        setRemainingNow(rem || { count: 0, remaining: [] });

        // ensure names for remaining too
        (rem?.remaining || []).forEach((r) => {
          const k = String(r.entry_id);
          if (!namesById.has(k)) {
            setNamesById((prev) => {
              const m = new Map(prev);
              m.set(k, {
                manager_name: r.manager_name || `Entry ${r.entry_id}`,
                team_name: r.team_name || "",
              });
              return m;
            });
          }
        });
      } finally {
        setLoadingRemaining(false);
      }
    })();
  }, [leagueId, latestFinished]); // namesById intentionally omitted

  const leftCards = useMemo(() => cards, [cards]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">FPL NEPAL Elimination League 25|26</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT: finished GWs (newest first) */}
        <div className="md:col-span-2 space-y-4">
          {leftCards.map((c) => (
            <GWCard
              key={c.gw}
              gw={c.gw}
              dateLabel={c.dateLabel}
              eliminated={c.eliminated}
              remainingCount={c.remainingCount}
              namesById={namesById}
              expectedElims={c.expectedElims}
              ensureName={ensureName}
            />
          ))}

          {loadingCards ? (
            <div className="flex items-center justify-center py-6">
              <Spinner size={24} message="Loading..This might take few seconds." />
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">
              Showing {cards.length} finished gameweeks.
            </div>
          )}
        </div>

        {/* RIGHT: Remaining full list after latest finished */}
        <aside className="md:col-span-1">
          <div className="border rounded-xl p-3 bg-white shadow-sm sticky top-4 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">Remaining Managers</div>
              <div className="text-sm">
                <span className="font-semibold">{remainingNow?.count ?? 0}</span>
              </div>
            </div>

            <div className="mt-2">
              {loadingRemaining ? (
                <div className="flex items-center justify-center py-6">
                  <Spinner size={20} />
                  <span className="sr-only">Loading remaining…</span>
                </div>
              ) : remainingNow?.remaining?.length ? (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left">Manager</th>
                      <th className="p-2 text-left">Team</th>
                      <th className="p-2 text-left">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remainingNow.remaining.map((m) => {
                      const k = String(m.entry_id);
                      const nm = namesById.get(k);
                      return (
                        <tr key={m.entry_id} className="border-b last:border-0">
                          <td className="p-2">{m.manager_name || nm?.manager_name || `Entry ${m.entry_id}`}</td>
                          <td className="p-2">{m.team_name || nm?.team_name || "-"}</td>
                          <td className="p-2 text-[11px] text-gray-500">{m.entry_id}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-sm text-gray-500">No data</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
