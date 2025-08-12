import { useNavigate } from 'react-router-dom';
import TabsNav from '../../components/worldcup/TabsNav';
import GroupStandings from '../../components/worldcup/GroupStandings';

const FIXTURES_CSV =
  'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=1414330140';
const NATION_MAP_CSV =
  'https://docs.google.com/spreadsheets/d/14BtHDo7vWtEZ2sPhgRE1ZyaCfJ8LcKMBKr0ejTUNtyQ/export?format=csv&gid=877590509';

export default function GroupsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
        <TabsNav
          tabs={['Teams', 'Groups', 'Fixtures']}
          active={'Groups'}
          onSelect={(tab) => {
            if (tab === 'Fixtures') navigate('/worldcup/fixtures');
            else navigate('/worldcup');
          }}
        />

        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-900">
            🏆 Group Stage — Live Tables
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            
          </p>
        </header>

        <GroupStandings
          fixturesCsv={FIXTURES_CSV}
          nationMapCsv={NATION_MAP_CSV}
        />
      </div>
    </div>
  );
}
