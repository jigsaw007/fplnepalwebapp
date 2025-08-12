import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { fetchUserHistory } from '../../api/fplApi';
import TabsNav from '../../components/worldcup/TabsNav';


export default function TeamPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [nation, setNation] = useState('');
  const [iso2, setIso2] = useState('');
  const [managers, setManagers] = useState([]);
  const [selectedGW, setSelectedGW] = useState(1);

  const mappingUrl =
    'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509';
  const teamsUrl =
    'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=0';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fetchCsv = async (url) => {
        const res = await fetch(url);
        const text = await res.text();
        return new Promise((resolve) =>
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
          })
        );
      };

      const [nationMap, managerList] = await Promise.all([
        fetchCsv(mappingUrl),
        fetchCsv(teamsUrl),
      ]);

      const nationRow = nationMap.find((n) => n['Slot Number'] === id);
      setNation(nationRow?.Nation || 'Unknown');
      setIso2(nationRow?.ISO2 || '');

      const managersForThisSlot = managerList.filter((m) => m['Nation'] === id);

      const enrichedManagers = await Promise.all(
        managersForThisSlot.map(async (m) => {
          const teamId = parseInt(String(m['TeamID']).trim(), 10);
          if (!teamId || Number.isNaN(teamId)) {
            return { fpl_id: m['TeamID'], error: true };
          }
          try {
            const result = await fetchUserHistory(teamId);
            return {
              fpl_id: teamId,
              name: result.name,
              team_name: result.team_name,
              total_points:
                result.current?.reduce((sum, gw) => sum + (gw.points || 0), 0) || 0,
              gw_scores:
                result.current?.map((gw) => ({ event: gw.event, points: gw.points })) || [],
            };
          } catch {
            return { fpl_id: teamId, error: true };
          }
        })
      );

      setManagers(enrichedManagers);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const getGWScore = (manager, gw) =>
    manager.gw_scores?.find((entry) => entry.event === gw)?.points ?? 0;

  const totalTeamGWScore = useMemo(
    () => managers.reduce((sum, m) => sum + getGWScore(m, selectedGW), 0),
    [managers, selectedGW]
  );

  const flagUrl = iso2 ? `https://flagcdn.com/w320/${iso2.toLowerCase()}.png` : '';
  <TabsNav
  tabs={['Teams', 'Groups', 'Fixtures','Results']}
  active="Teams"
  onSelect={(tab) => {
    if (tab === 'Teams') return; // Stay on this page
    window.location.href = '/worldcup'; // Go back to World Cup main page
  }}
/>

  return (
    
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto pt-8 px-4">
        {/* Tabs */}
        <TabsNav
          tabs={['Teams', 'Groups', 'Fixtures', 'Results']}
          active={'Teams'}
          onSelect={(tab) => {
            if (tab === 'Teams') return; // stay on this page
            window.location.href = '/worldcup';
          }}
        />

        {/* Title and Flag */}
        <div className="bg-white/70 backdrop-blur rounded-2xl shadow-sm p-6 border border-purple-100">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-900 text-center">
            {nation}
          </h1>
          {flagUrl && (
            <div className="mt-4 flex justify-center">
              <img
                src={flagUrl}
                alt={`${nation} flag`}
                className="h-16 sm:h-20 w-auto rounded-md shadow"
                loading="lazy"
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <label htmlFor="gw-select" className="text-sm text-gray-600">
              Gameweek
            </label>
            <select
              id="gw-select"
              value={selectedGW}
              onChange={(e) => setSelectedGW(parseInt(e.target.value))}
              className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-purple-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {Array.from({ length: 38 }, (_, i) => i + 1).map((gw) => (
                <option key={gw} value={gw}>
                  {gw}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Manager Table */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-600">Loading managers…</div>
          ) : managers.length === 0 ? (
            <div className="p-10 text-center text-gray-600">No managers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <th className="px-4 py-3 text-left">Manager</th>
                    <th className="px-4 py-3 text-left">Team Name</th>
                    <th className="px-4 py-3 text-right">Total Points</th>
                    <th className="px-4 py-3 text-right">GW {selectedGW} Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {managers.map((m) =>
                    m.error ? (
                      <tr key={m.fpl_id} className="bg-red-50/60">
                        <td className="px-4 py-3 text-red-600" colSpan={4}>
                          Error loading manager {m.fpl_id}
                        </td>
                      </tr>
                    ) : (
                      <tr key={m.fpl_id} className="hover:bg-purple-50/50">
                        <td className="px-4 py-3 font-semibold text-purple-800">{m.name}</td>
                        <td className="px-4 py-3 italic text-gray-700">{m.team_name}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{m.total_points}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{getGWScore(m, selectedGW)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && (
            <div className="flex items-center justify-end gap-3 px-4 py-4 bg-gray-50 border-t">
              <span className="text-sm text-gray-600">Total GW {selectedGW} Score</span>
              <span className="text-lg font-bold text-purple-700 tabular-nums">{totalTeamGWScore}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
