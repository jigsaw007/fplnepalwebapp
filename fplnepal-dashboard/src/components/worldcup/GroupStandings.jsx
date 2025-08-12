import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';

/**
 * GroupStandings component
 *
 * Fetches fixtures + nation map and computes live standings (3-1-0) per group.
 * Can be dropped into any page (e.g., Groups page) and will auto-render tables A–H.
 *
 * Props:
 *  - fixturesCsv (string): CSV URL for fixtures sheet (must include columns: Gameweek, Group, Team1/Team1ID, Team2/Team2ID and score fields)
 *  - nationMapCsv (string): CSV URL for mapping sheet (Slot Number, Nation, ISO2)
 *  - upToGW (number|string, optional): only include matches with GW <= upToGW when computing standings
 */
export default function GroupStandings({ fixturesCsv, nationMapCsv, upToGW }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [nationMap, setNationMap] = useState([]);

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
          fetchCsv(fixturesCsv),
          fetchCsv(nationMapCsv),
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
        setError('Failed to load group tables.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fixturesCsv, nationMapCsv]);

  // Optionally limit by GW
  const filtered = useMemo(() => {
    if (!upToGW) return rows;
    const lim = parseInt(upToGW, 10);
    if (Number.isNaN(lim)) return rows;
    return rows.filter((r) => parseInt(r.gw, 10) <= lim);
  }, [rows, upToGW]);

  const tables = useMemo(() => buildStandings(filtered, nationMap), [filtered, nationMap]);
  const groupKeys = useMemo(() => Object.keys(tables).sort(), [tables]);

  if (loading) {
    return (
      <div className="py-10 flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-300 border-t-emerald-700" />
        <p className="text-emerald-800">Loading group tables…</p>
      </div>
    );
  }
  if (error) return <div className="text-red-600 py-4">{error}</div>;

  return (
    <div className="space-y-8">
      {groupKeys.length === 0 ? (
        <div className="text-gray-600">No group data found.</div>
      ) : (
        groupKeys.map((group) => (
          <section key={group} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <h2 className="text-lg font-bold">Group {group}</h2>
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
                  {tables[group].map((row, i) => (
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
        ))
      )}
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

    // Ensure teams exist even for unplayed matches
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
  if (/^\d{1,2}$/.test(trimmed)) {
    const row = nationMap.find((n) => n.slot === trimmed);
    return row ? row.iso2 : '';
  }
  const byName = nationMap.find((n) => n.nation.toLowerCase() === trimmed.toLowerCase());
  return byName ? byName.iso2 : '';
}
