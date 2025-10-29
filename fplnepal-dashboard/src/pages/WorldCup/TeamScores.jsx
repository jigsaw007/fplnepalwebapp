import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import TabsNav from "../../components/worldcup/TabsNav";

export default function TeamScores() {
  const [teams, setTeams] = useState([]);
  const [nationMap, setNationMap] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedGW, setSelectedGW] = useState(10);
  const [expanded, setExpanded] = useState(null);

  const TEAMS_CSV =
    "https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=0";
  const NATION_MAP_CSV =
    "https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509";

  useEffect(() => {
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

    const load = async () => {
      const [teamRows, nationRows] = await Promise.all([
        fetchCsv(TEAMS_CSV),
        fetchCsv(NATION_MAP_CSV),
      ]);

      const byNation = {};
      teamRows.forEach((row) => {
        const nation = String(row["Nation"]).trim();
        if (!byNation[nation]) byNation[nation] = [];
        byNation[nation].push({
          id: row["TeamID"],
          name: row["Manager Name"] || `Manager ${row["TeamID"]}`,
        });
      });

      setTeams(byNation);
      setNationMap(nationRows);
    };

    load();
  }, []);

  const fetchGWPoints = async (teamId, gw) => {
    try {
      const res = await fetch(
        `/.netlify/functions/api/worldcup-teamscore/${teamId}/${gw}`
      );
      if (!res.ok) return 0;
      const data = await res.json();
      return data?.total_points || 0;
    } catch {
      return 0;
    }
  };

  const handleFetchScores = async () => {
    setLoading(true);
    setScores([]);
    setProgress(0);

    const entries = Object.entries(teams);
    const newScores = [];

    const BATCH_SIZE = 8;
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async ([nationId, managerList]) => {
          const results = await Promise.all(
            managerList.map(async (m) => {
              const pts = await fetchGWPoints(m.id, selectedGW);
              return { ...m, score: pts };
            })
          );

          const total = results.reduce((sum, m) => sum + m.score, 0);
          const nationInfo =
            nationMap.find((n) => n["Slot Number"] === nationId) || {};
          const nationName = nationInfo["Nation"] || `Nation ${nationId}`;
          const iso2 = nationInfo["ISO2"]?.toLowerCase();

          return { nationId, nationName, iso2, total, managers: results };
        })
      );

      newScores.push(...batchResults);
      setProgress((p) => p + batchResults.length);
      await new Promise((r) => setTimeout(r, 300));
    }

    newScores.sort((a, b) => b.total - a.total);
    setScores(newScores);
    setLoading(false);
  };

  const flagUrl = (iso2) =>
    iso2 ? `https://flagcdn.com/w80/${iso2}.png` : "";

  const toggleExpand = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <TabsNav
          tabs={["Teams", "Groups", "Fixtures", "Results", "Scores"]}
          active={"Scores"}
          onSelect={(tab) => {
            if (tab === "Scores") return;
            window.location.href = "/worldcup";
          }}
        />

        <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-800 mb-6 text-center">
          🌍 World Cup Gameweek {selectedGW} Scores
        </h1>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4 items-center mb-8 bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-sm">
          <label className="text-sm text-gray-600">Select Gameweek:</label>
          <select
            value={selectedGW}
            onChange={(e) => setSelectedGW(parseInt(e.target.value))}
            className="border border-purple-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-300"
          >
            {Array.from({ length: 38 }, (_, i) => i + 1).map((gw) => (
              <option key={gw} value={gw}>
                {gw}
              </option>
            ))}
          </select>
          <button
            onClick={handleFetchScores}
            className="bg-gradient-to-r from-orange-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-purple-700 transition-all"
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch Scores"}
          </button>
        </div>

        {/* Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-700">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="h-10 w-10 border-4 border-t-orange-500 border-purple-300 rounded-full mb-4"
            ></motion.div>
            <p className="text-base font-medium mb-1 text-purple-800">
              Fetching Gameweek {selectedGW} data...
            </p>
            <p className="text-sm text-gray-600">
              {progress} / {Object.keys(teams).length} nations done
            </p>
          </div>
        )}

        {/* Card Grid */}
        {!loading && scores.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scores.map((row, i) => (
              <motion.div
                key={row.nationId}
                layout
                whileHover={{ scale: 1.03 }}
                className={`relative bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
                  expanded === row.nationId ? "ring-2 ring-purple-300" : ""
                }`}
                onClick={() => toggleExpand(row.nationId)}
              >
                <div className="absolute top-2 right-3 text-gray-400 text-xs font-semibold">
                  #{i + 1}
                </div>
                <div className="p-5 flex flex-col items-center text-center">
                  {flagUrl(row.iso2) && (
                    <img
                      src={flagUrl(row.iso2)}
                      alt="flag"
                      className="h-10 w-auto rounded-md shadow-sm mb-3"
                    />
                  )}
                  <h3 className="font-bold text-gray-800 text-lg mb-1">
                    {row.nationName}
                  </h3>
                  <p className="text-3xl font-extrabold text-purple-700 mb-2">
                    {row.total}
                  </p>
                  <p className="text-xs text-gray-500">
                    Gameweek {selectedGW}
                  </p>
                </div>

                {/* Expandable manager list */}
                <AnimatePresence>
                  {expanded === row.nationId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="bg-gradient-to-br from-purple-50 to-orange-50 px-4 py-3 border-t border-purple-100"
                    >
                      <h4 className="text-sm font-semibold text-purple-700 mb-2 text-left">
                        Managers
                      </h4>
                      <div className="space-y-1">
                        {row.managers.map((m, idx) => (
                          <div
                            key={m.id}
                            className="flex justify-between text-sm bg-white rounded-lg px-3 py-1 border border-purple-100 shadow-sm"
                          >
                            <span className="text-gray-700">
                              {idx + 1}. {m.name}
                            </span>
                            <span className="font-semibold text-purple-700">
                              {m.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
