// src/components/SquadGrid.jsx
import React, { useMemo } from "react";
import { getTeamKit } from "../utils/teamData";

export default function SquadGrid({ squad = [] }) {
  const { xi, bench, groups, formation } = useMemo(() => {
    const s = [...(squad || [])].sort((a, b) => a.position - b.position);
    const xi = s.filter(x => x.position <= 11);
    const bench = s.filter(x => x.position > 11);

    const groups = {
      gkp: xi.filter(p => p.element_type === 1),
      def: xi.filter(p => p.element_type === 2),
      mid: xi.filter(p => p.element_type === 3),
      fwd: xi.filter(p => p.element_type === 4),
    };
    const formation = `${groups.def.length}-${groups.mid.length}-${groups.fwd.length}`;
    return { xi, bench, groups, formation };
  }, [squad]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-gray-500">Starting XI</div>
        <div className="text-[11px] font-semibold text-gray-600 bg-white/70 px-2.5 py-0.5 rounded-full ring-1 ring-black/5">
          {formation}
        </div>
      </div>

      <Pitch>
        <LineRow players={groups.gkp} />
        <LineRow players={groups.def} />
        <LineRow players={groups.mid} />
        <LineRow players={groups.fwd} />
      </Pitch>

      <div className="mt-4 text-[11px] uppercase tracking-wider text-gray-500">Bench</div>
      <BenchRow players={bench} />
    </div>
  );
}

function Pitch({ children }) {
  return (
    <div
      className="mt-2 rounded-2xl p-3 ring-1 ring-black/5"
      style={{
        background:
          "repeating-linear-gradient(180deg, #e8f7e8, #e8f7e8 20px, #dff2df 20px, #dff2df 40px)",
      }}
    >
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function LineRow({ players = [] }) {
  if (!players.length) return null;
  return (
    <div className="flex justify-center gap-2 flex-wrap">
      {players.map((p) => (
        <PlayerBubble key={`${p.id}-${p.position}`} p={p} size="lg" />
      ))}
    </div>
  );
}

function BenchRow({ players = [] }) {
  if (!players.length) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {players.map((p) => (
        <PlayerBubble key={`${p.id}-${p.position}`} p={p} size="sm" />
      ))}
    </div>
  );
}

function PlayerBubble({ p, size = "lg" }) {
  const isC = p.is_captain;
  const isVC = p.is_vice_captain && !isC;

  // widths/heights so rows don't wrap
  const wrapW  = size === "lg" ? "w-16" : "w-12";
  const imgH   = size === "lg" ? "h-14" : "h-10";
  const nameTx = size === "lg" ? "text-[10px]" : "text-[9px]";
  const ptsTx  = size === "lg" ? "text-[10px]" : "text-[9px]";

  // Use same helper as Versus page
  const teamId = p.teamId ?? p.team_id ?? null;
  const kitUrl = teamId ? getTeamKit(teamId, p.element_type === 1 ? "GKP" : "OUTFIELD") : null;

  return (
    <div className={`relative flex flex-col items-center ${wrapW}`}>
      <div className="relative w-full">
        {kitUrl ? (
          <img
            src={kitUrl}
            alt={p.name}
            title={p.name}
            loading="lazy"
            className={`w-full ${imgH} object-contain bg-white ring ring-white shadow rounded-md`}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div
            title={p.name}
            className={`w-full ${imgH} rounded-md grid place-items-center bg-gray-100 text-gray-600 ring ring-white shadow ${nameTx}`}
          >
            {initials(p.name)}
          </div>
        )}

        {(isC || isVC) && (
          <span
            className={`absolute -top-1 -left-1 text-[9px] font-bold rounded-full px-1 py-0.5 shadow
              ${isC ? "bg-amber-400 text-white" : "bg-zinc-300 text-zinc-800"}`}
            title={isC ? "Captain" : "Vice Captain"}
          >
            {isC ? "C" : "VC"}
          </span>
        )}
      </div>

      {/* Name ribbon (white) */}
      <div
        className={`mt-1 w-full rounded-t-md bg-white text-gray-900 ${nameTx} font-semibold text-center px-1 py-0.5 leading-tight truncate`}
        title={p.name}
      >
        {p.name}
      </div>

      {/* Points ribbon (FPL purple) */}
      <div
        className={`w-full rounded-b-md bg-purple-700 text-white ${ptsTx} font-bold text-center px-1 py-0.5`}
        title={`${p.points} pts`}
      >
        {p.points}
      </div>
    </div>
  );
}




function initials(name = "") {
  const parts = String(name).trim().split(" ");
  if (!parts.length) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
