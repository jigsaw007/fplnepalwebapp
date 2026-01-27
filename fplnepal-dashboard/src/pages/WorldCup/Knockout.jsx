import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import TabsNav from '../../components/worldcup/TabsNav';

/* =========================
   GOOGLE SHEET CSV URLS
========================= */

const KNOCKOUT_TEAMS_CSV =
  'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=1828892330';

const KNOCKOUT_FIXTURES_CSV =
  'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=2133615816';

/* ========================= */

export default function KnockoutPage() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState({});
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     CSV Helper
  ========================= */
  const fetchCsv = async (url) => {
    const res = await fetch(url);
    const text = await res.text();
    return new Promise((resolve) =>
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (r) => resolve(r.data),
      })
    );
  };

  /* =========================
     Load Data
  ========================= */
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [teamRows, fixtureRows] = await Promise.all([
        fetchCsv(KNOCKOUT_TEAMS_CSV),
        fetchCsv(KNOCKOUT_FIXTURES_CSV),
      ]);

      const teamMap = {};
      teamRows.forEach((t) => {
        teamMap[t.KnockoutID] = {
          name: t.Nation,
          iso2: t.ISO2?.toLowerCase(),
        };
      });

      const normalized = fixtureRows.map((f) => ({
        id: Number(f.FixtureID),
        round: f.Round,
        gw: f.GW,
        t1: f.Team1ID,
        t2: f.Team2ID,
        s1: f.Team1Score !== '' ? Number(f.Team1Score) : null,
        s2: f.Team2Score !== '' ? Number(f.Team2Score) : null,
      }));

      setTeams(teamMap);
      setFixtures(normalized);
      setLoading(false);
    };

    load();
  }, []);

  /* =========================
     Resolve Winners / Losers
  ========================= */
  const resolved = useMemo(() => {
    const winners = {};
    const losers = {};

    const resolveTeam = (ref) => {
      if (!ref) return null;
      if (ref.startsWith('K')) return teams[ref];
      if (ref.startsWith('W')) return winners[ref];
      if (ref.startsWith('L')) return losers[ref];
      return null;
    };

    return fixtures.map((m) => {
      const home = resolveTeam(m.t1);
      const away = resolveTeam(m.t2);

      let winner = null;
      let loser = null;

      if (home && away && m.s1 !== null && m.s2 !== null) {
        if (m.s1 > m.s2) {
          winner = home;
          loser = away;
        } else if (m.s2 > m.s1) {
          winner = away;
          loser = home;
        }
        winners[`W${m.id}`] = winner;
        losers[`L${m.id}`] = loser;
      }

      return { ...m, home, away, winner };
    });
  }, [fixtures, teams]);

  /* =========================
     Group by Round
  ========================= */
  const rounds = useMemo(() => {
    const map = {};
    resolved.forEach((m) => {
      if (!map[m.round]) map[m.round] = [];
      map[m.round].push(m);
    });
    return map;
  }, [resolved]);

  const flag = (iso2) =>
    iso2 ? `https://flagcdn.com/w40/${iso2}.png` : null;

const roundStyle = (round) => {
  switch (round) {
    case 'Final':
      return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-400';
    case '3rd':
      return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-400';
    case 'SF':
      return 'bg-gradient-to-r from-cyan-100 to-cyan-50 border-cyan-300';
    case 'QF':
      return 'bg-gradient-to-r from-teal-100 to-teal-50 border-teal-300';
    default: // R16
      return 'bg-gradient-to-r from-emerald-100 to-emerald-50 border-emerald-300';
  }
};


  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50">

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-16">
        <TabsNav
          tabs={['Teams', 'Groups', 'Fixtures', 'Results', 'Knockout']}
          active="Knockout"
          onSelect={(t) => {
            if (t === 'Knockout') return;
            if (t === 'Fixtures') navigate('/worldcup/fixtures');
            else navigate('/worldcup');
          }}
        />

        <h1 className="text-4xl font-extrabold text-indigo-900 mb-10">
          🏆 Knockout Stage
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="mt-4 text-gray-500">Loading knockout stage…</p>
          </div>
        ) : (
          Object.entries(rounds).map(([round, matches]) => (
            <section key={round} className="mb-14">
              <div
                className={`px-6 py-3 rounded-xl border mb-6 ${roundStyle(
                  round
                )}`}
              >
                <h2 className="text-2xl font-bold text-gray-800">{round}</h2>
              </div>

              <div className="grid gap-6">
                {matches.map((m) => (
<div
  key={m.id}
  className={`rounded-3xl border shadow-md px-6 py-6 ${roundStyle(round)}`}
>

                    <div className="flex justify-end mb-3">
                      <span className="px-4 py-1 text-sm rounded-full border border-emerald-300 bg-white/80 text-emerald-800 font-bold shadow-sm">
                        GW {m.gw}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-6">
                      {/* Team 1 */}
                      <div
                        className={`flex items-center gap-4 text-xl ${
m.winner === m.home
  ? 'font-extrabold text-emerald-900'
                            : 'text-gray-800'
                        }`}
                      >
                        {m.home?.iso2 && (
                          <img src={flag(m.home.iso2)} alt="" />
                        )}
                        <span>{m.home?.name || m.t1}</span>
                      </div>

                      {/* Score */}
                      <div className="text-center text-2xl font-extrabold">
                        {m.s1 !== null && m.s2 !== null ? (
                          <span className="px-6 py-2 rounded-lg bg-white/80">
                            {m.s1} – {m.s2}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>

                      {/* Team 2 Away */}
                      <div
                        className={`flex items-center gap-4 justify-end text-xl ${
                          m.winner === m.away
                            ? 'font-extrabold text-emerald-900'
                            : 'text-gray-800'
                        }`}
                      >
                        <span>{m.away?.name || m.t2}</span>
                        {m.away?.iso2 && (
                          <img src={flag(m.away.iso2)} alt="" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
