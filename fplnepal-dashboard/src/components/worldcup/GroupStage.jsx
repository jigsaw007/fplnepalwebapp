import { Link } from 'react-router-dom';
import Flag from 'react-world-flags';

export default function GroupStage({ teams }) {
  const grouped = {};

  teams.forEach((team) => {
    const group = team.Group?.toUpperCase() || 'Unassigned';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(team);
  });

  // Sort each group's teams alphabetically
  Object.keys(grouped).forEach((group) => {
    grouped[group].sort((a, b) => a.Nation.localeCompare(b.Nation));
  });

  return (
    <div className="w-full px-4">
      <h2 className="text-2xl font-bold text-center mb-6">🏆 Group Stage</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.keys(grouped)
          .sort() // Sort groups A to H
          .map((groupKey) => (
            <div key={groupKey} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-3 text-purple-700">
                Group {groupKey}
              </h3>
              <ul className="space-y-2">
                {grouped[groupKey].map((team) => (
                  <li key={team['Slot Number']} className="flex items-center gap-2 text-sm font-medium">
                    <Flag
                      code={team.ISO2?.toLowerCase()}
                      style={{
                        width: 24,
                        height: 16,
                        borderRadius: 2,
                        boxShadow: '0 0 4px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Link
                      to={`/worldcup/team/${team['Slot Number']}`}
                      className="hover:text-purple-700 transition"
                    >
                      {team.Nation}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}
