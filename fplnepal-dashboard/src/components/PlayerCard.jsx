import React, { useMemo, useState, useCallback } from "react";

const POS_COLOR = {
  1: "bg-blue-100 text-blue-800",   // GK
  2: "bg-green-100 text-green-800", // DEF
  3: "bg-yellow-100 text-yellow-800", // MID
  4: "bg-red-100 text-red-800",     // FWD
};

export default function PlayerCard({
  player,
  teamsById,          // { [teamId]: { name, short_name, code } } from bootstrap-static
  onSelect,
  onRemove,
  selected,
}) {
  const handleClick = () => (selected ? onRemove(player) : onSelect(player));

  // Prefer team "kit code" from teams, else fall back to element team_code, else team id
  const teamObj   = teamsById?.[player.team];
  const teamCode  = teamObj?.code ?? player.team_code ?? player.team;
  const teamLabel = teamObj?.short_name || teamObj?.name || "—";

  // Known working patterns (newest first) — we’ll try these in order until one loads
  const candidates = useMemo(() => ([
    // ✅ Newer FPL kits (WebP, larger)
    `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-220.webp`,
    `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-110.webp`,
    // ✅ Legacy PNGs
    `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-66.png`,
    // Older legacy variant that sometimes appears
    `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}_1-66.png`,
    // Final safe fallback (Arsenal as a generic “not-broken” kit)
    `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_3-66.png`,
  ]), [teamCode]);

  const [srcIndex, setSrcIndex] = useState(0);
  const currentSrc = candidates[srcIndex];

  const handleImgError = useCallback(() => {
    setSrcIndex((i) => (i < candidates.length - 1 ? i + 1 : i));
  }, [candidates.length]);

  return (
    <div
      className={`relative cursor-pointer transition-transform hover:scale-[1.02] ${
        selected ? "opacity-90" : ""
      }`}
      onClick={handleClick}
      title={selected ? "Remove player" : "Add player"}
    >
      <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border">
        {/* Dynamic Kit with robust fallbacks */}
        <div className="w-full h-28 flex items-center justify-center bg-gray-50">
          <img
            src={currentSrc}
            onError={handleImgError}
            alt={`${teamLabel} kit`}
            className="h-24 object-contain"
            loading="lazy"
          />
        </div>

        {/* Price chip */}
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-1 rounded ${POS_COLOR[player.element_type]}`}>
            £{(player.now_cost / 10).toFixed(1)}m
          </span>
        </div>

        {/* Player info */}
        <div className="py-2 px-3">
          <p className="text-sm font-semibold leading-tight">{player.web_name}</p>
          <p className="text-[11px] text-gray-500">
            {teamLabel} • {player.points_per_game} pts/g
          </p>
        </div>

        {/* Add/Remove button (visual only; click handled by card) */}
        <div className="absolute bottom-2 right-2 text-xs pointer-events-none">
          <span
            className={`px-2 py-[2px] rounded border ${
              selected
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}
          >
            {selected ? "−" : "+"}
          </span>
        </div>
      </div>
    </div>
  );
}
