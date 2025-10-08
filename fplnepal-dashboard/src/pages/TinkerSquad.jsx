// src/pages/TinkerSquad.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchFPLData } from "../api/fplApi";
import { supabase } from "../supabaseClient";

export default function TinkerSquad() {
  const { id } = useParams(); // squad ID from URL
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [squad, setSquad] = useState(null);
  const [budget, setBudget] = useState(100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [boot, { data, error: squadError }] = await Promise.all([
          fetchFPLData(),
          supabase.from("squads").select("*").eq("id", id).single(),
        ]);

        if (squadError || !data) {
          setError("Squad not found or deleted.");
          return;
        }

        // Parse players and bench properly
        let parsedPlayers = data.players;
        if (typeof parsedPlayers === "string") {
          try {
            parsedPlayers = JSON.parse(parsedPlayers);
          } catch {
            parsedPlayers = {};
          }
        }

        // Ensure structure is object with position arrays
        if (!parsedPlayers || typeof parsedPlayers !== "object") {
          parsedPlayers = { "1": [], "2": [], "3": [], "4": [] };
        }

        setPlayers(boot?.elements || []);
        setSquad({ ...data, players: parsedPlayers });
        setBudget(data?.budget || 100);
      } catch (err) {
        console.error(err);
        setError("Error loading squad.");
      }
    };
    load();
  }, [id]);

  if (error)
    return (
      <div className="p-4 text-center text-red-600 font-semibold">{error}</div>
    );

  if (!squad)
    return <p className="p-4 text-center text-gray-500">Loading squad...</p>;

  const addPlayer = (p) => {
    const pos = p.element_type;
    const key = pos.toString();
    if (squad.players[key].some((x) => x.id === p.id)) return;
    if (budget - p.now_cost / 10 < 0) return;
    setSquad((prev) => ({
      ...prev,
      players: { ...prev.players, [key]: [...prev.players[key], p] },
    }));
    setBudget((b) => b - p.now_cost / 10);
  };

  const removePlayer = (p) => {
    const pos = p.element_type;
    const key = pos.toString();
    setSquad((prev) => ({
      ...prev,
      players: {
        ...prev.players,
        [key]: prev.players[key].filter((x) => x.id !== p.id),
      },
    }));
    setBudget((b) => b + p.now_cost / 10);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("squads")
      .update({ players: squad.players, budget })
      .eq("id", id);
    setSaving(false);
    if (error) alert("❌ Error saving: " + error.message);
    else alert("✅ Squad updated!");
  };

  const formation = `${squad.players["2"].length}-${squad.players["3"].length}-${squad.players["4"].length}`;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2 text-purple-800">
        ⚙️ Tinker Your Squad
      </h2>
      <p className="mb-3 text-indigo-700">
        💰 Budget Remaining: £{budget.toFixed(1)}m
      </p>
      <p className="mb-4 text-sm text-gray-600">Formation: {formation}</p>

      {/* Players by position */}
      {Object.entries(squad.players).map(([pos, list]) => (
        <div key={pos} className="mb-3">
          <h3 className="font-semibold text-gray-700">
            {pos === "1"
              ? "Goalkeepers"
              : pos === "2"
              ? "Defenders"
              : pos === "3"
              ? "Midfielders"
              : "Forwards"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(list) && list.length > 0 ? (
              list.map((p) => (
                <div
                  key={p.id}
                  onClick={() => removePlayer(p)}
                  className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded cursor-pointer hover:bg-indigo-200"
                >
                  {p.web_name}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No players</p>
            )}
          </div>
        </div>
      ))}

      {/* Available Players List */}
      <div className="mt-6 border-t border-gray-300 pt-4">
        <h3 className="font-semibold text-gray-800 mb-2">Available Players</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {players.slice(0, 100).map((p) => (
            <div
              key={p.id}
              className="border p-2 rounded hover:bg-indigo-50 cursor-pointer text-sm"
              onClick={() => addPlayer(p)}
            >
              {p.web_name} (£{(p.now_cost / 10).toFixed(1)}m)
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
      >
        {saving ? "Saving..." : "💾 Save Changes"}
      </button>
    </div>
  );
}
