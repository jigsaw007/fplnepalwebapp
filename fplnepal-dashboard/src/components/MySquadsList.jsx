import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MySquadsList() {
  const { user, loading } = useAuth(); // ✅ use AuthContext directly
  const [mySquads, setMySquads] = useState([]);
  const [fetching, setFetching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // wait until auth is ready
    if (!user) return;

    const loadSquads = async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("squads")
        .select("id, squad_name, captain_id, budget, players, inserted_at")
        .eq("user_id", user.id)
        .order("inserted_at", { ascending: false });

      if (error) console.error("Error fetching squads:", error);
      else setMySquads(data || []);
      setFetching(false);
    };

    loadSquads();
  }, [user, loading]);

  if (loading) return null;
  if (!user)
    return (
      <div className="text-sm text-gray-200 italic">
        Please log in to view your squads.
      </div>
    );

  return (
    <div
      id="mysquads-section"
      className="mt-4 bg-purple-800/70 p-3 rounded-lg shadow-inner"
    >
      <h3 className="text-base font-semibold mb-2">🗂️ My Saved Squads</h3>

      {fetching ? (
        <p className="text-xs text-gray-300">Loading squads...</p>
      ) : mySquads.length === 0 ? (
        <p className="text-xs text-gray-300">No squads saved yet.</p>
      ) : (
        <ul className="space-y-2 max-h-[180px] overflow-y-auto">
          {mySquads.map((squad) => {
            const captain = Array.isArray(squad.players)
              ? squad.players.find((p) => p.id === squad.captain_id)
              : null;

            return (
              <li
                key={squad.id}
                className="border border-purple-600 rounded-md p-2 bg-purple-900/60 hover:bg-purple-700/80 transition"
              >
                <p className="text-sm font-semibold text-yellow-300 truncate">
                  {squad.squad_name}
                </p>
                <p className="text-[11px] text-gray-200">
                  Captain: {captain?.web_name || "—"} | 💰 {squad.budget}M
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => navigate(`/set-team?squad=${squad.id}`)}
                    className="bg-purple-600 text-[11px] px-2 py-[2px] rounded hover:bg-purple-700"
                  >
                    Open
                  </button>

                  <button
                    onClick={async () => {
                      const section = document.getElementById("mysquads-section");
                      if (section) section.style.opacity = "0.7";

                      const url = `${window.location.origin}/set-team?squad=${squad.id}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        alert(`✅ Link copied!\n${url}`);
                      } catch {
                        alert(`🔗 Copy manually:\n${url}`);
                      }

                      if (section) section.style.opacity = "1";
                    }}
                    className="bg-green-600 text-[11px] px-2 py-[2px] rounded hover:bg-green-700"
                  >
                    Share
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
