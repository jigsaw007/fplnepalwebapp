import { useEffect, useMemo, useState } from "react";
import {
  fetchFPLData,
  fetchEliminationRules,
  upsertEliminationRule,
  fetchEliminationCandidates,
  confirmEliminations,
  fetchEliminatedSoFar,
  adminPing,
} from "../api/fplApi";

const Spinner = ({ size = 18, message = "Loading..This might take few seconds." }) => (
  <div className="flex items-center gap-2 text-gray-600">
    <div
      className="animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
    <span className="text-sm">{message}</span>
  </div>
);

/**
 * Elimination League Admin
 * - Defaults to Classic League ID 235907
 * - Detects latest finished GW automatically (can be overridden)
 * - Loads candidates (excludes previously eliminated)
 * - Preselects bottom N based on Supabase rules for the GW
 * - Confirm writes eliminations
 */
export default function EliminationAdmin() {
  // --- Admin token gate ---
  const [adminKey, setAdminKey] = useState(localStorage.getItem("admin_key") || "");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  // --- Controls & data ---
  const [leagueId, setLeagueId] = useState("235907");
  const [gameweek, setGameweek] = useState(""); // let auto-detect fill this
  const [latestFinished, setLatestFinished] = useState(null);

  const [net, setNet] = useState(true);
  const [rows, setRows] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const selectedCount = selected.size;
  const [loading, setLoading] = useState(false);

  const [ruleCount, setRuleCount] = useState(0);
  const [eliminatedSoFar, setEliminatedSoFar] = useState([]);

  // ---- Token verification (server-verified) ----
  useEffect(() => {
    (async () => {
      if (!adminKey?.trim()) {
        setAuthed(false);
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        const ok = await adminPing();
        setAuthed(ok);
      } catch {
        setAuthed(false);
      } finally {
        setChecking(false);
      }
    })();
  }, [adminKey]);

  const saveAdminKey = async () => {
    localStorage.setItem("admin_key", adminKey.trim());
    setChecking(true);
    const ok = await adminPing();
    setAuthed(ok);
    setChecking(false);
    if (!ok) alert("Invalid admin key");
  };

  // --- Auto-detect latest finished GW ---
  useEffect(() => {
    (async () => {
      try {
        const boot = await fetchFPLData();
        const now = new Date();
        const finished = boot?.events
          ?.filter((e) => e.finished || e.data_checked || new Date(e.deadline_time) <= now)
          ?.sort((a, b) => b.id - a.id)?.[0];
        if (finished) {
          setLatestFinished(finished.id);
          setGameweek((prev) => (prev ? prev : String(finished.id)));
        }
      } catch (e) {
        console.error("Failed to detect latest GW:", e);
      }
    })();
  }, []);

  // --- Load rule for this GW + eliminated so far ---
  useEffect(() => {
    (async () => {
      if (!gameweek) return;
      try {
        const r = await fetchEliminationRules(Number(gameweek));
        setRuleCount(r?.eliminate_count ?? 0);
      } catch {
        setRuleCount(0);
      }
      try {
        const list = await fetchEliminatedSoFar(Number(gameweek) - 1);
        setEliminatedSoFar(list || []);
      } catch {
        setEliminatedSoFar([]);
      }
    })();
  }, [gameweek]);

  // --- Actions ---
  const loadCandidates = async () => {
    if (!leagueId || !gameweek) return;
    setLoading(true);
    try {
      const data = await fetchEliminationCandidates(leagueId.trim(), Number(gameweek), net);
      setRows(data.candidates || []);
      setSuggested(data.suggested || []);
      setSelected(new Set((data.suggested || []).map((x) => x.entry_id)));
    } catch (e) {
      console.error(e);
      setRows([]);
      setSuggested([]);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectNone = () => setSelected(new Set());
  const selectSuggested = () => setSelected(new Set(suggested.map((x) => x.entry_id)));

  const confirm = async () => {
    if (!gameweek) return alert("Select a gameweek.");
    const toSend = rows
      .filter((r) => selected.has(r.entry_id))
      .map((r) => ({
        entry_id: r.entry_id,
        gw_points: r.gw_points,
        season_total: r.season_total ?? 0,
        hits: r.hits ?? 0,
      }));
    if (toSend.length === 0) return alert("Select at least one manager to eliminate.");
    try {
      await confirmEliminations(Number(gameweek), toSend);
      alert(`Eliminated ${toSend.length} manager(s) for GW ${gameweek}.`);
      await loadCandidates(); // refresh
    } catch (e) {
      alert("Failed to confirm eliminations.");
      console.error(e);
    }
  };

  const saveRule = async () => {
    if (!gameweek) return;
    try {
      await upsertEliminationRule(Number(gameweek), Number(ruleCount || 0));
      alert("Rule saved.");
      await loadCandidates();
    } catch (e) {
      alert("Failed to save rule.");
      console.error(e);
    }
  };

  const helpText = useMemo(
    () => (net ? "Sorted by NET points (GW points minus hits)" : "Sorted by raw GW points"),
    [net]
  );

  // --- Locked states ---
  if (checking) {
    return (
      <div className="max-w-md mx-auto mt-10 border rounded p-4">
        <Spinner />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto mt-10 border rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Admin Access</h2>
        <p className="text-sm text-gray-600 mb-3">
          Enter your admin key to manage eliminations.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="password"
            className="border rounded px-3 py-2 w-full"
            placeholder="Paste ADMIN_TOKEN"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
          />
          <button onClick={saveAdminKey} className="px-3 py-2 rounded bg-black text-white">
            Unlock
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tip: The key is stored only in this browser (localStorage).
        </p>
      </div>
    );
  }

  // --- MAIN ADMIN UI (only renders if authed) ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">Elimination League (Admin)</h1>
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
          Admin verified
        </div>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-sm">Classic League ID</label>
          <input
            className="border rounded w-full px-3 py-2"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            placeholder="e.g. 235907"
          />
        </div>

        <div>
          <label className="text-sm">Gameweek</label>
          <input
            className="border rounded w-full px-3 py-2"
            type="number"
            min={1}
            value={gameweek}
            onChange={(e) => setGameweek(e.target.value)}
            placeholder={latestFinished ? `Latest finished: ${latestFinished}` : "GW #"}
          />
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          <button
            onClick={loadCandidates}
            className="px-4 py-2 rounded bg-black text-white"
          >
            {loading ? "Loading…" : "Load Managers"}
          </button>

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={net} onChange={() => setNet(!net)} />
            Use NET points
          </label>

          <button
            onClick={confirm}
            disabled={selectedCount === 0}
            className={`px-4 py-2 rounded ${
              selectedCount === 0
                ? "bg-red-400 cursor-not-allowed text-white"
                : "bg-red-600 text-white"
            }`}
            title={selectedCount === 0 ? "Select at least one manager to enable" : ""}
          >
            Confirm Elimination{selectedCount ? ` (${selectedCount})` : ""}
          </button>
        </div>
      </div>

      {/* Rule & Eliminated so far */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="border rounded p-3">
          <div className="font-medium">Rule for GW {gameweek || "-"}</div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min={0}
              className="border rounded px-2 py-1 w-28"
              value={ruleCount}
              onChange={(e) => setRuleCount(e.target.value)}
            />
            <button onClick={saveRule} className="px-3 py-1 rounded bg-emerald-600 text-white">
              Save
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Set how many get eliminated this GW (preselects bottom N).
          </div>
        </div>

        <div className="border rounded p-3">
          <div className="font-medium">Eliminated before GW {gameweek || "-"}</div>
          <div className="text-sm mt-2 max-h-36 overflow-auto">
            {eliminatedSoFar?.length ? (
              <ul className="list-disc pl-5">
                {eliminatedSoFar.map((r) => (
                  <li key={`${r.gw}-${r.entry_id}`}>
                    GW {r.gw} — Entry {r.entry_id} (pts {r.gw_points}
                    {typeof r.hits === "number" ? `, hits ${r.hits}` : ""})
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-2">
        {helpText}
      </p>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Elim</th>
              <th className="p-2 text-left">Entry</th>
              <th className="p-2 text-left">Manager</th>
              <th className="p-2 text-left">Team</th>
              <th className="p-2 text-right">GW pts</th>
              <th className="p-2 text-right">Hits</th>
              <th className="p-2 text-right">NET</th>
              <th className="p-2 text-right">Season Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-center" colSpan={9}>
                  No data yet. Click “Load Managers”.
                </td>
              </tr>
            )}
            {rows.map((r, idx) => (
              <tr key={r.entry_id} className={selected.has(r.entry_id) ? "bg-red-50" : ""}>
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selected.has(r.entry_id)}
                    onChange={() => toggleSelected(r.entry_id)}
                  />
                </td>
                <td className="p-2">{r.entry_id}</td>
                <td className="p-2">{r.manager_name}</td>
                <td className="p-2">{r.team_name}</td>
                <td className="p-2 text-right">{r.gw_points}</td>
                <td className="p-2 text-right">{r.hits}</td>
                <td className="p-2 text-right">{r.net_points}</td>
                <td className="p-2 text-right">{r.season_total ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button onClick={selectSuggested} className="px-3 py-1 rounded border">
          Select Suggested
        </button>
        <button onClick={selectNone} className="px-3 py-1 rounded border">
          Clear Selection
        </button>
      </div>
    </div>
  );
}
