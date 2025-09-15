// src/pages/FPLLive.jsx
import { useMemo, useState } from "react";
import { fetchFplLive } from "../api/fplApi";

// Shirt sprite from official FPL
const shirtUrl = (team_code) =>
  `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${team_code}-66.png`;

/* -------------------- CHIP ICONS (SVG) -------------------^- */
const ChipIcon = ({ chip, className = "" }) => {
  if (!chip) return null;
  const base = "inline-flex items-center justify-center rounded border shadow-sm " + className;
  const common = "w-5 h-5";
  switch (chip) {
    case "wc":
      return (
        <span className={`${base} bg-emerald-50 border-emerald-200 text-emerald-700 px-2 py-1 text-xs font-bold`}>
          <svg viewBox="0 0 24 24" className={common} aria-hidden>
            <path d="M4 6l4 4 4-4 4 4 4-4v12H4z" fill="currentColor"/>
          </svg>
          <span className="ml-1">WC</span>
        </span>
      );
    case "fh":
      return (
        <span className={`${base} bg-sky-50 border-sky-200 text-sky-700 px-2 py-1 text-xs font-bold`}>
          <svg viewBox="0 0 24 24" className={common} aria-hidden>
            <path d="M3 12h18M12 3v18" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <span className="ml-1">FH</span>
        </span>
      );
    case "bboost":
      return (
        <span className={`${base} bg-amber-50 border-amber-200 text-amber-700 px-2 py-1 text-xs font-bold`}>
          <svg viewBox="0 0 24 24" className={common} aria-hidden>
            <path d="M4 17h16M4 12h16M7 7h10" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <span className="ml-1">BB</span>
        </span>
      );
    case "3xc":
      return (
        <span className={`${base} bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 px-2 py-1 text-xs font-bold`}>
          <svg viewBox="0 0 24 24" className={common} aria-hidden>
            <path d="M12 3l3 6 6 .9-4.5 4.2 1.1 6.4L12 17l-5.6 3.5 1.1-6.4L3 9.9 9 9z" fill="currentColor" />
          </svg>
          <span className="ml-1">TC</span>
        </span>
      );
    default:
      return null;
  }
};

/* -------------------- SECTION TITLE -------------------- */
const SectionTitle = ({ children }) => (
  <div className="flex items-center gap-3 mb-3">
    <h2 className="text-base md:text-lg font-semibold tracking-wide">{children}</h2>
    <div className="h-px flex-1 bg-gradient-to-r from-gray-300/80 to-transparent" />
  </div>
);

/* -------------------- CLICK TOOLTIP -------------------- */
const RowStat = ({ label, value }) =>
  value ? (
    <div className="flex justify-between text-xs">
      <span className="text-gray-600">{label}</span>
      <span className="font-mono ml-3">{value}</span>
    </div>
  ) : null;

const PlayerTooltipCard = ({ stats, onClose }) => {
  if (!stats) return null;
  const {
    goals, assists, bonus, cs, gc, saves,
    pens_saved, pens_missed, yc, rc, og, bps,
  } = stats || {};
  return (
    <div className="relative w-48 rounded-lg border bg-white shadow-lg p-2">
      <button
        type="button"
        onClick={onClose}
        className="absolute -right-1 -top-1 text-[10px] bg-gray-200 hover:bg-gray-300 rounded-full w-5 h-5 flex items-center justify-center"
        aria-label="Close"
      >
        ×
      </button>
      <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Stats</div>
      <div className="space-y-0.5">
        <RowStat label="Goals" value={goals} />
        <RowStat label="Assists" value={assists} />
        <RowStat label="Bonus" value={bonus} />
        <RowStat label="Clean Sheets" value={cs} />
        <RowStat label="Goals Conceded" value={gc} />
        <RowStat label="Saves" value={saves} />
        <RowStat label="Pens Saved" value={pens_saved} />
        <RowStat label="Pens Missed" value={pens_missed} />
        <RowStat label="Yellow Cards" value={yc} />
        <RowStat label="Red Cards" value={rc} />
        <RowStat label="Own Goals" value={og} />
        <RowStat label="BPS" value={bps} />
      </div>
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white border-l border-t" />
    </div>
  );
};

export default function FPLLive() {
  const [teamId, setTeamId] = useState("");
  const [gw, setGw] = useState("1");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState(null);       // <-- NEW: who is open

  const gwOptions = useMemo(() => Array.from({ length: 38 }, (_, i) => `${i + 1}`), []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setData(null);
    setOpenId(null);
    if (!teamId || !gw) {
      setErr("Please enter both Team ID and Gameweek.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetchFplLive(teamId.trim(), Number(gw));
      setData(res);
    } catch (e) {
      setErr(e.message || "Failed to load");
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

  const PlayerCard = ({ p }) => {
    const isOpen = openId === p.id;
    return (
      <div className="relative flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => setOpenId(isOpen ? null : p.id)}
          className="relative outline-none"
        >
          {/* Kit */}
          <img
            src={shirtUrl(p.team_code)}
            alt="kit"
            className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow"
            onError={(e) => { e.currentTarget.style.opacity = 0.6; }}
          />
          {/* C / V badges */}
          {p.is_captain && (
            <span className="absolute -right-1 -top-1 text-[10px] md:text-xs font-bold bg-yellow-300 rounded-full px-1.5 py-0.5 border border-yellow-600 shadow">
              C
            </span>
          )}
          {p.is_vice && !p.is_captain && (
            <span className="absolute -right-1 -top-1 text-[10px] md:text-xs font-bold bg-blue-200 rounded-full px-1.5 py-0.5 border border-blue-500 shadow">
              V
            </span>
          )}
        </button>

        {/* Name & points */}
        <div className="mt-1 text-xs md:text-sm leading-tight max-w-[120px] truncate">
          {p.name}
        </div>
        <div className="mt-0.5 text-sm md:text-base font-mono">{p.points}</div>

        {/* Click tooltip */}
        {isOpen && p.stats && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50">
            <PlayerTooltipCard stats={p.stats} onClose={() => setOpenId(null)} />
          </div>
        )}
      </div>
    );
  };

  const PitchRow = ({ players }) => (
    <div className="flex justify-center gap-4 md:gap-6">
      {players.map((p) => <PlayerCard key={p.id} p={p} />)}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          FPL LIVE – Check GW score before Official FPL Update
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Enter your Team ID to instantly see your Gameweek total with
          <span className="font-medium"> bonus points</span>,
          <span className="font-medium"> automatic substitutions</span>,
          captain/vice logic (incl. TC), and
          <span className="font-medium"> transfer hits</span> applied — like LiveFPL.
        </p>
      </div>

      {/* Controls */}
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
          {gwOptions.map((o) => (
            <option key={o} value={o}>
              GW {o}
            </option>
          ))}
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

      {data && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="bg-white border rounded-2xl shadow-sm p-4 md:p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Gameweek</div>
                <div className="text-xl font-bold">GW {data.gameweek}</div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <ChipIcon chip={data.active_chip} />
              </div>

              <div className="ml-auto text-right">
                <div className="text-xs uppercase tracking-wide text-gray-500">GW Total</div>
                <div className="text-4xl md:text-5xl font-black leading-none">
                  {data.totals.total_after_hits}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <div>
                Transfer Hits: <span className="font-mono">-{data.transfer_hits}</span>
              </div>
            </div>
          </div>

          {/* Formation */}
          <div className="bg-white border rounded-2xl shadow-sm p-4 md:p-6">
            <SectionTitle>Formation</SectionTitle>
            <div className="space-y-4 md:space-y-6">
              <PitchRow players={rows?.gk || []} />
              <PitchRow players={rows?.def || []} />
              <PitchRow players={rows?.mid || []} />
              <PitchRow players={rows?.fwd || []} />
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white border rounded-2xl shadow-sm p-4 md:p-6">
            <SectionTitle>Breakdown</SectionTitle>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:text-base">
              <div className="text-gray-600">Field Points</div>
              <div className="text-right font-mono">{data.totals.field_points}</div>

              <div className="text-gray-600">Captain Extra</div>
              <div className="text-right font-mono">{data.totals.captain_extra}</div>

              {data.active_chip === "bboost" && (
                <>
                  <div className="text-gray-600">Bench Points</div>
                  <div className="text-right font-mono">{data.totals.bench_points}</div>
                </>
              )}

              <div className="text-gray-600">Transfer Hits</div>
              <div className="text-right font-mono">-{data.totals.transfer_hits}</div>
            </div>
          </div>

          {/* Bench */}
          <div className="bg-white border rounded-2xl shadow-sm p-4 md:p-6">
            <SectionTitle>Bench</SectionTitle>
            <div className="flex flex-wrap gap-3 md:gap-4">
              {data.bench.map((p) => (
                <div key={p.id} className="relative flex items-center gap-3 border rounded-xl px-3 py-2 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === p.id ? null : p.id)}
                    className="relative flex items-center gap-3 outline-none"
                  >
                    <img src={shirtUrl(p.team_code)} alt="kit" className="w-10 h-10 md:w-12 md:h-12" />
                    <div className="text-sm md:text-base">{p.name}</div>
                    <div className="ml-auto font-mono text-sm md:text-base">{p.points}</div>
                  </button>

                  {openId === p.id && p.stats && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50">
                      <PlayerTooltipCard stats={p.stats} onClose={() => setOpenId(null)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
