import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchFPLData } from "../api/fplApi";
import PlayerSelector from "../components/PlayerSelector";
import BudgetSelector from "../components/BudgetSelector";
import { useAuth } from "../context/AuthContext";



const MAX_PER_POSITION = { 1: 2, 2: 5, 3: 5, 4: 3 };
const MAX_PER_CLUB = 3;

export default function CreateSquad() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [squad, setSquad] = useState({ 1: [], 2: [], 3: [], 4: [] });
  const [budget, setBudget] = useState(100.0);
  const [budgetMode, setBudgetMode] = useState("default");
  const [customBudget, setCustomBudget] = useState(100.0);

  /* ========================= FETCH DATA ========================= */
  const { user, loading } = useAuth();

useEffect(() => {
  if (!loading && !user) {
    navigate("/login", { state: { redirectTo: "/create-squad" } });
  }
}, [loading, user, navigate]);
useEffect(() => {
  (async () => {
    setIsLoading(true);
    const data = await fetchFPLData();
    if (data) {
      setPlayers(data.elements || []);
      setTeams(data.teams || []);
    }
    setIsLoading(false);
  })();
}, []);


  useEffect(() => {
    setBudget(budgetMode === "unlimited" ? Infinity : customBudget);
  }, [budgetMode, customBudget]);

  /* ========================= DERIVED DATA ========================= */
  const teamsById = useMemo(() => {
    const m = {};
    teams.forEach(
      (t) =>
        (m[t.id] = {
          name: t.name,
          short_name: t.short_name,
          code: t.code,
        })
    );
    return m;
  }, [teams]);

  const selectedMap = useMemo(() => {
    const m = {};
    [1, 2, 3, 4].forEach((k) => squad[k].forEach((p) => (m[p.id] = true)));
    return m;
  }, [squad]);

  const clubCounts = useMemo(() => {
    const c = {};
    [1, 2, 3, 4].forEach((k) =>
      squad[k].forEach((p) => {
        c[p.team] = (c[p.team] || 0) + 1;
      })
    );
    return c;
  }, [squad]);

  const totalSelected = useMemo(
    () => [1, 2, 3, 4].reduce((acc, k) => acc + squad[k].length, 0),
    [squad]
  );

  /* ✅ Total Cost Calculation */
  const totalCost = useMemo(() => {
    let total = 0;
    [1, 2, 3, 4].forEach((k) =>
      squad[k].forEach((p) => (total += p.now_cost / 10))
    );
    return total;
  }, [squad]);

  const remainingBudget =
    budgetMode === "unlimited" ? Infinity : budget - totalCost;

  /* ========================= ADD / REMOVE ========================= */
  const canAdd = (p) => {
    const pos = p.element_type;
    const price = p.now_cost / 10;
    const count = clubCounts[p.team] || 0;

    if (squad[pos].length >= MAX_PER_POSITION[pos])
      return { ok: false, reason: "Max position reached" };
    if (budgetMode !== "unlimited" && totalCost + price > budget)
      return { ok: false, reason: "Exceeds budget" };
    if (count >= MAX_PER_CLUB)
      return { ok: false, reason: "Max 3 per club reached" };
    return { ok: true };
  };

  const addPlayer = (p) => {
    if (selectedMap[p.id]) return;
    const { ok, reason } = canAdd(p);
    if (!ok) return alert(reason);

    setSquad((prev) => ({
      ...prev,
      [p.element_type]: [...prev[p.element_type], p],
    }));
  };

  const removePlayer = (p) => {
    setSquad((prev) => ({
      ...prev,
      [p.element_type]: prev[p.element_type].filter((x) => x.id !== p.id),
    }));
  };

  /* ========================= AUTO FILL ========================= */
  const handleAutoFill = () => {
    if (!players.length) return alert("Player data not loaded yet!");
    const newSquad = { 1: [], 2: [], 3: [], 4: [] };
    const clubCounter = {};
    let currentCost = 0;

    const sorted = [...players]
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 200)
      .sort(() => Math.random() - 0.5);

    for (const p of sorted) {
      const pos = p.element_type;
      const price = p.now_cost / 10;
      const count = clubCounter[p.team] || 0;
      if (
        newSquad[pos].length < MAX_PER_POSITION[pos] &&
        (budgetMode === "unlimited" || currentCost + price <= budget) &&
        count < MAX_PER_CLUB
      ) {
        newSquad[pos].push(p);
        clubCounter[p.team] = count + 1;
        currentCost += price;
      }

      const total =
        newSquad[1].length +
        newSquad[2].length +
        newSquad[3].length +
        newSquad[4].length;
      if (total >= 15) break;
    }

    setSquad(newSquad);
  };

  /* ========================= NEXT STEP ========================= */
  const handleNext = () => {
    if (totalSelected !== 15)
      return alert("Please select exactly 15 players before continuing.");

    navigate("/set-team", {
      state: { squad, budget, budgetMode, totalCost },
    });
  };

  /* ========================= RENDER ========================= */
  if (isLoading) {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 text-sm">Loading Fantasy Premier League data...</p>
    </div>
  );
}
  return (
    <div className="p-3 sm:p-4 space-y-3">
      {/* Budget Options */}
      <BudgetSelector
        budgetMode={budgetMode}
        setBudgetMode={setBudgetMode}
        customBudget={customBudget}
        setCustomBudget={setCustomBudget}
      />

      {/* Summary */}
      <div className="flex flex-wrap justify-between items-center bg-white shadow-sm rounded-lg p-3 text-sm gap-2">
        <div className="flex flex-col sm:flex-row sm:gap-6">
          <span>
            Players:{" "}
            <b
              className={
                totalSelected === 15 ? "text-green-600" : "text-purple-700"
              }
            >
              {totalSelected}/15
            </b>
          </span>

          <span>
            Total Cost:{" "}
            <b className="text-indigo-700">£{totalCost.toFixed(1)}m</b>
          </span>

          {budgetMode !== "unlimited" && (
            <span>
              Remaining Budget:{" "}
              <b
                className={
                  remainingBudget >= 0 ? "text-green-600" : "text-rose-600"
                }
              >
                £{remainingBudget.toFixed(1)}m
              </b>
            </span>
          )}
        </div>

        <button
          onClick={handleAutoFill}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-md shadow-md"
        >
          ⚡ Auto Fill
        </button>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT */}
        <div className="lg:col-span-4">
          <PlayerSelector
            players={players}
            teamsById={teamsById}
            selectedMap={selectedMap}
            onSelect={addPlayer}
            onRemove={removePlayer}
          />
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-8 bg-gradient-to-b from-green-500 to-green-800 rounded-2xl shadow-inner py-6 relative overflow-hidden">
          <div className="text-center text-white font-semibold text-lg mb-4">
            Your Squad
          </div>

          <div className="flex flex-col items-center gap-8 text-center">
            <PositionRow
              title="GOALKEEPERS"
              players={squad[1]}
              max={2}
              onRemove={removePlayer}
              teamsById={teamsById}
            />
            <PositionRow
              title="DEFENDERS"
              players={squad[2]}
              max={5}
              onRemove={removePlayer}
              teamsById={teamsById}
            />
            <PositionRow
              title="MIDFIELDERS"
              players={squad[3]}
              max={5}
              onRemove={removePlayer}
              teamsById={teamsById}
            />
            <PositionRow
              title="FORWARDS"
              players={squad[4]}
              max={3}
              onRemove={removePlayer}
              teamsById={teamsById}
            />
          </div>

          {totalSelected === 15 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleNext}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md"
              >
                Next ➜
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------- SUB COMPONENTS ----------------- */
function PositionRow({ title, players, max, onRemove, teamsById }) {
  const placeholders = Array.from({ length: max - players.length });
  return (
    <div>
      <h3 className="text-white text-sm mb-2 tracking-wide">{title}</h3>
      <div className="flex justify-center flex-wrap gap-6">
        {players.map((p) => (
          <div
            key={p.id}
            className="relative group text-center"
            title={p.web_name}
          >
            <img
              src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.team_code}-220.webp`}
              alt={p.web_name}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full shadow-md ring-2 ring-white/40"
            />
            <div className="text-white text-xs mt-1 w-20 truncate mx-auto">
              {p.web_name}
            </div>
            <button
              onClick={() => onRemove(p)}
              className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[12px] opacity-0 group-hover:opacity-100 transition"
            >
              –
            </button>
          </div>
        ))}

        {placeholders.map((_, i) => (
          <div
            key={i}
            className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full border-2 border-white/30 text-white/50 text-lg font-light"
          >
            +
          </div>
        ))}
      </div>
    </div>
  );
}
