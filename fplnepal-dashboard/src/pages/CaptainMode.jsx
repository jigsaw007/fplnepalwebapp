import { useEffect, useMemo, useState } from "react";
import { fetchFPLData, fetchCaptainStandings } from "../api/fplApi";

const LEAGUE_ID = 235907;

export default function CaptainMode() {
  const [events, setEvents] = useState([]);
  const [mode, setMode] = useState("overall"); // "overall" | number
  const [loading, setLoading] = useState(false);
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchFPLData();
      const evs = (data?.events || []).map((e) => ({
        id: e.id,
        name: e.name,
        deadline: new Date(e.deadline_time),
        finished: !!e.finished,
      }));
      setEvents(evs);

      // default to "overall", but if you prefer latest finished GW instead:
      // const now = new Date();
      // const latest = evs.filter(e=>e.deadline<=now || e.finished).sort((a,b)=>b.id-a.id)[0]?.id ?? 1;
      // setMode(latest);
    };
    load();
  }, []);

  const handleFetch = async (m) => {
    setLoading(true);
    const data = await fetchCaptainStandings(LEAGUE_ID, m);
    setStandings(data?.standings || []);
    setLoading(false);
  };

  useEffect(() => {
    if (mode) handleFetch(mode);
    // eslint-disable-next-line
  }, [mode]);

  const gwOptions = useMemo(
    () => events.map((e) => (
      <option key={e.id} value={e.id}>
        {e.name}
      </option>
    )),
    [events]
  );

  const isOverall = String(mode) === "overall";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          FPL NEPAL CAPTAIN MODE Standing
        </h1>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">View</label>
          <select
            className="border rounded-xl px-3 py-2 shadow-sm focus:outline-none"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="overall">Overall</option>
            {gwOptions}
          </select>
          <button
            onClick={() => handleFetch(mode)}
            className="px-4 py-2 rounded-xl border shadow-sm hover:shadow-md transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Container */}
      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-700">Loading standings…</div>
        ) : standings.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No data yet. Try another view.</div>
        ) : (
          <>
            {/* Mobile: Card list */}
            <ul className="md:hidden divide-y divide-gray-100">
              {standings.map((row) => {
                const leader = row.rank === 1;
                const tc = !isOverall && row.multiplier === 3;
                return (
                  <li
                    key={`m-${row.manager_id}`}
                    className={[
                      "p-4",
                      leader ? "relative bg-amber-50/80 ring-1 ring-amber-200" : "bg-white",
                    ].join(" ")}
                  >
                    {leader && <div className="absolute inset-y-0 left-0 w-1 bg-amber-400" />}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "shrink-0 h-9 w-9 rounded-full grid place-items-center font-extrabold",
                            leader ? "bg-amber-200 text-amber-900 ring-1 ring-amber-300" : "bg-gray-100 text-gray-800",
                          ].join(" ")}
                          title={`Rank ${row.rank}`}
                        >
                          {row.rank}
                        </div>
                        <div>
                          <div className="font-semibold leading-tight">{row.manager_name}</div>
                          <div className="text-xs text-gray-600">{row.team_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{isOverall ? "Total Captain Pts" : "Captain Pts"}</div>
                        <div className="text-base font-semibold">{row.captain_points}</div>
                      </div>
                    </div>

                    {!isOverall && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Captain:</span>
                        <span className="text-sm font-medium">{row.captain_name}</span>
                        {tc && (
                          <span
                            title="Triple Captain"
                            className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                          >
                            3×
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="py-3 pl-5 pr-4 font-semibold text-gray-700">Rank</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Manager</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Team</th>
                    {!isOverall && <th className="py-3 px-4 font-semibold text-gray-700">Captain</th>}
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      {isOverall ? "Total Captain Pts" : "Captain Pts"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {standings.map((row, idx) => {
                    const leader = row.rank === 1;
                    const tc = !isOverall && row.multiplier === 3;
                    const rowClass = leader
                      ? "bg-amber-50/80 ring-1 ring-amber-200"
                      : idx % 2 === 0
                      ? "bg-white"
                      : "bg-gray-50";

                    return (
                      <tr key={row.manager_id} className={rowClass}>
                        <td className={`py-3 pl-5 pr-4 font-extrabold ${leader ? "border-l-4 border-amber-400" : ""}`}>
                          {row.rank}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{row.manager_name}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{row.team_name}</td>

                        {!isOverall && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{row.captain_name}</span>
                              {tc && (
                                <span
                                  title="Triple Captain"
                                  className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                                >
                                  3×
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        <td className="py-3 px-4 font-semibold">{row.captain_points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Captain Mode ranks managers by captain-only points. Per GW = captain’s points × (2× normal, 3× with Triple Captain).
        Overall = sum across all finished gameweeks.
      </p>
    </div>
  );
}
