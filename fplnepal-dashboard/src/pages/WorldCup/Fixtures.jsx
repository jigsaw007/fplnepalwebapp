import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import TabsNav from '../../components/worldcup/TabsNav';

/**
 * FPL Nepal World Cup — Fixtures Page
 *
 * • Loads fixtures from the provided public CSV (Google Sheets publish link)
 * • Loads Nation ↔ Slot ↔ ISO2 mapping from the existing mapping sheet
 * • Shows a clean, visual UI grouped by Gameweek with country flags
 * • Works even if the fixture uses Slot numbers (1–32) or Nation names
 */

const FIXTURES_CSV =
  'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=1414330140';

// Nation mapping (already used elsewhere in your World Cup pages)
// Expected headers: Slot Number, Nation, ISO2
const NATION_MAP_CSV =
  'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509';

export default function FixturePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fixtures, setFixtures] = useState([]);
  const [nationMap, setNationMap] = useState([]);
  const [activeGW, setActiveGW] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchCsv = async (url) => {
      const res = await fetch(url);
      const text = await res.text();
      return new Promise((resolve, reject) =>
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data || []),
          error: (e) => reject(e),
        })
      );
    };

    const load = async () => {
      try {
        setLoading(true);
        const [rawFixtures, rawNationMap] = await Promise.all([
          fetchCsv(FIXTURES_CSV),
          fetchCsv(NATION_MAP_CSV),
        ]);

        if (cancelled) return;

        // Normalize nation map → quick lookup by slot and by name
        const normMap = rawNationMap
          .map((r) => ({
            slot: String(r['Slot Number'] || '').trim(),
            nation: String(r['Nation'] || '').trim(),
            iso2: String(r['ISO2'] || '').trim().toLowerCase(),
          }))
          .filter((r) => r.slot || r.nation);

        setNationMap(normMap);

        // Try to infer fixture headers
        // Accept possible variants: Gameweek/GW, Home/HomeTeam, Away/AwayTeam, Date/KO
        const normalizedFixtures = rawFixtures
          .map((r) => {
            // Accept your sheet headers
            const gw = r['Gameweek'] ?? r['GW'] ?? r['Week'] ?? r['gameweek'];

            // Prefer numeric IDs if present; fallback to names
            const homeId = r['Team1ID'] ?? r['HomeID'] ?? r['Home Id'] ?? r['home_id'];
            const awayId = r['Team2ID'] ?? r['AwayID'] ?? r['Away Id'] ?? r['away_id'];

            const homeName = r['Team1'] ?? r['Home'] ?? r['HomeTeam'] ?? r['Home Team'] ?? r['home'];
            const awayName = r['Team2'] ?? r['Away'] ?? r['AwayTeam'] ?? r['Away Team'] ?? r['away'];

            const date = r['Date'] ?? r['Kickoff'] ?? r['KO'] ?? r['date'] ?? '';
            const time = r['Time'] ?? r['time'] ?? '';

            // We'll store both raw value and resolved value later
            return {
              gw: String(gw ?? '').trim(),
              homeRaw: String((homeId ?? homeName) ?? '').trim(),
              awayRaw: String((awayId ?? awayName) ?? '').trim(),
              date: String(date ?? '').trim(),
              time: String(time ?? '').trim(),
            };
          })
          .filter((f) => f.gw && (f.homeRaw || f.awayRaw));

        setFixtures(normalizedFixtures);
        setError('');
      } catch (e) {
        console.error(e);
        setError('Failed to load fixtures. Please try again later.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Helpers
  const flagUrl = (iso2) => (iso2 ? `https://flagcdn.com/w40/${iso2}.png` : null);

  const resolveNation = (value) => {
    if (!value) return { name: '', iso2: '' };
    const trimmed = String(value).trim();

    // If value is a slot number (e.g., "1", "12")
    if (/^\d{1,2}$/.test(trimmed)) {
      const row = nationMap.find((n) => n.slot === trimmed);
      return row ? { name: row.nation, iso2: row.iso2 } : { name: `Slot ${trimmed}`, iso2: '' };
    }

    // Otherwise, try match by nation name (case-insensitive)
    const byName = nationMap.find((n) => n.nation.toLowerCase() === trimmed.toLowerCase());
    if (byName) return { name: byName.nation, iso2: byName.iso2 };

    // Fallback: return raw text
    return { name: trimmed, iso2: '' };
  };

  const byGW = useMemo(() => {
    const map = new Map();
    for (const f of fixtures) {
      const key = f.gw || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(f);
    }

    // Sort numerically if possible
    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      const an = parseInt(a[0], 10);
      const bn = parseInt(b[0], 10);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return String(a[0]).localeCompare(String(b[0]));
    });

    return entries;
  }, [fixtures]);

  const allGWOptions = useMemo(() => ['All', ...byGW.map(([gw]) => gw)], [byGW]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
        {/* Tabs */}
        <TabsNav
          tabs={['Teams', 'Groups', 'Fixtures', 'Standings', 'Results']}
          active={'Fixtures'}
          onSelect={(tab) => {
            if (tab === 'Fixtures') return;
            navigate('/worldcup');
          }}
        />

        <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-900">
              📅 World Cup Fixtures
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Grouped by Gameweek. Flags auto-mapped from your Nation sheet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Gameweek</label>
            <select
              value={activeGW}
              onChange={(e) => setActiveGW(e.target.value)}
              className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-purple-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {allGWOptions.map((gw) => (
                <option key={gw} value={gw}>
                  {gw}
                </option>
              ))}
            </select>
          </div>
        </header>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-300 border-t-purple-700" />
            <p className="text-purple-800 font-medium">Loading fixtures…</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-600">{error}</div>
        ) : byGW.length === 0 ? (
          <div className="py-10 text-center text-gray-600">No fixtures found.</div>
        ) : (
          <div className="space-y-8">
            {byGW
              .filter(([gw]) => activeGW === 'All' || String(gw) === String(activeGW))
              .map(([gw, matches]) => (
                <section key={gw} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
                    <h2 className="text-xl font-bold">Gameweek {gw}</h2>
                    <span className="text-xs opacity-90">{matches.length} matches</span>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {matches.map((m, idx) => {
                      const H = resolveNation(m.homeRaw);
                      const A = resolveNation(m.awayRaw);
                      return (
                        <article
                          key={`${gw}-${idx}-${H.name}-${A.name}`}
                          className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur hover:shadow-md transition overflow-hidden"
                        >
                          <div className="flex items-stretch">
                            {/* Home */}
                            <TeamCell side="home" nation={H} />

                            {/* VS */}
                            <div className="w-14 flex flex-col items-center justify-center text-gray-500">
                              <span className="text-xs">vs</span>
                            </div>

                            {/* Away */}
                            <TeamCell side="away" nation={A} />
                          </div>

                          {(m.date || m.time) && (
                            <div className="px-4 py-2 text-center text-xs text-gray-600 border-t bg-gray-50">
                              {m.date} {m.time && `· ${m.time}`}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #fff; }
          .print\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function TeamCell({ side, nation }) {
  const { name, iso2 } = nation || {};
  const img = iso2 ? `https://flagcdn.com/w80/${iso2}.png` : '';
  return (
    <div className={`flex-1 px-4 py-3 flex items-center gap-3 ${side === 'home' ? 'justify-end text-right border-r' : 'justify-start'}`}>
      {side === 'away' && img && (
        <img src={img} alt={`${name} flag`} className="h-6 w-9 object-cover rounded-sm border" loading="lazy" />
      )}
      <div className="font-semibold text-gray-800 truncate">{name || 'TBD'}</div>
      {side === 'home' && img && (
        <img src={img} alt={`${name} flag`} className="h-6 w-9 object-cover rounded-sm border" loading="lazy" />
      )}
    </div>
  );
}
