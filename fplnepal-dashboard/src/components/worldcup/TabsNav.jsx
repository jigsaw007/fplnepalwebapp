import { useNavigate } from 'react-router-dom';

export default function TabsNav({ tabs = [], active = '', onSelect }) {
  const navigate = useNavigate();

  // Ensure "Full Team" is included
  const allTabs = tabs.includes('Full Team') ? tabs : [...tabs, 'Full Team'];

  const handleSelect = (tab) => {
    if (tab === 'Full Team') {
      navigate('/worldcup/list');                // ListofManagers page
    } else if (tab === 'Fixtures') {
      navigate('/worldcup/fixtures');            // Fixtures page
    } else if (tab === 'Results') {
      navigate('/worldcup/results');             // Results page (optional)
    } else if (tab === 'Groups') {
      navigate('/worldcup/groups');              // NEW: Groups page with live tables
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
                ? 'bg-purple-700 text-white border-purple-700'
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
