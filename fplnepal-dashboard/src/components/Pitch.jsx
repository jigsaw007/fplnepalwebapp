import React, { useState, useCallback } from "react";
import { Minus } from "lucide-react";

const POSITION_LABELS = {
  1: "Goalkeepers",
  2: "Defenders",
  3: "Midfielders",
  4: "Forwards",
};

// allowed formation ranges
const RANGE = {
  1: [1, 1], // GK always 1
  2: [3, 5],
  3: [2, 5],
  4: [1, 3],
};

export default function Pitch({ squad, onRemove, teamsById }) {
  const kitUrl = (teamId) => {
    const t = teamsById?.[teamId];
    const code = t?.code ?? teamId;
    return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${code}-220.webp`;
  };

  const all = {
    1: squad[1] || [],
    2: squad[2] || [],
    3: squad[3] || [],
    4: squad[4] || [],
  };

  // always 1 GK
  const gk = all[1].slice(0, 1);
  const def = all[2];
  const mid = all[3];
  const fwd = all[4];

  // dynamic formation
  let defCount = Math.min(Math.max(def.length, 3), 5);
  let midCount = Math.min(Math.max(mid.length, 2), 5);
  let fwdCount = Math.min(Math.max(fwd.length, 1), 3);

  while (1 + defCount + midCount + fwdCount > 11) {
    if (defCount > 3 && defCount >= midCount && defCount >= fwdCount) defCount--;
    else if (midCount > 2 && midCount >= fwdCount) midCount--;
    else if (fwdCount > 1) fwdCount--;
    else break;
  }

  const starters = {
    1: gk,
    2: def.slice(0, defCount),
    3: mid.slice(0, midCount),
    4: fwd.slice(0, fwdCount),
  };

  const overflow = {
    1: all[1].slice(1),
    2: def.slice(defCount),
    3: mid.slice(midCount),
    4: fwd.slice(fwdCount),
  };

  const bench = [
    overflow[1][0],
    overflow[2][0],
    overflow[3][0],
    overflow[4][0],
  ].filter(Boolean);

  return (
    <div className="bg-green-700 bg-gradient-to-b from-green-600 to-green-800 text-white rounded-2xl p-4 shadow-md flex flex-col items-center">
      {/* Formation Display */}
      <div className="text-xs mb-2 opacity-80 italic">
        Formation: {defCount}-{midCount}-{fwdCount}
      </div>

      {/* Starter Rows */}
      {[1, 2, 3, 4].map((pos) => (
        <div key={pos} className="mb-4 w-full text-center">
          <div className="text-[11px] uppercase mb-1 opacity-80">
            {POSITION_LABELS[pos]}
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {starters[pos].map((p) => (
              <PitchPlayer
                key={p.id}
                player={p}
                onRemove={onRemove}
                kitUrl={kitUrl(p.team)}
              />
            ))}

            {/* empty placeholders (maintain row structure) */}
            {Array.from({
              length:
                (pos === 1
                  ? 1
                  : pos === 2
                  ? defCount
                  : pos === 3
                  ? midCount
                  : fwdCount) - starters[pos].length,
            }).map((_, i) => (
              <div
                key={`empty-${pos}-${i}`}
                className="w-[80px] h-[80px] rounded-full border border-white/40 flex items-center justify-center text-white/70"
              >
                +
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Bench */}
      <div className="mt-4 pt-2 w-full border-t border-white/20">
        <div className="text-center text-[11px] uppercase opacity-80 mb-2">
          Bench
        </div>
        <div className="flex justify-center gap-2 flex-wrap">
          {bench.length > 0 ? (
            bench.map((p) => (
              <PitchPlayer
                key={p.id}
                player={p}
                onRemove={onRemove}
                kitUrl={kitUrl(p.team)}
                small
              />
            ))
          ) : (
            <p className="text-xs text-white/70">Bench empty</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PitchPlayer({ player, onRemove, kitUrl, small }) {
  const size = small ? 64 : 80;
  const imgSize = small ? 52 : 70;

  return (
    <div
      className="relative text-center group"
      style={{ width: size, minWidth: size }}
    >
      <div
        className="rounded-full bg-white/90 flex items-center justify-center ring-2 ring-white/40 relative"
        style={{ width: size, height: size }}
      >
        <img
          src={kitUrl}
          alt="kit"
          className="object-contain"
          style={{ height: imgSize }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(player);
          }}
          className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white w-4 h-4 rounded-full flex items-center justify-center shadow-md"
        >
          <Minus className="w-3 h-3" strokeWidth={3} />
        </button>
      </div>
      <div className="mt-1 text-[11px] leading-tight">
        <div className="font-semibold truncate">{player.web_name}</div>
        <div className="opacity-80">£{(player.now_cost / 10).toFixed(1)}m</div>
      </div>
    </div>
  );
}
