// src/components/GwTopScoreTransfer.jsx
import { MdSwapHoriz } from "react-icons/md";

export default function GwTopScoreTransfer({
  transfersMade = 0,
  transfersCost = 0,
  chip,                // "freehit" | "wildcard" | "bboost" | "3xc" | undefined
}) {
  const made = Number(transfersMade || 0);
  const cost = Number(transfersCost || 0);

  // Style: red-ish if there was a hit, neutral otherwise
  const pillClass =
    cost > 0
      ? "bg-rose-100 text-rose-700 ring-rose-300"
      : "bg-gray-100 text-gray-700 ring-gray-300";

  // Helpful tooltip text
  const tip =
    chip === "freehit"
      ? "Free Hit used: transfers don’t cost points this GW"
      : chip === "wildcard"
      ? "Wildcard used: unlimited transfers with no points hit"
      : "Transfers made and points hit for this GW";

  return (
    <span
      title={tip}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${pillClass}`}
    >
      <MdSwapHoriz className="w-4 h-4" />
      Transfers {made}{cost > 0 ? ` (${cost * -1})` : ""}{/* show as negative */}
    </span>
  );
}
