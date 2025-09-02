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
const ALL_GWS_ASC = Array.from({ length: 38 }, (_, i) => i + 1);

// Stage chip
function stageForGW(gw) {
  if (gw >= 6 && gw <= 13) return "Stage 1";
  if (gw >= 14 && gw <= 24) return "Stage 2";
  if (gw >= 25 && gw <= 37) return "Stage 3";
  if (gw === 38) return "Final";
  return null;
}

// Small helper: build a safe display name
function displayName(rec) {
  const mgr = rec?.manager_name?.trim();
  const team = rec?.team_name?.trim();
  if (mgr && team) return `${mgr} — ${team}`;
  if (mgr) return mgr;
  if (team) return team;
  return null;
}

// Row that ensures name is loaded
function EliminatedRow({ gw, row, namesById, ensureName }) {
  const key = String(row.entry_id);
  const nameObj = namesById.get(key);

  useEffect(() => {
    if (!nameObj) ensureName(row.entry_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const mgr = nameObj?.manager_name?.trim();
  const team = nameObj?.team_name?.trim();
  const primary = mgr && team ? `${mgr} — ${team}` : (mgr || team || `Entry ${row.entry_id}`);

  // Compute "net" the same way as in candidates: points - hits (hits is a positive cost value)
  const hasHits = typeof row.hits === "number";
  const net = hasHits ? (Number(row.gw_points || 0) - Number(row.hits || 0)) : row.gw_points;

  return (
    <li
      key={`${gw}-${row.entry_id}`}
      className="
        group flex items-center justify-between gap-3
        rounded-xl border border-slate-200/70 bg-white
        px-3 py-2 shadow-sm hover:shadow-md transition
      "
    >
      <div className="flex flex-col">
        <span className="font-medium leading-tight">{primary}</span>
        <span className="text-[11px] text-gray-500">ID: {row.entry_id}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <StatPill label="pts" value={row.gw_points} color="blue" />
        {hasHits && <StatPill label="hits" value={row.hits} color="red" />}
        <StatPill label="net" value={net} color="slate" />
      </div>
    </li>
  );
}


function GWCard({ gw, dateLabel, eliminated, remainingCount, namesById, expectedElims, ensureName }) {
  const stage = stageForGW(gw);

  return (
    <div
      className="
        rounded-2xl p-4 md:p-5
        bg-gradient-to-br from-white to-slate-50
        border border-slate-200/70 shadow-lg ring-1 ring-black/5
        hover:-translate-y-0.5 hover:shadow-xl transition
      "
    >
      {/* Header */}
      <div className="mb-3">
        <div
          className="
            flex flex-wrap items-center justify-between gap-2
            rounded-xl px-3 py-2
            bg-gradient-to-r from-indigo-600/10 to-purple-600/10
            border border-indigo-200/50
          "
        >
          <div className="flex items-center gap-2">
            <h3 className="text-base md:text-lg font-semibold">GW {gw}</h3>
            {dateLabel ? (
              <span className="text-xs text-gray-600">{dateLabel}</span>
            ) : null}
            {stage && <Chip color="purple">{stage}</Chip>}
            {typeof expectedElims === "number" && expectedElims > 0 && (
              <Chip color="green">Expected: {expectedElims} out</Chip>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Chip color="green">Remaining: {remainingCount ?? "-"}</Chip>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Eliminated this GW</div>
        </div>

        {eliminated.length === 0 ? (
          <div
            className="
              rounded-xl border-2 border-dashed border-slate-200
              bg-white/60 text-sm text-gray-500 px-3 py-6
              text-center
            "
          >
            None
          </div>
        ) : (
          <ul className="space-y-1.5">
            {eliminated.map((r) => (
              <EliminatedRow
                key={`${gw}-${r.entry_id}`}
                gw={gw}
                row={r}
                namesById={namesById}
                ensureName={ensureName}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


export default function Elimination() {
  const [leagueId] = useState(DEFAULT_LEAGUE_ID);
  const [events, setEvents] = useState([]); // bootstrap-static events
  const [latestFinished, setLatestFinished] = useState(1);

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
    const info = await fetchManagerInfo(entryId); // now returns {manager_name, team_name}
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
    // don't cache a permanent placeholder on error; try again next render if needed
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

  // Build a single GW card (ASC 1→38)
  const fetchGWCard = async (gw) => {
    const [elim, remaining, rule] = await Promise.all([
      fetchEliminatedByGW(gw).catch(() => []),
      fetchRemainingAfterGW(leagueId, gw).catch(() => ({ count: 0, remaining: [] })),
      fetchEliminationRules(gw).catch(() => null),
    ]);
    // kick off ensureName for any eliminated IDs we don't know yet (fire & forget)
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

  // 2) Load ALL 38 GWs (ASC 1 → 38)
  useEffect(() => {
    (async () => {
      setLoadingCards(true);
      try {
        const results = [];
        for (const gw of ALL_GWS_ASC) {
          // sequential to avoid hammering; change to Promise.allSettled if you prefer
          // but keeping it tame is friendly to the FPL API.
          const card = await fetchGWCard(gw);
          results.push(card);
        }
        setCards(results);
      } finally {
        setLoadingCards(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

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
        {/* LEFT: all GWs 1 → 38 */}
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
  <div className="text-center text-sm text-gray-500">All 38 gameweeks displayed.</div>
)}


        </div>

        {/* RIGHT: Remaining full list after latest finished */}
        <aside className="md:col-span-1">
          <div className="border rounded-xl p-3 bg-white shadow-sm sticky top-4 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">
                Remaining Managers
              </div>
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
