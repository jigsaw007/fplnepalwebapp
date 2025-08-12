import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { fetchUserHistory } from '../../api/fplApi';
import Flag from 'react-world-flags';

export default function AllManagers() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const loadTeamsWithManagers = async () => {
      const { data, error } = await supabase.from('worldcup_teams').select('*');

      if (error) {
        console.error('Error fetching teams:', error);
        setLoading(false);
        return;
      }

      const enriched = await Promise.all(
        data.map(async (team) => {
          const managers = await Promise.all(
            (team.manager_ids || []).map(async (id) => {
              try {
                const fpl = await fetchUserHistory(id);
                return {
                  fpl_id: id,
                  name: fpl.name,
                  team_name: fpl.team_name,
                  total_points: fpl.current?.reduce((sum, gw) => sum + gw.points, 0) || 0,
                };
              } catch {
                return { fpl_id: id, error: true };
              }
            })
          );

          return { ...team, managers };
        })
      );

      setTeams(enriched);
      setLoading(false);
    };

    loadTeamsWithManagers();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-purple-600 border-solid mx-auto mb-3"></div>
        Loading managers...
      </div>
    );
  }

  return (
    <div className="px-4 max-w-screen-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">🌍 All Assigned Managers</h2>

      {teams
        .filter((team) => team.manager_ids?.length > 0)
        .map((team) => (
          <div key={team.id} className="mb-6 border border-gray-200 rounded-lg shadow bg-white p-4">
            <div className="flex items-center gap-3 mb-2">
              {team.flag && (
                <Flag
                  code={team.flag.toLowerCase()}
                  style={{ width: 28, height: 20, borderRadius: 2 }}
                />
              )}
              <h3 className="text-xl font-semibold text-purple-700">{team.nation}</h3>
              <span className="text-gray-500 text-sm ml-auto">Group {team.group}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {team.managers.map((m) =>
                m.error ? (
                  <div
                    key={m.fpl_id}
                    className="border rounded p-3 text-sm bg-red-50 text-red-500"
                  >
                    Error loading manager {m.fpl_id}
                  </div>
                ) : (
                  <div
                    key={m.fpl_id}
                    className="border rounded p-3 bg-gray-50 text-sm hover:shadow-md transition"
                  >
                    <h4 className="font-semibold text-purple-800">{m.name}</h4>
                    <p className="italic text-gray-600">{m.team_name}</p>
                    <p>Total Points: {m.total_points}</p>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
