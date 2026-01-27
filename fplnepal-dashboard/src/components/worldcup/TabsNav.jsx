import { useNavigate } from 'react-router-dom';

export default function TabsNav({ tabs = [], active = '', onSelect }) {
  const navigate = useNavigate();

  // Ensure required tabs exist
  let allTabs = [...tabs];
  if (!allTabs.includes('Scores')) allTabs.push('Scores');
  if (!allTabs.includes('Full Team')) allTabs.push('Full Team');
  if (!allTabs.includes('Knockout')) allTabs.push('Knockout');

  const handleSelect = (tab) => {
    if (tab === 'Full Team') {
      navigate('/worldcup/list');           // Managers list
    } else if (tab === 'Fixtures') {
      navigate('/worldcup/fixtures');       // Fixtures
    } else if (tab === 'Results') {
      navigate('/worldcup/results');        // Results
    } else if (tab === 'Groups') {
      navigate('/worldcup/groups');         // Group tables
    } else if (tab === 'Scores') {
      navigate('/worldcup/scores');         // GW Scores
    } else if (tab === 'Knockout') {
      navigate('/worldcup/knockout');       // 🏆 Knockout stage
    } else {
      onSelect?.(tab);
    }
  };

  return (
    <div className="flex justify-center flex-wrap gap-4 mb-6">
      {allTabs.map((tab) => {
        const isActive = active === tab;

        return (
          <button
            key={tab}
            onClick={() => handleSelect(tab)}
            className={`px-4 py-2 rounded-xl font-semibold transition shadow-sm border ${
              isActive
                ? 'bg-gradient-to-r from-orange-500 to-purple-700 text-white border-purple-700 shadow-md'
                : 'bg-white text-purple-800 hover:bg-purple-100 border-purple-200'
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
