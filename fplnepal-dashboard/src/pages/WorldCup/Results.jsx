import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import TabsNav from '../../components/worldcup/TabsNav';

// Reuse the same sheets
const FIXTURES_CSV =
  'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=1414330140';
const NATION_MAP_CSV =
  'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509';

/**
 * Results page
 * - Reads the same Fixtures sheet but expects result columns as either:
 *   A) Team1Score / Team2Score (or HomeScore/AwayScore) OR
 *   B) Score like "2-1" / Result like "3-0"
 * - Computes per‑group standings using 3-1-0 points rule and common tiebreakers.
 */
export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [nationMap, setNationMap] = useState([]);
  const [activeGW, setActiveGW] = useState('All');
  const [activeGroup, setActiveGroup] = useState('All');
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
        const [fixtures, map] = await Promise.all([
          fetchCsv(FIXTURES_CSV),
          fetchCsv(NATION_MAP_CSV),
        ]);
        if (cancelled) return;

        const nm = map
          .map((r) => ({
            slot: String(r['Slot Number'] || '').trim(),
            nation: String(r['Nation'] || '').trim(),
            iso2: String(r['ISO2'] || '').trim().toLowerCase(),
          }))
          .filter((r) => r.slot || r.nation);
        setNationMap(nm);

        const norm = fixtures.map((r) => normalizeFixture(r));
        setRows(norm);
        setError('');
      } catch (e) {
        console.error(e);
        setError('Failed to load results.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const standingsByGroup = useMemo(() => buildStandings(rows, nationMap), [rows, nationMap]);

  const groups = useMemo(() => ['All', ...Object.keys(standingsByGroup)], [standingsByGroup]);

  // GWs present in the data (for quick filtering / browsing past rounds)
  const gwOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.gw).filter(Boolean));
    return ['All', ...Array.from(s).sort((a, b) => parseInt(a) - parseInt(b))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) =>
      (activeGW === 'All' || String(r.gw) === String(activeGW)) &&
      (activeGroup === 'All' || String(r.group).toUpperCase() === String(activeGroup).toUpperCase())
    );
  }, [rows, activeGW, activeGroup]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-violet-50">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
        <TabsNav
          tabs={['Teams', 'Groups', 'Fixtures', 'Results']}
          active={'Results'}
          onSelect={(tab) => {
            if (tab === 'Fixtures') navigate('/worldcup/fixtures');
            else navigate('/worldcup');
          }}
        />

        <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-900">🧮 Results & Group Standings</h1>
            <p className="text-sm text-gray-600 mt-1"></p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-sm text-gray-600">GW</label>
            <select value={activeGW} onChange={(e) => setActiveGW(e.target.value)} className="px-3 py-2 rounded-xl border border-indigo-200 bg-white">
              {gwOptions.map((gw) => (
                <option key={gw} value={gw}>{gw}</option>
              ))}
            </select>

            <label className="text-sm text-gray-600">Group</label>
            <select value={activeGroup} onChange={(e) => setActiveGroup(e.target.value)} className="px-3 py-2 rounded-xl border border-indigo-200 bg-white">
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </header>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-300 border-t-indigo-700" />
            <p className="text-indigo-800 font-medium">Loading…</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-600">{error}</div>
        ) : (
          <div className="space-y-10">
            {/* Recent results list (filtered) */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
                <h2 className="text-lg font-bold">Match Results</h2>
                <span className="text-xs opacity-90">{filteredRows.filter((r) => r.hasScore).length} finished</span>
              </div>

              <div className="divide-y">
                {filteredRows.length === 0 ? (
                  <div className="p-6 text-center text-gray-600">No matches for the selected filters.</div>
                ) : (
                  filteredRows.map((m, idx) => (
                    <div key={idx} className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] items-center gap-3">
                      <TeamChip value={m.homeRaw} nationMap={nationMap} align="right" />
                      <div className="text-center">
                        {m.hasScore ? (
                          <span className="inline-block px-3 py-1 rounded-lg bg-gray-100 font-semibold">{m.homeScore} : {m.awayScore}</span>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                        {m.group && (
                          <div className="text-[10px] text-gray-500 mt-1">Group {m.group} · GW {m.gw}</div>
                        )}
                      </div>
                      <TeamChip value={m.awayRaw} nationMap={nationMap} align="left" />
                      <div className="text-xs text-gray-500 text-center md:text-right">{[m.date, m.time].filter(Boolean).join(' · ')}</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Group tables */}
            {Object.entries(standingsByGroup).map(([group, table]) => (
              <section key={group} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
                  <h2 className="text-lg font-bold">Group {group} — Standings</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Team</th>
                        <th className="px-3 py-2 text-center">P</th>
                        <th className="px-3 py-2 text-center">W</th>
                        <th className="px-3 py-2 text-center">D</th>
                        <th className="px-3 py-2 text-center">L</th>
                        <th className="px-3 py-2 text-center">GF</th>
                        <th className="px-3 py-2 text-center">GA</th>
                        <th className="px-3 py-2 text-center">GD</th>
                        <th className="px-3 py-2 text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.map((row, i) => (
                        <tr key={row.team} className={i < 2 ? 'bg-green-50' : ''}>
                          <td className="px-3 py-2">{i + 1}</td>
                          <td className="px-3 py-2 flex items-center gap-2">
                            {row.iso2 && (
                              <img src={`https://flagcdn.com/w20/${row.iso2}.png`} alt="flag" className="h-4 w-6 object-cover rounded-sm border" />
                            )}
                            <span className="font-medium">{row.team}</span>
                          </td>
                          <td className="px-3 py-2 text-center">{row.P}</td>
                          <td className="px-3 py-2 text-center">{row.W}</td>
                          <td className="px-3 py-2 text-center">{row.D}</td>
                          <td className="px-3 py-2 text-center">{row.L}</td>
                          <td className="px-3 py-2 text-center">{row.GF}</td>
                          <td className="px-3 py-2 text-center">{row.GA}</td>
                          <td className="px-3 py-2 text-center">{row.GD}</td>
                          <td className="px-3 py-2 text-center font-bold">{row.Pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== helpers =====
function normalizeFixture(r) {
  const gw = r['Gameweek'] ?? r['GW'] ?? r['Week'] ?? r['gameweek'];
  const group = r['Group'] ?? r['group'] ?? '';

  const homeId = r['Team1ID'] ?? r['HomeID'] ?? r['Home Id'] ?? r['home_id'];
  const awayId = r['Team2ID'] ?? r['AwayID'] ?? r['Away Id'] ?? r['away_id'];
  const homeName = r['Team1'] ?? r['Home'] ?? r['HomeTeam'] ?? r['Home Team'] ?? r['home'];
  const awayName = r['Team2'] ?? r['Away'] ?? r['AwayTeam'] ?? r['Away Team'] ?? r['away'];

  const date = r['Date'] ?? r['Kickoff'] ?? r['KO'] ?? r['date'] ?? '';
  const time = r['Time'] ?? r['time'] ?? '';

  // Scores
  let homeScore = r['Team1Score'] ?? r['HomeScore'] ?? r['HS'] ?? r['Score1'] ?? '';
  let awayScore = r['Team2Score'] ?? r['AwayScore'] ?? r['AS'] ?? r['Score2'] ?? '';
  const scoreStr = r['Score'] ?? r['Result'] ?? '';

  if ((homeScore === '' || awayScore === '') && typeof scoreStr === 'string' && scoreStr.includes('-')) {
    const [h, a] = scoreStr.split('-').map((x) => x.trim());
    homeScore = h;
    awayScore = a;
  }

  const hs = Number.isFinite(Number(homeScore)) ? parseInt(homeScore, 10) : null;
  const as = Number.isFinite(Number(awayScore)) ? parseInt(awayScore, 10) : null;

  return {
    gw: String(gw ?? '').trim(),
    group: String(group ?? '').trim(),
    homeRaw: String((homeId ?? homeName) ?? '').trim(),
    awayRaw: String((awayId ?? awayName) ?? '').trim(),
    date: String(date ?? '').trim(),
    time: String(time ?? '').trim(),
    homeScore: hs,
    awayScore: as,
    hasScore: Number.isInteger(hs) && Number.isInteger(as),
  };
}

function buildStandings(rows, nationMap) {
  const teams = {}; // group -> team -> stats
  const ensure = (group, team) => {
    if (!teams[group]) teams[group] = {};
    if (!teams[group][team]) teams[group][team] = {
      team,
      iso2: resolveIso2(team, nationMap),
      P: 0, W: 0, D: 0, L: 0,
      GF: 0, GA: 0, GD: 0,
      Pts: 0,
    };
    return teams[group][team];
  };

  for (const m of rows) {
    if (!m.group) continue; // only group stage contributes here
    const H = labelFromRaw(m.homeRaw, nationMap);
    const A = labelFromRaw(m.awayRaw, nationMap);

    // Ensure teams exist even for unplayed matches so tables show all entries
    ensure(m.group, H);
    ensure(m.group, A);

    if (!m.hasScore) continue; // skip if not finished yet

    const hs = m.homeScore;
    const as = m.awayScore;

    const th = ensure(m.group, H);
    const ta = ensure(m.group, A);

    th.P++; ta.P++;
    th.GF += hs; th.GA += as; th.GD = th.GF - th.GA;
    ta.GF += as; ta.GA += hs; ta.GD = ta.GF - ta.GA;

    if (hs > as) { th.W++; th.Pts += 3; ta.L++; }
    else if (hs < as) { ta.W++; ta.Pts += 3; th.L++; }
    else { th.D++; ta.D++; th.Pts += 1; ta.Pts += 1; }
  }

  // Convert to sorted arrays per group
  const out = {};
  for (const [group, tmap] of Object.entries(teams)) {
    const arr = Object.values(tmap).sort((a, b) => {
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      if (b.GD !== a.GD) return b.GD - a.GD;
      if (b.GF !== a.GF) return b.GF - a.GF;
      return a.team.localeCompare(b.team);
    });
    out[group] = arr;
  }
  return out;
}

function labelFromRaw(raw, nationMap) {
  const trimmed = String(raw || '').trim();
  if (/^\d{1,2}$/.test(trimmed)) {
    const row = nationMap.find((n) => n.slot === trimmed);
    return row ? row.nation : `Slot ${trimmed}`;
  }
  return trimmed;
}

function resolveIso2(value, nationMap) {
  const trimmed = String(value || '').trim();
  // by slot
  if (/^\d{1,2}$/.test(trimmed)) {
    const row = nationMap.find((n) => n.slot === trimmed);
    return row ? row.iso2 : '';
  }
  // by name
  const byName = nationMap.find((n) => n.nation.toLowerCase() === trimmed.toLowerCase());
  return byName ? byName.iso2 : '';
}

function TeamChip({ value, nationMap, align = 'left' }) {
  const name = labelFromRaw(value, nationMap);
  const iso2 = resolveIso2(value, nationMap) || resolveIso2(name, nationMap);
  return (
    <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end text-right' : ''}`}>
      {align !== 'right' && iso2 && (
        <img src={`https://flagcdn.com/w20/${iso2}.png`} alt="flag" className="h-4 w-6 object-cover rounded-sm border" />
      )}
      <span className="font-semibold text-gray-800">{name || 'TBD'}</span>
      {align === 'right' && iso2 && (
        <img src={`https://flagcdn.com/w20/${iso2}.png`} alt="flag" className="h-4 w-6 object-cover rounded-sm border" />
      )}
    </div>
  );
}
