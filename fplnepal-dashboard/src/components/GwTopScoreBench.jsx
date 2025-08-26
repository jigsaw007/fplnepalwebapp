// src/components/GwTopScoreBench.jsx
import { MdEventSeat } from "react-icons/md"; // bench icon (material seat)

export default function GwTopScoreBench({ gwPoints = 0, squad = [], chip, scoreClass = "" }) {
  // bench points = positions 12..15
  const benchPoints = (squad || [])
    .filter(p => (p.position ?? 0) > 11)
    .reduce((sum, p) => sum + Number(p.points ?? 0), 0);

  const isBB = chip === "bboost";

  return (
    <div className="flex items-baseline gap-3">
      {/* GW total */}
      <div className={`text-3xl md:text-4xl font-black ${scoreClass}`}>
        {gwPoints}
      </div>

      {/* Bench pill */}
      <span
        title={isBB ? "Bench Boost active: bench counted in GW" : "Bench points (not counted unless Bench Boost)"}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1
        ${isBB ? "bg-indigo-100 text-indigo-700 ring-indigo-300" : "bg-gray-100 text-gray-700 ring-gray-300"}`}
      >
        <MdEventSeat className="w-4 h-4" />
        Bench {benchPoints} Pts{isBB ? " (BB)" : ""}
      </span>
    </div>
  );
}
