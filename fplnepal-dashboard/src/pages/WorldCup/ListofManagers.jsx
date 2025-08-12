import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { fetchUserHistory } from '../../api/fplApi';
import TabsNav from '../../components/worldcup/TabsNav';

export default function ListofManagers() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');

  const mappingUrl =
    'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509';
  const teamsUrl =
    'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=0';

  useEffect(() => {
    let cancelled = false;
    const fetchCsv = async (url) => {
      const res = await fetch(url);
      const text = await res.text();
      return new Promise((resolve, reject) =>
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (e) => reject(e),
        })
      );
    };

    const load = async () => {
      try {
        setLoading(true);
        const [nationMap, managerList] = await Promise.all([
          fetchCsv(mappingUrl),
          fetchCsv(teamsUrl),
        ]);

        const byNation = await Promise.all(
          nationMap.map(async (row) => {
            const slot = String(row['Slot Number']).trim();
            const nation = row['Nation'] || 'Unknown';
            const iso2 = (row['ISO2'] || '').toLowerCase();

            const rowsForSlot = managerList.filter((m) => String(m['Nation']).trim() === slot);

            const managers = await Promise.all(
              rowsForSlot.map(async (m) => {
                const teamId = parseInt(String(m['TeamID']).trim(), 10);
                if (!teamId || Number.isNaN(teamId)) return null;
                try {
                  const res = await fetchUserHistory(teamId);
                  return {
                    fpl_id: teamId,
                    name: res?.name || 'Unknown Manager',
                    team_name: res?.team_name || '',
                  };
                } catch (e) {
                  return {
                    fpl_id: teamId,
                    name: 'Unknown Manager',
                    team_name: '',
                    error: true,
                  };
                }
              })
            );

            return {
              iso2,
              nation,
              slot,
              managers: (managers || []).filter(Boolean),
            };
          })
        );

        if (!cancelled) {
          const sorted = byNation.sort((a, b) => a.nation.localeCompare(b.nation));
          setGroups(sorted);
          setError('');
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load managers.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const flagUrl = (iso2) => (iso2 ? `https://flagcdn.com/w80/${iso2}.png` : null);

return (
  <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 print:bg-white">
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-4 print:hidden">
      <h1 className="text-3xl font-bold text-purple-800 drop-shadow text-center">
        FPL NEPAL WORLD CUP
      </h1>

      {/* Tabs navigation */}
      <TabsNav
        tabs={['Teams', 'Groups', 'Fixtures', 'Results']}
        active="Full Team"
      />
    </div>

    <div className="max-w-6xl mx-auto px-4 pb-12">
      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-300 border-t-purple-700"></div>
          <p className="text-purple-800 font-medium">Loading. Please wait a while.</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {groups.map((g) => (
            <section
              key={g.slot}
              className="break-inside-avoid print:break-inside-avoid p-5 rounded-2xl border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow"
            >
              <header className="flex items-center gap-3 mb-4 border-b pb-2">
                {flagUrl(g.iso2) && (
                  <img
                    src={flagUrl(g.iso2)}
                    alt={`${g.nation} flag`}
                    className="h-6 w-9 object-cover rounded-sm border"
                  />
                )}
                <h2 className="text-lg font-bold text-purple-800">{g.nation}</h2>
              </header>
              {g.managers.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No managers assigned.</p>
              ) : (
                <ul className="space-y-1">
                  {g.managers.map((m) => (
                    <li key={`${g.slot}-${m.fpl_id}`} className="text-gray-800">
                      {m.name}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>

    <style>{`
      @media print {
        @page { size: A4; margin: 14mm; }
        .print\\:hidden { display: none !important; }
        .print\\:break-inside-avoid { break-inside: avoid; }
        html, body { background: #fff; }
        section { page-break-inside: avoid; }
      }
    `}</style>
  </div>
);

}
