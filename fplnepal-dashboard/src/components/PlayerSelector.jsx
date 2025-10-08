import React, { useMemo, useState } from "react";

const POSITIONS = {
  1: "Goalkeepers",
  2: "Defenders",
  3: "Midfielders",
  4: "Forwards",
};

const SORT_OPTIONS = {
  total_points: "Total Points",
  now_cost: "Price (Low → High)",
  now_cost_desc: "Price (High → Low)",
  selected_by_percent: "Most Selected %",
  form: "Form",
  minutes: "Minutes Played",
};

export default function PlayerSelector({
  players,
  teamsById,
  onSelect,
  selectedMap,
}) {
  const [pos, setPos] = useState("");
  const [team, setTeam] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("total_points");

  // ✅ Filter players dynamically
  const filteredPlayers = useMemo(() => {
    let arr = players;
    if (pos) arr = arr.filter((p) => p.element_type === Number(pos));
    if (team) arr = arr.filter((p) => String(p.team) === team);
    if (search)
      arr = arr.filter((p) =>
        p.web_name.toLowerCase().includes(search.toLowerCase())
      );

    // ✅ Sorting
    const sorted = [...arr];
    switch (sortBy) {
      case "total_points":
        sorted.sort((a, b) => b.total_points - a.total_points);
        break;
      case "form":
        sorted.sort((a, b) => parseFloat(b.form) - parseFloat(a.form));
        break;
      case "selected_by_percent":
        sorted.sort(
          (a, b) =>
            parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent)
        );
        break;
      case "now_cost":
        sorted.sort((a, b) => a.now_cost - b.now_cost);
        break;
      case "now_cost_desc":
        sorted.sort((a, b) => b.now_cost - a.now_cost);
        break;
      case "minutes":
        sorted.sort((a, b) => b.minutes - a.minutes);
        break;
      default:
        break;
    }
    return sorted;
  }, [players, pos, team, search, sortBy]);

  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <h3 className="text-base font-semibold mb-3">Select Player</h3>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-sm font-medium block mb-1">Position</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={pos}
            onChange={(e) => {
              setPos(e.target.value);
              setTeam("");
              setSearch("");
            }}
          >
            <option value="">All positions</option>
            {Object.entries(POSITIONS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Team</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          >
            <option value="">All teams</option>
            {Object.entries(teamsById).map(([id, t]) => (
              <option key={id} value={id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-sm font-medium block mb-1">Search</label>
          <input
            type="text"
            placeholder="Type player name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Sort by</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {Object.entries(SORT_OPTIONS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Player List */}
      <div className="max-h-[380px] overflow-y-auto border rounded p-2 bg-gray-50">
        {filteredPlayers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No players found.
          </p>
        ) : (
          filteredPlayers.slice(0, 60).map((p) => {
            const disabled = selectedMap[p.id];
            return (
              <button
                key={p.id}
                onClick={() => !disabled && onSelect(p)}
                disabled={disabled}
                className={`flex items-center justify-between w-full text-left px-3 py-1.5 rounded text-sm mb-1 ${
                  disabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "hover:bg-indigo-50"
                }`}
              >
                <div>
                  <span className="font-medium">{p.web_name}</span>{" "}
                  <span className="text-gray-500 text-xs">
                    ({teamsById[p.team]?.short_name})
                  </span>
                </div>
                <div className="flex flex-col items-end text-xs">
                  <span>Pts: {p.total_points}</span>
                  <span>£{(p.now_cost / 10).toFixed(1)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
