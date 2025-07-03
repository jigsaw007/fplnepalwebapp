import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchUserHistory } from '../../api/fplApi';
import { supabase } from '../../supabaseClient';
import Flag from 'react-world-flags';

export default function TeamPage() {
  const { id } = useParams();
  const teamId = parseInt(id);
  const [teamInfo, setTeamInfo] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data, error } = await supabase
        .from('worldcup_teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) {
        console.error('Error fetching team:', error);
        setTeamInfo(null);
        setLoading(false);
        return;
      }

      setTeamInfo(data);

      const results = await Promise.all(
        (data.manager_ids || []).map(async (managerId) => {
          if (!managerId) return null;
          try {
            const fpl = await fetchUserHistory(managerId);
            return {
              fpl_id: managerId,
              name: fpl.name,
              team_name: fpl.team_name,
              total_points: fpl.current?.reduce((sum, gw) => sum + gw.points, 0) || 0,
              gw_score: fpl.current?.at(-1)?.points ?? 0,
            };
          } catch (err) {
            return { fpl_id: managerId, error: true };
          }
        })
      );

      setManagers(results.filter(Boolean));
      setLoading(false);
    };

    fetchTeam();
  }, [teamId]);

  if (!teamInfo) return <div className="p-4">Searching..</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-2">
        {teamInfo.flag && (
          <Flag
            code={teamInfo.flag.toLowerCase()}
            style={{ width: 48, height: 32, borderRadius: 4 }}
          />
        )}
        <h1 className="text-3xl font-bold">{teamInfo.nation}</h1>
      </div>
      <p className="text-gray-500 mb-4">Group {teamInfo.group}</p>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid"></div>
          <span className="ml-4 text-lg font-medium">Loading managers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {managers.map((manager) => (
            <div
              key={manager.fpl_id}
              className="border rounded p-4 shadow bg-white hover:shadow-md transition"
            >
              {manager.error ? (
                <p className="text-red-500">Error loading manager {manager.fpl_id}</p>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">{manager.name}</h2>
                  <p className="text-gray-600 italic">{manager.team_name}</p>
                  <p>Total Points: {manager.total_points}</p>
                  <p>GW Score: {manager.gw_score}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
