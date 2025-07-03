import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Flag from 'react-world-flags';

export default function WorldCupLanding() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase.from('worldcup_teams').select('*');
      if (!error) {
        const sorted = data.sort((a, b) => a.nation.localeCompare(b.nation));
        setTeams(sorted);
      }
      setLoading(false);
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-purple-100 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-purple-600 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-white to-blue-50 flex flex-col items-center py-10 px-4">
      {/* Animated Globe Title */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 flex items-center gap-3 animate-pulse">
        <span role="img" aria-label="globe" className="text-4xl">🌍</span>
        <span>FPL Nepal World Cup 2025</span>
      </h1>

      {/* Team Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-5 mb-12">
        {teams.map((team) => (
          <Link
            to={`/worldcup/team/${team.id}`}
            key={team.id}
            className="flex items-center gap-2 text-sm font-medium hover:text-purple-700 transition"
          >
            <Flag
              code={team.flag?.toLowerCase()}
              style={{
                width: 24,
                height: 16,
                borderRadius: 2,
                boxShadow: '0 0 4px rgba(0,0,0,0.1)',
              }}
            />
            <span>{team.nation}</span>
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-gray-700 max-w-lg px-2">
        ⚽ The World Cup is coming! Fixtures, groups, rules, and more will be announced soon.
        Stay tuned and click a team to view its managers.
      </p>
    </div>
  );
}
