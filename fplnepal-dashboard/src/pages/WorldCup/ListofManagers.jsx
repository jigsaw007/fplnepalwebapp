import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { fetchUserHistory } from "../../api/fplApi";
import TabsNav from "../../components/worldcup/TabsNav";

export default function ListofManagers() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const mappingUrl =
    "https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509";
  const teamsUrl =
    "https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=0";

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
        setProgress(0);

        // ✅ Check cache
        const cached = localStorage.getItem("worldcup_managers_v1");
        if (cached) {
          setGroups(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const [nationMap, managerList] = await Promise.all([
          fetchCsv(mappingUrl),
          fetchCsv(teamsUrl),
        ]);

        const allManagers = managerList
          .map((m) => parseInt(m["TeamID"], 10))
          .filter(Boolean);

        // ✅ Batch fetch all manager histories
        const concurrency = 8;
        const managerCache = new Map();
        const results = [];

        const fetchInBatches = async () => {
          for (let i = 0; i < allManagers.length; i += concurrency) {
            const batch = allManagers.slice(i, i + concurrency);
            const fetched = await Promise.all(
              batch.map(async (id) => {
                if (managerCache.has(id)) return managerCache.get(id);
                try {
                  const res = await fetchUserHistory(id);
                  const obj = {
                    fpl_id: id,
                    name: res?.name || "Unknown Manager",
                    team_name: res?.team_name || "",
                  };
                  managerCache.set(id, obj);
                  return obj;
                } catch {
                  return { fpl_id: id, name: "Unknown Manager" };
                }
              })
            );
            results.push(...fetched);
            setProgress(((i + concurrency) / allManagers.length) * 100);
            await new Promise((r) => setTimeout(r, 200)); // slight delay for FPL rate limit
          }
        };

        await fetchInBatches();

        // ✅ Group results by nation
        const grouped = nationMap.map((row) => {
          const slot = String(row["Slot Number"]).trim();
          const nation = row["Nation"] || "Unknown";
          const iso2 = (row["ISO2"] || "").toLowerCase();
          const rowsForSlot = managerList.filter(
            (m) => String(m["Nation"]).trim() === slot
          );

          const managers = rowsForSlot
            .map((m) => {
              const teamId = parseInt(String(m["TeamID"]).trim(), 10);
              return results.find((r) => r.fpl_id === teamId);
            })
            .filter(Boolean);

          return { iso2, nation, slot, managers };
        });

        const sorted = grouped.sort((a, b) =>
          a.nation.localeCompare(b.nation)
        );

        if (!cancelled) {
          setGroups(sorted);
          setLoading(false);
          localStorage.setItem("worldcup_managers_v1", JSON.stringify(sorted));
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Failed to load managers. Please try again later.");
          setLoading(false);
        }
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
          tabs={["Teams", "Groups", "Fixtures", "Results"]}
          active="Full Team"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-300 border-t-purple-700"></div>
            <p className="text-purple-800 font-medium">
              Loading manager data... This may take a moment.
            </p>
            {progress > 0 && (
              <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-purple-700 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
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
                  <h2 className="text-lg font-bold text-purple-800">
                    {g.nation}
                  </h2>
                </header>

                {g.managers.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No managers assigned.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {g.managers.map((m) => (
                      <li
                        key={`${g.slot}-${m.fpl_id}`}
                        className="text-gray-800 text-sm border-b border-gray-100 pb-1"
                      >
                        <span className="font-medium">{m.name}</span>
                        {m.team_name && (
                          <span className="text-gray-500 text-xs block">
                            {m.team_name}
                          </span>
                        )}
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
