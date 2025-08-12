import { useEffect, useState } from 'react';
import Papa from 'papaparse';

export default function AllManagers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // CSV URLs
  const managersUrl =
    'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=0';
  const mappingUrl =
    'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509';

  useEffect(() => {
    const fetchCsv = (url) =>
      fetch(url)
        .then((res) => res.text())
        .then(
          (csv) =>
            new Promise((resolve) => {
              Papa.parse(csv, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
              });
            })
        );

    const loadData = async () => {
      try {
        const [mappingRows, managerRows] = await Promise.all([
          fetchCsv(mappingUrl),
          fetchCsv(managersUrl),
        ]);

        // Create mapping object from slot to nation
        const slotToNation = mappingRows.reduce((acc, row) => {
          acc[row['Slot Number']] = row['Nation'];
          return acc;
        }, {});

        // Merge the nation name into each manager row
        const merged = managerRows.map((row) => ({
          manager: row['Manager Name'],
          teamId: row['Team ID'],
          slot: row['Nation'],
          nation: slotToNation[row['Nation']] || 'Unassigned',
        }));

        setData(merged);
      } catch (err) {
        console.error('Failed to fetch or process CSV:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin h-10 w-10 border-4 border-purple-600 rounded-full mx-auto mb-3"></div>
        Loading manager data...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">🌍 All Managers with Nations</h2>
      <table className="w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Manager Name</th>
            <th className="border px-4 py-2">Team ID</th>
            <th className="border px-4 py-2">Slot</th>
            <th className="border px-4 py-2">Nation</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{row.manager}</td>
              <td className="border px-4 py-2">{row.teamId}</td>
              <td className="border px-4 py-2">{row.slot}</td>
              <td className="border px-4 py-2">{row.nation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
