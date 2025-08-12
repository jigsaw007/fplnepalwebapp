import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import GroupStage from '../../components/worldcup/GroupStage';
import Fixtures from '../../components/worldcup/Fixtures';
import Results from '../../components/worldcup/Results';
import TabsNav from '../../components/worldcup/TabsNav';

const tabs = ['Teams', 'Groups', 'Fixtures', 'Results'];

export default function WorldCupIndex() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Groups');
  const navigate = useNavigate();

  const sheetUrl =
    'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509';

  useEffect(() => {
    const fetchTeams = async () => {
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

    fetchTeams();
  }, []);

  const handleTabClick = (tab) => {
    if (tab === 'Teams') {
      navigate('/worldcup/team'); // go to team page
    } else {
      setActiveTab(tab); // other tabs stay in this page
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-white to-blue-50 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 flex items-center gap-3 animate-pulse">
        <span role="img" aria-label="globe" className="text-4xl">🌍</span>
        <span>FPL Nepal World Cup 2025</span>
      </h1>

      <p className="text-center text-sm text-gray-700 max-w-lg px-2 mb-8">
        ⚽ Dive into the excitement of the FPL Nepal World Cup! Explore teams, view manager lineups, and follow every group battle on the road to glory.
      </p>

      <div className="w-full max-w-5xl">
        {/* Tabs via reusable component (adds “Full Team” automatically) */}
        <TabsNav
          tabs={tabs}
          active={activeTab}
          onSelect={handleTabClick}
        />

        {loading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-purple-600 border-solid"></div>
          </div>
        ) : (
          <>
            {activeTab === 'Groups' && <GroupStage teams={teams} />}
            {activeTab === 'Fixtures' && <Fixtures />}
            
            {activeTab === 'Results' && <Results />}
          </>
        )}
      </div>
    </div>
  );
}
