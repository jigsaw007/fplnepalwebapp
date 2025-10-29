import { useEffect, useState } from "react";
import Papa from "papaparse";
import TabsNav from "../../components/worldcup/TabsNav";

export default function TeamScores() {
  const [teams, setTeams] = useState([]);
  const [nationMap, setNationMap] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedGW, setSelectedGW] = useState(10);

  const TEAMS_CSV =
    "https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=0";
  const NATION_MAP_CSV =
    "https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509";

  // Fetch Google Sheet data
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

      // Group managers by nation
      const byNation = {};
      teamRows.forEach((row) => {
        const nation = String(row["Nation"]).trim();
        if (!byNation[nation]) byNation[nation] = [];
        byNation[nation].push(row["TeamID"]);
      });

      setTeams(byNation);
      setNationMap(nationRows);
    };

    load();
  }, []);

  // Fetch total GW points for a single FPL manager (via backend)
  const fetchGWPoints = async (teamId, gw) => {
    try {
      const res = await fetch(
        `/.netlify/functions/api/worldcup-teamscore/${teamId}/${gw}`
      );
      if (!res.ok) return 0;
      const data = await res.json();
      return data?.total_points || 0;
    } catch (e) {
      console.error("Error fetching GW points:", e);
      return 0;
    }
  };

  // Main function to fetch all nations
  const handleFetchScores = async () => {
    setLoading(true);
    setScores([]);
    setProgress(0);

    const entries = Object.entries(teams);
    const newScores = [];

    // Fetch 8 nations in parallel per batch
    const BATCH_SIZE = 8;
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async ([nationId, managerIds]) => {
          const pointsArray = await Promise.all(
            managerIds.map((id) => fetchGWPoints(id, selectedGW))
          );
          const total = pointsArray.reduce((a, b) => a + b, 0);

          const nationInfo =
            nationMap.find((n) => n["Slot Number"] === nationId) || {};
          const nationName = nationInfo["Nation"] || `Nation ${nationId}`;
          const iso2 = nationInfo["ISO2"]?.toLowerCase();

          return { nationId, nationName, iso2, total };
        })
      );

      newScores.push(...batchResults);
      setProgress((p) => p + batchResults.length);

      // small pause between batches
      await new Promise((r) => setTimeout(r, 400));
    }

    newScores.sort((a, b) => b.total - a.total);
    setScores(newScores);
    setLoading(false);
  };

  const flagUrl = (iso2) =>
    iso2 ? `https://flagcdn.com/w40/${iso2}.png` : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-orange-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <TabsNav
          tabs={["Teams", "Groups", "Fixtures", "Results", "Scores"]}
          active={"Scores"}
          onSelect={(tab) => {
            if (tab === "Scores") return;
            window.location.href = "/worldcup";
          }}
        />

        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-900 mb-4">
          🌍 World Cup Team Scores
        </h1>

        {/* Gameweek selector */}
        <div className="flex gap-4 items-center mb-6">
          <label className="text-sm text-gray-600">Select Gameweek:</label>
          <select
            value={selectedGW}
            onChange={(e) => setSelectedGW(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {Array.from({ length: 38 }, (_, i) => i + 1).map((gw) => (
              <option key={gw} value={gw}>
                {gw}
              </option>
            ))}
          </select>
          <button
            onClick={handleFetchScores}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch Scores"}
          </button>
        </div>

        {/* Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-700">
            <svg
              className="animate-spin h-10 w-10 text-orange-600 mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p className="text-base mb-1">
              Fetching Gameweek {selectedGW} data...
            </p>
            <p className="text-sm text-gray-600">
              {progress} / {Object.keys(teams).length} nations done
            </p>
          </div>
        )}

        {/* Results table */}
        {!loading && scores.length > 0 && (
          <div className="overflow-x-auto bg-white shadow rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Nation</th>
                  <th className="px-4 py-2 text-right">
                    GW {selectedGW} Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {scores.map((row, i) => (
                  <tr key={row.nationId} className="border-t">
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      {flagUrl(row.iso2) && (
                        <img
                          src={flagUrl(row.iso2)}
                          alt="flag"
                          className="h-4 w-6 rounded-sm border"
                        />
                      )}
                      <span>{row.nationName}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-orange-800">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
