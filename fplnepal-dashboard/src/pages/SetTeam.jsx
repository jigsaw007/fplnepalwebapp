import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"; // ✅ Added useLocation
import { supabase } from "../supabaseClient";
import { fetchFPLData, fetchFixturesByGameweek } from "../api/fplApi";
import { ArrowLeftRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MySquadsList from "../components/MySquadsList";


/* ---------- Utilities ---------- */
function groupByPosition(list) {
  const g = { GKP: [], DEF: [], MID: [], FWD: [] };
  (list || []).forEach((p) => {
    if (p.element_type === 1) g.GKP.push(p);
    else if (p.element_type === 2) g.DEF.push(p);
    else if (p.element_type === 3) g.MID.push(p);
    else if (p.element_type === 4) g.FWD.push(p);
  });
  return g;
}

function isValidFormation(players) {
  const g = groupByPosition(players);
  return (
    g.GKP.length === 1 &&
    g.DEF.length >= 3 &&
    g.MID.length >= 2 &&
    g.FWD.length >= 1 &&
    players.length === 11
  );
}

function getFormation(players) {
  const g = groupByPosition(players);
  return `${g.DEF.length}-${g.MID.length}-${g.FWD.length}`;
}

/* ---------- Main ---------- */
export default function SetTeam() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation(); // ✅ NEW
  const squadId = searchParams.get("squad");
  const { user, loading } = useAuth();

  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [startingXI, setStartingXI] = useState([]);
  const [bench, setBench] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceCaptainId, setViceCaptainId] = useState(null);
  const [swap, setSwap] = useState({ first: null, valid: [] });
  const [squadName, setSquadName] = useState("");
  const [saving, setSaving] = useState(false);
  const [totalCost, setTotalCost] = useState("0.0");
  const [readonly, setReadonly] = useState(false);
  const [budget, setBudget] = useState(null); // ✅ NEW
  const [budgetMode, setBudgetMode] = useState("default"); // ✅ NEW
    const [activeChip, setActiveChip] = useState(null); // "TC" | "BB" | null

  /* ---------- Auth redirect for create ---------- */
  useEffect(() => {
    if (!loading && !user && !squadId && !location.state) navigate("/login");
  }, [loading, user, navigate, squadId, location.state]);

  /* ---------- Fetch bootstrap + fixtures ---------- */
  useEffect(() => {
    (async () => {
      const data = await fetchFPLData();
      if (data?.teams) setTeams(data.teams);
      const gw = data?.events?.find((e) => !e.finished && !e.is_previous)?.id || 1;
      const fix = await fetchFixturesByGameweek(gw);
      setFixtures(fix || []);
    })();
  }, []);

  /* ---------- Load Squad ---------- */
  useEffect(() => {
    const loadSquad = async () => {
      if (squadId) {
        // ✅ Existing saved squad (DB)
        const { data, error } = await supabase
          .from("squads")
          .select("*")
          .eq("id", squadId)
          .single();

        if (error || !data) {
          alert("❌ Squad not found!");
          return;
        }

        const parsedPlayers =
          typeof data.players === "string" ? JSON.parse(data.players) : data.players;
        const parsedBench =
          typeof data.bench === "string" ? JSON.parse(data.bench) : data.bench;

        setStartingXI(parsedPlayers || []);
        setBench(parsedBench || []);
        setCaptainId(data.captain_id ?? null);
        setViceCaptainId(data.vice_captain_id ?? null);
        setSquadName(data.squad_name || "");
        setTotalCost((data.budget || 0).toFixed(1));
        setActiveChip(data.active_chip || null);
        if (!user || user.id !== data.user_id) setReadonly(true);
      } else if (location.state?.squad) {
        // ✅ Squad from CreateSquad page
        const { squad, budget, budgetMode, totalCost } = location.state;
        setBudget(budget);
        setBudgetMode(budgetMode);
        setTotalCost(totalCost?.toFixed(1) || "0.0");

        const flat = Object.values(squad).flat();
        const grouped = groupByPosition(flat);
        const starters = [
          ...grouped.GKP.slice(0, 1),
          ...grouped.DEF.slice(0, 4),
          ...grouped.MID.slice(0, 4),
          ...grouped.FWD.slice(0, 2),
        ];
        const starterIds = new Set(starters.map((p) => p.id));
        const benchPlayers = flat.filter((p) => !starterIds.has(p.id));
        setStartingXI(starters);
        setBench(benchPlayers);
      } else {
        // ✅ fallback to localStorage
        const local = localStorage.getItem("draftSquad");
        if (!local) return navigate("/create-squad");

        const { squad } = JSON.parse(local);
        const flat = Array.isArray(squad) ? squad.flat() : Object.values(squad).flat();
        const grouped = groupByPosition(flat);
        const starters = [
          ...grouped.GKP.slice(0, 1),
          ...grouped.DEF.slice(0, 4),
          ...grouped.MID.slice(0, 4),
          ...grouped.FWD.slice(0, 2),
        ];
        const starterIds = new Set(starters.map((p) => p.id));
        const benchPlayers = flat.filter((p) => !starterIds.has(p.id));
        setStartingXI(starters);
        setBench(benchPlayers);
        const total = flat.reduce((sum, p) => sum + (p.now_cost || 0) / 10, 0);
        setTotalCost(total.toFixed(1));
      }
    };
    loadSquad();
  }, [squadId, navigate, user, location.state]);

  /* ---------- Helpers ---------- */
  const getFixtureInfo = (teamId) => {
    const f = fixtures.find((x) => x.team_h === teamId || x.team_a === teamId);
    if (!f) return { difficulty: 3, home: true };
    const home = f.team_h === teamId;
    return { difficulty: home ? f.team_h_difficulty : f.team_a_difficulty, home };
  };

  /* ---------- Predicted Points ---------- */
  const calcPredPoints = (p) => {
    const form = parseFloat(p.form || "0");
    const ppg = parseFloat(p.points_per_game || "0");
    const chance = p.chance_of_playing_next_round ?? 100;
    const { difficulty, home } = getFixtureInfo(p.team);
    const homeFactor = home ? 1.05 : 0.95;
    const diffFactor = (5 - difficulty) / 4;
    const base = form * 0.6 + ppg * 0.4;
    return base * (chance / 100) * homeFactor * diffFactor;
  };

const predictedPoints = useMemo(() => {
  let total = startingXI.reduce((sum, p) => {
    let pts = calcPredPoints(p);
    if (p.id === captainId) {
      pts *= activeChip === "TC" ? 3 : 2; // ✅ Triple Captain
    }
    return sum + pts;
  }, 0);

  if (activeChip === "BB" && bench.length > 0) {
    const benchPts = bench.reduce((sum, p) => sum + calcPredPoints(p), 0);
    total += benchPts; // ✅ Bench Boost adds bench points
  }

  return Math.round(total);
}, [startingXI, bench, fixtures, captainId, activeChip]);



  /* ---------- Captain / Vice ---------- */
  const handleSetCaptain = (id) => {
    if (readonly) return;
    if (viceCaptainId === id) setViceCaptainId(null);
    setCaptainId((prev) => (prev === id ? null : id));
  };
  const handleSetVice = (id) => {
    if (readonly) return;
    if (captainId === id) setCaptainId(null);
    setViceCaptainId((prev) => (prev === id ? null : id));
  };

  /* ---------- Swap Logic ---------- */
  const getAllPlayers = () => [...startingXI, ...bench];
  const getValidSwapTargets = (player, from) => {
    const all = getAllPlayers();
    const valid = [];
    all.forEach((target) => {
      if (target.id === player.id) return;
      const s = [...startingXI];
      const b = [...bench];
      const firstInStart = from === "start";
      const iStart = s.findIndex((p) =>
        firstInStart ? p.id === player.id : p.id === target.id
      );
      const iBench = b.findIndex((p) =>
        firstInStart ? p.id === target.id : p.id === player.id
      );
      if (iStart === -1 || iBench === -1) return;
      const newS = [...s];
      const newB = [...b];
      if (firstInStart) {
        newS[iStart] = target;
        newB[iBench] = player;
      } else {
        newS[iStart] = player;
        newB[iBench] = target;
      }
      if (isValidFormation(newS)) valid.push(target.id);
    });
    return valid;
  };

  const startSwap = (player, from) => {
    if (readonly) return;
    if (swap.first?.player?.id === player.id) {
      setSwap({ first: null, valid: [] });
      return;
    }
    const valid = getValidSwapTargets(player, from);
    setSwap({ first: { player, from }, valid });
  };

  const handleSelect = (player, from) => {
    if (readonly) return;
    if (!swap.first) return;
    if (!swap.valid.includes(player.id)) return;
    const first = swap.first.player;
    const second = player;
    const s = [...startingXI];
    const b = [...bench];
    const firstStart = swap.first.from === "start";
    const iStart = s.findIndex((p) =>
      firstStart ? p.id === first.id : p.id === second.id
    );
    const iBench = b.findIndex((p) =>
      firstStart ? p.id === second.id : p.id === first.id
    );
    if (firstStart) {
      s[iStart] = second;
      b[iBench] = first;
    } else {
      s[iStart] = first;
      b[iBench] = second;
    }
    if (!isValidFormation(s)) {
      alert("❌ Invalid formation.");
      return setSwap({ first: null, valid: [] });
    }
    setStartingXI(s);
    setBench(b);
    setSwap({ first: null, valid: [] });
  };

  /* ---------- Save Squad ---------- */
  const handleSave = async () => {
    if (readonly) return alert("👀 Read-only mode. You cannot edit this squad.");
    if (!user) return navigate("/login");
    if (!squadName.trim()) return alert("Please enter a squad name!");
    if (!captainId) return alert("Please select a Captain before saving!");
    if (!viceCaptainId) return alert("Please select a Vice Captain!");
    if (captainId === viceCaptainId)
      return alert("Captain and Vice Captain cannot be the same!");

const budget = [...startingXI, ...bench].reduce(
  (sum, p) => sum + (p.now_cost || 0) / 10,
  0
);
setTotalCost(budget.toFixed(1));
setSaving(true);

const { data, error } = await supabase
  .from("squads")
  .upsert({
    id: squadId ? Number(squadId) : undefined,
    user_id: user.id,
    squad_name: squadName.trim(),
    players: startingXI,
    bench,
    captain_id: captainId,
    vice_captain_id: viceCaptainId,
    budget, // ✅ use this directly instead of budgetValue
    active_chip: activeChip, // ✅ chip saved safely
  })
  .select("id")
  .single();



    setSaving(false);
    if (error) return alert("❌ " + error.message);

    const shareUrl = `${window.location.origin}/set-team?squad=${data.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(`✅ Squad saved & URL copied!\n${shareUrl}`);
    } catch {
      alert(`✅ Squad saved!\nShare URL:\n${shareUrl}`);
    }
  };

  const gStart = groupByPosition(startingXI);
  const formation = getFormation(startingXI);

return (
  <div className="p-3">
{/* Read-only banner inside layout */}
{readonly && (
  <div className="w-full bg-yellow-100 text-yellow-800 text-center text-sm py-2 font-medium rounded-md shadow-sm mb-3">
    <b>FPL NEPAL SQUAD PLANNER</b> · Make your FPL PLANNER at{" "}
    <a
      href="https://webapp.fplnepal.com/create-squad"
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-800 font-semibold underline hover:text-purple-900"
    >
      FPL NEPAL WEBAPP
    </a>
  </div>
)}

    <div className="flex flex-col lg:flex-row gap-3">
      {/* LEFT PANEL */}
      <div className="lg:w-1/3 bg-purple-900/90 text-white p-4 rounded-2xl shadow-md flex flex-col justify-between space-y-4">
        <div>
          {user && (
            <p className="text-xs text-gray-300 italic mb-2">
              Logged in as: {user.email}
            </p>
          )}
          <div className="mb-3">
            <label className="text-sm block mb-1 text-gray-200">Squad Name</label>
            <input
              type="text"
              placeholder="Enter squad name"
              value={squadName}
              disabled={readonly}
              onChange={(e) => setSquadName(e.target.value)}
              className="w-full text-black rounded-md p-1 text-sm disabled:opacity-60"
            />
          </div>

<h2 className="text-lg font-semibold mb-2">💫 Team Summary</h2>
<p className="text-base mb-1">
  🔮 <b>Predicted GW Points:</b>{" "}
  <span className="text-yellow-300 text-3xl font-bold animate-pulse">
    {predictedPoints}
  </span>
</p>

{/* ==================== CHIPS ==================== */}
{!readonly && (
  <div className="mt-2 mb-3">
    <p className="text-sm font-semibold mb-1">🎯 Active Chip</p>
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() =>
          setActiveChip((prev) => (prev === "TC" ? null : "TC"))
        }
        className={`px-3 py-1 text-xs rounded-md font-semibold ${
          activeChip === "TC"
            ? "bg-yellow-400 text-black"
            : "bg-white/20 hover:bg-white/30"
        }`}
      >
        🧢 Triple Captain
      </button>
      <button
        onClick={() =>
          setActiveChip((prev) => (prev === "BB" ? null : "BB"))
        }
        className={`px-3 py-1 text-xs rounded-md font-semibold ${
          activeChip === "BB"
            ? "bg-green-400 text-black"
            : "bg-white/20 hover:bg-white/30"
        }`}
      >
        🪄 Bench Boost
      </button>
    </div>
  </div>
)}

{/* =============================================== */}

<p className="text-sm mb-1">🧩 Formation: {formation}</p>
<p className="text-sm mb-1">
  👑 Captain:{" "}
  {startingXI.find((p) => p.id === captainId)?.web_name || "—"}
</p>
<p className="text-sm mb-1">
  🪶 Vice:{" "}
  {startingXI.find((p) => p.id === viceCaptainId)?.web_name || "—"}
</p>
<p className="text-sm mt-2">
  💰 <b>Total Squad Cost:</b> £{totalCost}m
</p>


          {/* ✅ MySquadsList under summary */}
          <div className="mt-4">
            <MySquadsList />
          </div>
        </div>

        {!readonly && (
          <div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full py-1.5 rounded-lg font-semibold disabled:opacity-60 text-sm"
            >
              {saving ? "Saving..." : "💾 Save & Share Squad"}
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="relative lg:w-2/3 bg-gradient-to-b from-[#00a650] to-[#014d26] rounded-2xl py-4 px-1 overflow-hidden">
        {/* Watermark Text (Top Right) */}
        <div className="absolute top-3 right-5 text-right select-none pointer-events-none z-0">
          <h1 className="text-white/10 text-4xl font-extrabold leading-tight tracking-widest">
            FPL&nbsp;NEPAL
          </h1>
          <h2 className="text-white/10 text-sm font-semibold tracking-[0.3em]">
            SQUAD&nbsp;PLANNER
          </h2>
        </div>

        {["GKP", "DEF", "MID", "FWD"].map((pos) => (
          <PitchRow
            key={pos}
            players={gStart[pos]}
            from="start"
            swap={swap}
            onSelect={handleSelect}
            onStartSwap={startSwap}
            captainId={captainId}
            viceCaptainId={viceCaptainId}
            onSetCaptain={handleSetCaptain}
            onSetVice={handleSetVice}
            teams={teams}
            fixtures={fixtures}
            readonly={readonly}
          />
        ))}

        {/* Bench */}
        <div className="border-t border-white/30 mt-4 pt-2">
          <h4 className="text-white text-center text-xs mb-1">BENCH</h4>
          <div className="flex justify-center flex-wrap gap-3">
            {bench.map((p, i) => (
              <PlayerCard
                key={p.id}
                player={p}
                from="bench"
                index={i + 1}
                onSelect={handleSelect}
                onStartSwap={startSwap}
                teams={teams}
                fixtures={fixtures}
                swap={swap}
                captainId={captainId}
                viceCaptainId={viceCaptainId}
                onSetCaptain={handleSetCaptain}
                onSetVice={handleSetVice}
                isBench
                readonly={readonly}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

}

/* ---------- Pitch Row ---------- */
function PitchRow({ players, ...props }) {
  if (!players?.length) return null;
  return (
    <div className="flex justify-center gap-4 mb-6 flex-wrap">
      {players.map((p) => (
        <PlayerCard key={p.id} player={p} {...props} />
      ))}
    </div>
  );
}

/* ---------- Player Card ---------- */
function PlayerCard({
  player,
  from,
  onSelect,
  onStartSwap,
  onSetCaptain,
  onSetVice,
  captainId,
  viceCaptainId,
  isBench = false,
  swap,
  teams,
  fixtures,
  readonly,
}) {
  const team = teams.find((t) => t.id === player.team);
  const fixture = fixtures.find(
    (f) => f.team_h === player.team || f.team_a === player.team
  );
  const oppTeam = fixture
    ? teams.find((t) =>
        fixture.team_h === player.team ? t.id === fixture.team_a : t.id === fixture.team_h
      )
    : null;
  const isHome = fixture?.team_h === player.team;
  const opp = oppTeam ? `${oppTeam.short_name} ${isHome ? "(H)" : "(A)"}` : "";

  const isSelected = swap.first?.player?.id === player.id;
  const isValidTarget = swap.valid.includes(player.id);
  const isCaptain = captainId === player.id;
  const isVice = viceCaptainId === player.id;

  return (
    <div className="relative text-center transition-all">
      <motion.img
        src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${team?.code}-220.webp`}
        alt={player.web_name}
        className={`mx-auto ${
          isBench ? "w-[60px] h-[60px]" : "w-[80px] h-[80px]"
        } ${isSelected ? "ring-4 ring-yellow-400" : ""}`}
      />

      {/* Captain & Vice Badges */}
      {isCaptain && (
        <div className="absolute top-0 left-0 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded-br">
          C
        </div>
      )}
      {isVice && (
        <div className="absolute top-0 right-0 bg-gray-300 text-black text-[9px] font-bold px-1 rounded-bl">
          VC
        </div>
      )}

      <div className="bg-[#37003c] text-white text-[10px] font-semibold py-[1px] truncate w-[80px] mx-auto rounded-b-sm">
        {player.web_name}
      </div>
      <div className="bg-[#242424] text-[9px] text-gray-200 py-[1px] w-[80px] mx-auto">
        {opp}
      </div>

      {!readonly && (
        <>
          <div className="flex justify-center gap-1 mt-1">
            <button
              onClick={() => onSetCaptain(player.id)}
              className={`px-1.5 py-[1px] text-[9px] rounded ${
                isCaptain ? "bg-yellow-400 text-black font-bold" : "bg-white/80 text-black"
              }`}
            >
              C
            </button>
            <button
              onClick={() => onSetVice(player.id)}
              className={`px-1.5 py-[1px] text-[9px] rounded ${
                isVice ? "bg-gray-300 text-black font-bold" : "bg-white/80 text-black"
              }`}
            >
              VC
            </button>
          </div>

          {/* Swap */}
          <button
            onClick={() => {
              if (swap.first) {
                if (isValidTarget) onSelect(player, from);
              } else {
                onStartSwap(player, from);
              }
            }}
            className={`absolute top-1 right-1 p-[2px] rounded-full shadow ${
              isSelected
                ? "bg-yellow-400 text-black"
                : isValidTarget
                ? "bg-green-500 text-white"
                : "bg-white/80 text-purple-800"
            }`}
            title="Swap"
          >
            <ArrowLeftRight size={12} />
          </button>
        </>
      )}
    </div>
  );
}
