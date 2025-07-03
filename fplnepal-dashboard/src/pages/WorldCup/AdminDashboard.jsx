import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient"; // Adjust the import path as needed

export default function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from("worldcup_teams")
        .select("*")
        .order("id");

      if (error) console.error("Fetch error:", error);
      else {
        const updated = data.map(team => ({
          ...team,
          manager_ids: team.manager_ids || [null, null, null, null],
          manager_names: team.manager_names || ["", "", "", ""]
        }));
        setTeams(updated);
      }
    };

    fetchTeams();
  }, []);

  const handleChange = (teamIndex, field, managerIndex, value) => {
    const updated = [...teams];
    if (field === "id") {
      updated[teamIndex].manager_ids[managerIndex] = value ? parseInt(value) : null;
    } else {
      updated[teamIndex].manager_names[managerIndex] = value;
    }
    setTeams(updated);
  };

  const handleSave = async (team) => {
    setSaving((prev) => ({ ...prev, [team.id]: true }));

    const { error } = await supabase
      .from("worldcup_teams")
      .update({
        manager_ids: team.manager_ids,
        manager_names: team.manager_names
      })
      .eq("id", team.id);

    setSaving((prev) => ({ ...prev, [team.id]: false }));

    if (error) {
      console.error("Save error:", error);
      alert("❌ Failed to save " + team.name);
    } else {
      alert("✅ Saved " + team.name);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🌍 World Cup Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team, teamIndex) => (
          <div key={team.id} className="border p-4 rounded-lg shadow-sm bg-white">
            <h2 className="font-bold text-lg">{team.code} {team.name}</h2>
            <p className="text-sm text-gray-500 mb-3">Group {team.group}</p>

            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Manager {i + 1}:
                </label>
                <input
                  type="number"
                  placeholder="FPL ID"
                  value={team.manager_ids[i] || ""}
                  onChange={(e) => handleChange(teamIndex, "id", i, e.target.value)}
                  className="border w-full px-3 py-2 rounded mb-1"
                />
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={team.manager_names[i] || ""}
                  onChange={(e) => handleChange(teamIndex, "name", i, e.target.value)}
                  className="border w-full px-3 py-2 rounded"
                />
              </div>
            ))}

            <button
              onClick={() => handleSave(team)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={saving[team.id]}
            >
              {saving[team.id] ? "Saving..." : "Save"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
