// src/pages/FPLLive.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchFplLive, fetchFPLData } from "../api/fplApi";

/* ---------- Image helpers ---------- */
const shirtUrl = (team_code) =>
  `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${team_code}-66.png`;
const headshotPrimaryByCode = (code) =>
  code ? `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png` : null;
const headshotLegacyByCode = (code) =>
  code ? `https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}.png` : null;

/* ---------- Stat normalization ---------- */
function normalizeStats(s) {
  if (!s) return {};
  return {
    // attacking
    goals:       s.goals_scored ?? 0,
    assists:     s.assists ?? 0,
    bonus:       s.bonus ?? 0,
    bps:         s.bps ?? 0,
    // defensive
    cs:          s.clean_sheets ?? 0,
    gc:          s.goals_conceded ?? 0,
    saves:       s.saves ?? 0,
    // discipline
    yc:          s.yellow_cards ?? 0,
    rc:          s.red_cards ?? 0,
    og:          s.own_goals ?? 0,
    // penalties
    pens_saved:  s.penalties_saved ?? 0,
    pens_missed: s.penalties_missed ?? 0,
  };
}

/* ---------- Small UI bits ---------- */
const SectionTitle = ({ children }) => (
  <div className="flex items-center gap-3 mb-3">
    <h2 className="text-base md:text-lg font-semibold tracking-wide">{children}</h2>
    <div className="h-px flex-1 bg-gradient-to-r from-gray-300/80 to-transparent" />
  </div>
);

const ChipPill = ({ chip }) => {
  if (!chip) return null;
  const pill = (cls, label) => (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded border shadow-sm ${cls}`}>{label}</span>
  );
  switch (chip) {
    case "wildcard":
    case "wc": return pill("bg-emerald-50 text-emerald-700 border-emerald-200", "WC");
    case "freehit":
    case "fh": return pill("bg-sky-50 text-sky-700 border-sky-200", "FH");
    case "bboost": return pill("bg-amber-50 text-amber-700 border-amber-200", "BB");
    case "3xc": return pill("bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", "TC");
    default: return null;
  }
};

export default function FPLLive() {
  const [teamId, setTeamId] = useState("");
  const [gw, setGw] = useState("1");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  // bootstrap-static mapping for headshots
  const [elMap, setElMap] = useState(new Map());
  const [hoveredId, setHoveredId] = useState(null);

  const gwOptions = useMemo(() => Array.from({ length: 38 }, (_, i) => `${i + 1}`), []);

  useEffect(() => {
    (async () => {
      try {
        const bs = await fetchFPLData();
        const map = new Map();
        (bs?.elements || []).forEach((e) => map.set(e.id, { name: e.web_name, code: e.code }));
        setElMap(map);
      } catch {
        setElMap(new Map());
      }
    })();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setData(null);
    if (!teamId || !gw) {
      setErr("Please enter both Team ID and Gameweek.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetchFplLive(teamId.trim(), Number(gw));
      const patch = (arr = []) => arr.map(p => ({ ...p, stats: normalizeStats(p.stats) }));
      setData({
        ...res,
        xi_after_autosubs: patch(res.xi_after_autosubs),
        bench: patch(res.bench),
      });
    } catch (e2) {
      setErr(e2?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => {
    if (!data?.xi_after_autosubs) return null;
    const gk = data.xi_after_autosubs.filter((p) => p.element_type === 1);
    const def = data.xi_after_autosubs.filter((p) => p.element_type === 2);
    const mid = data.xi_after_autosubs.filter((p) => p.element_type === 3);
    const fwd = data.xi_after_autosubs.filter((p) => p.element_type === 4);
    return { gk, def, mid, fwd };
  }, [data]);

  /* ---------- Aggregation for Breakdown ---------- */
  const squadAll = useMemo(() => {
    if (!data) return [];
    return [ ...(data.xi_after_autosubs || []), ...(data.bench || []) ];
  }, [data]);

  const BREAKDOWN_FIELDS = [
    { id: "goals",       label: "Total Goals Scored" },
    { id: "assists",     label: "Assists" },
    { id: "cs",          label: "Clean Sheets" },
    { id: "gc",          label: "Total Goals Conceded" },
    { id: "yc",          label: "Yellow Cards" },
    { id: "rc",          label: "Red Cards" },
    { id: "og",          label: "Own Goals" },
    { id: "saves",       label: "Saves" },
    { id: "bonus",       label: "Bonus" },
    { id: "bps",         label: "BPS" },
    { id: "pens_saved",  label: "Penalties Saved" },
    { id: "pens_missed", label: "Penalties Missed" },
  ];

  const breakdownRows = useMemo(() => {
    const out = [];
    for (const { id, label } of BREAKDOWN_FIELDS) {
      let total = 0;
      const contributors = [];
      for (const p of squadAll) {
        const val = Number(p?.stats?.[id] ?? 0);
        if (val > 0) contributors.push({ name: p.name ?? p.web_name ?? `#${p.id}`, value: val });
        total += val;
      }
      contributors.sort((a, b) => (b.value - a.value) || a.name.localeCompare(b.name));
      out.push({ id, label, total, contributors });
    }
    return out;
  }, [squadAll]);

  /* ---------- Player Cards / Pitch ---------- */
  const PlayerAvatar = ({ p }) => {
    const code = elMap.get(p.id)?.code;
    const primary = headshotPrimaryByCode(code);
    const legacy  = headshotLegacyByCode(code);

    return (
      <div
        className="relative w-[72px] h-[86px] md:w-[84px] md:h-[100px] rounded-md overflow-hidden bg-slate-100 group"
        onMouseEnter={() => setHoveredId(p.id)}
        onMouseLeave={() => setHoveredId((id) => (id === p.id ? null : id))}
      >
        {primary ? (
          <img
            src={primary}
            alt={p.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.08]"
            loading="lazy"
            onError={(e) => {
              if (legacy && e.currentTarget.src !== legacy) {
                e.currentTarget.src = legacy;
              } else {
                e.currentTarget.src = shirtUrl(p.team_code);
                e.currentTarget.className =
                  "w-full h-full object-contain p-1 bg-white transition-transform duration-200 group-hover:scale-[1.08]";
              }
            }}
          />
        ) : (
          <img
            src={shirtUrl(p.team_code)}
            alt="kit"
            className="w-full h-full object-contain p-1 bg-white transition-transform duration-200 group-hover:scale-[1.08]"
          />
        )}

        {/* Hover zoom preview */}
        {hoveredId === p.id && (
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-50">
            <div className="rounded-lg overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white">
              <div className="w-28 h-36 bg-slate-50">
                <img
                  src={primary || shirtUrl(p.team_code)}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const fallback = legacy || shirtUrl(p.team_code);
                    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                  }}
                />
              </div>
              <div className="p-2 text-center text-xs">
                <div className="font-semibold">{p.name}</div>
                <div className="text-gray-600">GW pts: <span className="font-mono">{p.points}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // name + points on separate backgrounds (to match your design)
  const PlayerCard = ({ p }) => (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative">
        <PlayerAvatar p={p} />

        {/* C / V badges */}
        {p.is_captain && (
          <span className="absolute -right-1 -top-1 text-[10px] md:text-xs font-bold bg-yellow-300 rounded-full px-1.5 py-0.5 border border-yellow-600 shadow">
            C
          </span>
        )}
        {!p.is_captain && p.is_vice && (
          <span className="absolute -right-1 -top-1 text-[10px] md:text-xs font-bold bg-blue-200 rounded-full px-1.5 py-0.5 border border-blue-500 shadow">
            V
          </span>
        )}
      </div>

      <div className="mt-1 w-[92px] md:w-[110px] rounded-md overflow-hidden shadow ring-1 ring-purple-900/10">
        <div className="bg-white/95 text-[11px] md:text-xs font-semibold text-gray-800 truncate px-2 pt-1">
          {p.name}
        </div>
        <div className="bg-[#3b1e63] text-white text-[11px] md:text-xs font-bold px-2 py-0.5">
          {p.points}
        </div>
      </div>
    </div>
  );

  const PitchRow = ({ players }) => (
    <div className="flex justify-center gap-4 md:gap-6">
      {players.map((p) => <PlayerCard key={p.id} p={p} />)}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">FPL LIVE</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Enter your Team ID to see live Gameweek total (bonus, autosubs, captain logic, hits).
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={onSubmit}
        className="bg-white border rounded-2xl shadow-sm p-4 md:p-5 mb-6 flex flex-col md:flex-row gap-3"
      >
        <input
          className="border rounded-lg px-3 py-2 flex-1"
          placeholder="Team ID (entry)"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 w-40"
          value={gw}
          onChange={(e) => setGw(e.target.value)}
        >
          {gwOptions.map((o) => <option key={o} value={o}>GW {o}</option>)}
        </select>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 font-semibold"
          disabled={loading}
        >
          {loading ? "Calculating..." : "Calculate"}
        </button>
      </form>

      {err && <div className="text-red-600 mb-4">{err}</div>}
      {loading && <div className="mt-4 text-gray-600">Calculating…</div>}

      {data && (
        <div className="space-y-6">
          {/* ===== GW SCORE HERO (own bg) ===== */}
          <div className="rounded-3xl p-6 md:p-8 shadow-sm border bg-gradient-to-br from-indigo-50 via-sky-50 to-indigo-100">
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs uppercase tracking-wide text-gray-600">Gameweek</div>
              <div className="text-xl font-bold">GW {data.gameweek}</div>

              <div className="mt-2 rounded-2xl px-6 py-4 text-center shadow-inner bg-gradient-to-b from-cyan-400 to-blue-600 text-white">
                <div className="text-xs opacity-90">Total Points</div>
                <div className="text-5xl md:text-6xl font-black leading-none">{data.totals.total_after_hits}</div>
                <div className="mt-2"><ChipPill chip={data.active_chip} /></div>
              </div>

              {/* Mini tiles */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl">
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 ring-1 ring-gray-200 text-center">
                  <div className="text-[11px] uppercase text-gray-500">Field</div>
                  <div className="text-2xl font-bold">{data.totals.field_points}</div>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 ring-1 ring-gray-200 text-center">
                  <div className="text-[11px] uppercase text-gray-500">Captain</div>
                  <div className="text-2xl font-bold">{data.totals.captain_extra}</div>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 ring-1 ring-gray-200 text-center">
                  <div className="text-[11px] uppercase text-gray-500">Bench</div>
                  <div className="text-2xl font-bold">
                    {data.active_chip === "bboost" ? data.totals.bench_points : 0}
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 ring-1 ring-gray-200 text-center">
                  <div className="text-[11px] uppercase text-gray-500">Hits</div>
                  <div className="text-2xl font-bold">-{data.totals.transfer_hits}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== FORMATION ===== */}
          <div className="rounded-3xl shadow-sm border p-4 md:p-6">
            <div className="max-w-3xl mx-auto">
              {/* stylized pitch */}
              <div className="rounded-2xl p-4 md:p-6 bg-[linear-gradient(#56b36a_0,#3b9351_100%)]">
                <div className="rounded-2xl p-4 md:p-6 ring-1 ring-emerald-300 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,.8),rgba(255,255,255,.55)_38%,transparent_40%)] space-y-5 md:space-y-7">
                  <PitchRow players={rows?.gk || []} />
                  <PitchRow players={rows?.def || []} />
                  <PitchRow players={rows?.mid || []} />
                  <PitchRow players={rows?.fwd || []} />
                </div>
              </div>
            </div>
          </div>

          {/* ===== BENCH (centered, same width as pitch) ===== */}
          <div className="rounded-3xl p-4 md:p-6 shadow-sm border bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-3xl mx-auto">
              <SectionTitle>Substitutes</SectionTitle>
              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                {data.bench.map((p) => (
                  <div key={p.id} className="relative flex items-center gap-3 border rounded-xl px-3 py-2 bg-white/90 backdrop-blur shadow-sm">
                    <div><PlayerAvatar p={p} /></div>
                    <div className="leading-tight">
                      <div className="text-sm md:text-base font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-600">
                        GW pts: <span className="font-mono font-semibold">{p.points}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== BREAKDOWN (inline) ===== */}

        </div>
      )}
    </div>
  );
}
