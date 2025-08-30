// src/pages/LeagueStats.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchFPLData, fetchClassicLeague, fetchManagerHistory, fetchGwTop } from "../api/fplApi";

const LEAGUE_ID = 235907;
const LEAGUE_NAME = "FPL NEPAL CLASSIC LEAGUE Season 25/26 Gameweek Stats";

const CHIP_LABELS = {
  "3xc": "Triple Captain",
  bboost: "Bench Boost",
  freehit: "Free Hit",
  wildcard: "Wildcard",
};

// Inline SVG icons (lightweight)
const Icons = {
  users: (
    <svg viewBox="0 0 24 24" className="w-6 h-6"><path fill="currentColor"
      d="M16 11a3 3 0 1 0-3-3a3 3 0 0 0 3 3m-8 0a3 3 0 1 0-3-3a3 3 0 0 0 3 3m0 2c-2.7 0-7 1.35-7 4v2h14v-2c0-2.65-4.3-4-7-4m8 0c-.34 0-.7.02-1.06.05c1.9.87 3.06 2.1 3.06 3.95v2h5v-2c0-2.65-4.3-4-7-4"/>
    </svg>
  ),
  chipsTotal: (
    <svg viewBox="0 0 24 24" className="w-6 h-6"><path fill="currentColor"
      d="M12 2a10 10 0 1 0 10 10h-2A8 8 0 1 1 12 4z"/>
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor"
      d="M2 7l4 3l3-5l3 5l3-5l3 5l4-3v10H2zM4 15h16v2H4z"/>
    </svg>
  ),
  bench: (
    <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor"
      d="M3 10h18v2H3v-2m2 4h14v2H5v-2m-2 4h2v2H3v-2m16 0h2v2h-2v-2"/>
    </svg>
  ),
  wand: (
    <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor"
      d="m17.66 3.93l1.41 1.41l-5.66 5.66l-1.41-1.41l5.66-5.66M2 22l9-3l-6-6l-3 9m13-7l2-2l1.5 1.5l-2 2L15 15m4-9l2-2l1.5 1.5l-2 2L19 6"/>
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor"
      d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2m0 2v2h16V7H4m0 6v4h16v-4H4z"/>
    </svg>
  ),
  spinner: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 animate-spin">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10h-2A8 8 0 1 1 12 4z"/>
    </svg>
  ),
};

export default function LeagueStats() {
  const [gw, setGw] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [totals, setTotals] = useState({
    managers: 0,
    usedAny: 0,
    chips: { "3xc": 0, bboost: 0, freehit: 0, wildcard: 0 },
  });
  const [topCaptains, setTopCaptains] = useState([]); // [{id, name, code, count, percent}, …]

  // Default GW -> latest finished / deadline passed
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFPLData();
        const now = new Date();
        const latest =
          (data?.events || [])
            .filter(e => e.finished || new Date(e.deadline_time) <= now)
            .sort((a, b) => b.id - a.id)[0]?.id || 1;
        setGw(latest);
      } catch { /* fallback to 1 */ }
    })();
  }, []);

  const gwOptions = useMemo(() => Array.from({ length: 38 }, (_, i) => i + 1), []);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      // 1) League members
      const standings = await fetchClassicLeague(LEAGUE_ID, gw);
      const managers = Array.isArray(standings) ? standings.length : 0;

      // 2) Chip usage
      const chips = { "3xc": 0, bboost: 0, freehit: 0, wildcard: 0 };
      let usedAny = 0;

      const batchSize = 20;
      for (let i = 0; i < standings.length; i += batchSize) {
        const batch = standings.slice(i, i + batchSize);
        const chipNames = await Promise.all(
          batch.map(async (row) => {
            const hist = await fetchManagerHistory(row.id);
            const used = hist?.chips?.find(c => c.event === gw);
            return used?.name || null;
          })
        );
        chipNames.forEach((name) => {
          if (name) {
            usedAny += 1;
            if (chips[name] !== undefined) chips[name] += 1;
          }
        });
      }

      setTotals({ managers, usedAny, chips });

      // 3) Top 3 most-captained
      const gwTop = await fetchGwTop(LEAGUE_ID, gw); // { top3, others }
      const rows = [...(gwTop?.top3 || []), ...(gwTop?.others || [])];
      const freq = new Map(); // captain_id -> { name, code, count }
      rows.forEach(r => {
        if (r?.captain_id) {
          const cur = freq.get(r.captain_id) || { name: r.captain_name, code: r.captain_code, count: 0 };
          cur.count += 1;
          if (!cur.name) cur.name = r.captain_name;
          if (!cur.code) cur.code = r.captain_code;
          freq.set(r.captain_id, cur);
        }
      });

      const sorted = Array.from(freq.entries())
        .map(([id, info]) => ({
          id,
          name: info.name || `#${id}`,
          code: info.code || null,
          count: info.count,
          percent: managers > 0 ? Math.round((info.count / managers) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setTopCaptains(sorted);
    } catch {
      setErr("Could not load league stats. Please try again.");
      setTopCaptains([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (gw) load(); }, [gw]); // auto-load on GW change

  const headshot = (code) =>
    code ? `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png` : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">
            {LEAGUE_NAME}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Gameweek</label>
          <select
            className="border rounded-xl px-3 py-2 shadow-sm focus:outline-none bg-white"
            value={gw}
            onChange={(e) => setGw(Number(e.target.value))}
          >
            {gwOptions.map((g) => (
              <option key={g} value={g}>GW {g}</option>
            ))}
          </select>
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl border shadow-sm bg-slate-100 text-slate-800 hover:bg-slate-200 transition inline-flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (<>{Icons.spinner}<span>Loading…</span></>) : "Refresh"}
          </button>
        </div>
      </div>

      {err && <div className="text-red-600 mb-4">{err}</div>}
      {loading && (
        <div className="mb-4 flex items-center gap-2 text-slate-600">
          {Icons.spinner} <span>Fetching league stats…</span>
        </div>
      )}

      {/* TOP: 2 stat cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 mb-6">
        <StatCard
          title="Total Managers"
          value={totals.managers}
          icon={Icons.users}
          bg="bg-slate-50"
          ring="ring-1 ring-slate-200"
        />
        <StatCard
          title="Total Chips Used"
          value={totals.usedAny}
          icon={Icons.chipsTotal}
          bg="bg-slate-50"
          ring="ring-1 ring-slate-200"
        />
      </div>

      {/* BOTTOM: 4 chip cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <ChipCard
          label={CHIP_LABELS["3xc"]}
          count={totals.chips["3xc"]}
          icon={Icons.crown}
          bg="bg-amber-50"
          ring="ring-1 ring-amber-200"
          text="text-amber-900"
        />
        <ChipCard
          label={CHIP_LABELS["bboost"]}
          count={totals.chips["bboost"]}
          icon={Icons.bench}
          bg="bg-indigo-50"
          ring="ring-1 ring-indigo-200"
          text="text-indigo-900"
        />
        <ChipCard
          label={CHIP_LABELS["freehit"]}
          count={totals.chips["freehit"]}
          icon={Icons.wand}
          bg="bg-rose-50"
          ring="ring-1 ring-rose-200"
          text="text-rose-900"
        />
        <ChipCard
          label={CHIP_LABELS["wildcard"]}
          count={totals.chips["wildcard"]}
          icon={Icons.card}
          bg="bg-teal-50"
          ring="ring-1 ring-teal-200"
          text="text-teal-900"
        />
      </div>

{/* TOP 3 MOST-CAPTAINED */}
{topCaptains.length > 0 && (
  <div className="mt-10">
    <div className="text-base font-semibold text-slate-700 mb-5">
      Top Captain Picks (GW {gw})
    </div>
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
      {topCaptains.map((p, idx) => (
        <TopCaptainCard
          key={p.id ?? idx}
          rank={idx + 1}
          name={p.name}
          code={p.code}
          count={p.count}
          percent={p.percent}
        />
      ))}
    </div>
  </div>
)}

      <p className="mt-6 text-xs text-slate-500">
        Counts reflect chip usage and captain picks in the selected Gameweek.
      </p>
    </div>
  );
}

function StatCard({ title, value, icon, bg = "bg-white", ring = "", text = "text-slate-800" }) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm ${bg} ${ring}`}>
      <div className="flex items-center justify-between">
        <div className="text-slate-600 text-sm">{title}</div>
        <span className="text-slate-500">{icon}</span>
      </div>
      <div className={`text-4xl font-bold mt-1 ${text}`}>{value}</div>
    </div>
  );
}

function ChipCard({ label, count, icon, bg, ring, text }) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm ${bg} ${ring}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 text-sm">
          <span className="text-slate-500">{icon}</span>
          <span>{label}</span>
        </div>
      </div>
      <div className={`text-3xl font-bold mt-2 ${text}`}>{count}</div>
    </div>
  );
}

function TopCaptainCard({ rank, name, code, count, percent }) {
  const img = code
    ? `https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}.png`
    : null;

  const rankColors = [
    "bg-yellow-100 text-yellow-800 ring-yellow-200",
    "bg-slate-100 text-slate-700 ring-slate-200",
    "bg-amber-50 text-amber-800 ring-amber-200",
  ];
  const badgeStyle = rankColors[Math.min(rank - 1, 2)];

  return (
    <div className="rounded-2xl p-6 shadow-md bg-white ring-1 ring-slate-200 flex flex-col items-center text-center">
      {/* Rank Badge */}
      <div
        className={`px-3 py-1 text-sm font-semibold rounded-full ring-1 mb-3 ${badgeStyle}`}
      >
        #{rank}
      </div>

      {/* Player Image */}
      <div className="w-[120px] h-[150px] overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center mb-4">
        {img ? (
          <img
            src={img}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-slate-400 text-sm">No Image</span>
        )}
      </div>

      {/* Player Info */}
      <div>
        <div className="text-xl font-bold text-slate-800">{name}</div>
        <div className="text-slate-600 text-sm mt-1">
          Captained by{" "}
          <span className="font-semibold">{count}</span>
          {percent > 0 && <> ({percent}%)</>}
        </div>
      </div>
    </div>
  );
}