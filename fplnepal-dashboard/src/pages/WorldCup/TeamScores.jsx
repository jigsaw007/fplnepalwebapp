import { useEffect, useState } from "react";
import Papa from "papaparse";
import TabsNav from "../../components/worldcup/TabsNav";

export default function TeamScores() {
  const [teams, setTeams] = useState([]);
  const [nationMap, setNationMap] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const fetchGWPoints = async (teamId, gw) => {
    try {
      const res = await fetch(
        `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gw}/picks/`
      );
      if (!res.ok) return 0;
      const data = await res.json();
      return data.entry_history?.points || 0;
    } catch {
      return 0;
    }
  };

  const handleFetchScores = async () => {
    setLoading(true);
    const newScores = [];

    for (const [nationId, managerIds] of Object.entries(teams)) {
      let total = 0;
      for (const id of managerIds) {
        const pts = await fetchGWPoints(id, selectedGW);
        total += pts;
        await new Promise((r) => setTimeout(r, 600)); // delay to avoid rate limit
      }

      const nationInfo =
        nationMap.find((n) => n["Slot Number"] === nationId) || {};
      const nationName = nationInfo["Nation"] || `Nation ${nationId}`;
      const iso2 = nationInfo["ISO2"]?.toLowerCase();

      newScores.push({
        nationId,
        nationName,
        iso2,
        total,
      });
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
        <TabsNav
          tabs={["Teams", "Groups", "Fixtures", "Results", "Scores"]}
          active={"Scores"}
          onSelect={(tab) => {
            if (tab === "Scores") return;
            window.location.href = "/worldcup";
          }}
        />

        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-900 mb-4">
          🌍 Team Total Scores by Gameweek
        </h1>

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

        {loading && (
          <div className="text-center text-gray-600 py-10">
            Fetching scores... this may take a while ⏳
          </div>
        )}

        {!loading && scores.length > 0 && (
          <div className="overflow-x-auto bg-white shadow rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Nation</th>
                  <th className="px-4 py-2 text-right">GW {selectedGW} Points</th>
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
