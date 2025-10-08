import React from "react";

export default function SquadSummary({ totalSelected, budget, onSave, saving }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-2xl p-3 shadow-sm border">
      <div className="flex items-center gap-3 text-sm">
        <span className="px-3 py-1 rounded bg-indigo-50 text-indigo-700">
          Players: <b>{totalSelected}/15</b>
        </span>
        <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-700">
          Budget: <b>£{budget.toFixed(1)}m</b>
        </span>
      </div>
      <button
        onClick={onSave}
        disabled={saving || totalSelected !== 15}
        className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "💾 Save Squad"}
      </button>
    </div>
  );
}
