import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import TabsNav from '../../components/worldcup/TabsNav';

export default function TeamLanding() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const sheetUrl =
    'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509';

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(sheetUrl);
      const text = await res.text();

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setTeams(results.data);
          setLoading(false);
        },
      });
    };

    fetchData();
  }, []);

  const getFlagUrl = (iso2) => {
    if (!iso2 || iso2.length !== 2) return null;
    return `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`;
  };

  const handleClick = (slot) => {
    navigate(`/worldcup/team/${slot}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 py-12 px-4">
      {/* Tabs at top */}
      <div className="w-full max-w-5xl mx-auto mb-6">
        <TabsNav
          tabs={['Teams', 'Groups', 'Fixtures','Results']}
          active="Teams"
          onSelect={(tab) => {
            if (tab === 'Teams') return; // stay here
            // send to index page which handles the other tabs
            navigate('/worldcup'); 
          }}
        />
      </div>

      <h1 className="text-4xl font-extrabold text-center mb-10 text-blue-900 drop-shadow-lg">
        🌍 World Cup Teams
      </h1>

      {loading ? (
        <div className="text-center text-gray-700">Loading teams...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {teams.map((team) => (
            <div
              key={team['Slot Number']}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer p-3 text-center hover:scale-105 transform"
              onClick={() => handleClick(team['Slot Number'])}
            >
              <div className="relative">
                <img
                  src={getFlagUrl(team['ISO2'])}
                  alt={team.Nation}
                  className="mx-auto w-20 h-14 rounded-md shadow-md"
                />
              </div>
              <div className="mt-3 text-lg font-semibold text-gray-800">
                {team.Nation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
