import axios from "axios";

// Determine the BASE_URL based on the environment
const isLocal = process.env.NODE_ENV === "development";
const BASE_URL = isLocal
  ? "http://localhost:8888/.netlify/functions/api" // ✅ Local development
  //: "https://fplnepaldashboard.netlify.app/.netlify/functions/api";  ✅ Netlify production
  : "https://webapp.fplnepal.com/.netlify/functions/api";

export const fetchFPLData = async () => {
  try {
    const response = await fetch(`${BASE_URL}/fpl-data`);
    if (!response.ok) throw new Error("Failed to fetch FPL data");
    return await response.json();
  } catch (error) {
    console.error("Error fetching FPL data:", error);
    return null;
  }
};

// Fetch Fixtures for a Specific Gameweek
export const fetchFixturesByGameweek = async (gameweek) => {
  try {
    const response = await fetch(`${BASE_URL}/fixtures?event=${gameweek}`);
    if (!response.ok) throw new Error("Failed to fetch fixtures");
    return await response.json();
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    return [];
  }
};

// Fetch Team Data (for Badges)
export const fetchTeamsData = async () => {
  try {
    const response = await fetch(`${BASE_URL}/teams`);
    if (!response.ok) throw new Error("Failed to fetch teams data");
    return await response.json();
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
};

// Transfer Data
export const fetchTransfersData = async () => {
  try {
    const response = await fetch(`${BASE_URL}/bootstrap-static`);
    if (!response.ok) throw new Error("Failed to fetch transfers data");

    const data = await response.json();
    return data.elements.map(player => ({
      id: player.id,
      web_name: player.web_name,
      team: player.team,
      element_type: player.element_type,
      transfers_in_event: player.transfers_in_event || 0,
      transfers_out_event: player.transfers_out_event || 0
    }));
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return [];
  }
};

// Injury News
export const fetchInjuryNews = async () => {
  try {
    const response = await fetch(`${BASE_URL}/injuries`);
    if (!response.ok) throw new Error("Failed to fetch injuries");
    return await response.json();
  } catch (error) {
    console.error("Error fetching injury news:", error);
    return [];
  }
};

// Classic League
export const fetchClassicLeague = async (leagueId, gameweek) => {
  try {
    const response = await fetch(`${BASE_URL}/classic-league/${leagueId}/${gameweek}`);
    if (!response.ok) throw new Error("Failed to fetch Classic League standings");
    return await response.json();
  } catch (error) {
    console.error("Error fetching Classic League standings:", error.message);
    return [];
  }
};

// History
export const fetchManagerHistory = async (managerId) => {
  try {
    const response = await fetch(`${BASE_URL}/manager-history/${managerId}`);
    if (!response.ok) throw new Error("Failed to fetch manager history");
    return await response.json();
  } catch (error) {
    console.error("Error fetching manager history:", error.message);
    return null;
  }
};

// Fetch All H2H League Standings at Once
export const fetchAllHeadToHeadStandings = async () => {
  try {
    const response = await fetch(`${BASE_URL}/h2h-league-all`);
    if (!response.ok) throw new Error("Failed to fetch all H2H league standings");
    return await response.json();
  } catch (error) {
    console.error("Error fetching all H2H league standings:", error.message);
    return {};
  }
};

// Fetch Dream Team for a Specific Gameweek
export const fetchDreamTeam = async (gameweek) => {
  try {
    const response = await fetch(`${BASE_URL}/dream-team/${gameweek}`);
    if (!response.ok) throw new Error("Failed to fetch dream team");
    return await response.json();
  } catch (error) {
    console.error("Error fetching dream team:", error);
    return null;
  }
};

// Tie Analyzer
export const fetchTieAnalyzer = async (teamId1, teamId2, gameweek) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tieanalyze?team_id1=${teamId1}&team_id2=${teamId2}&gameweek=${gameweek}`
    );
    if (!response.ok) throw new Error("Failed to fetch tie analyzer data");
    return await response.json();
  } catch (error) {
    console.error("Error fetching tie analyzer data:", error);
    return null;
  }
};

// Fetch the highest scorer for each H2H league for the given gameweek
export const fetchH2HTopScorer = async (gameweek) => {
  try {
    const response = await fetch(`${BASE_URL}/h2h-topscorer/${gameweek}`);
    if (!response.ok) throw new Error(`Failed to fetch H2H top scorers: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching H2H top scorers:", error.message);
    return {};
  }
};

// Fetch User History with Pagination Support
export const fetchUserHistory = async (teamId) => {
  try {
    const response = await fetch(`${BASE_URL}/user-history/${teamId}`);
    if (!response.ok) throw new Error(`Failed to fetch user history: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching user history:", error.message);
    return null;
  }
};

// Fetch Player Details
export const fetchPlayerDetails = async () => {
  try {
    console.log("Fetching player details...");
    const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
    
    if (!response.ok) {
      throw new Error("Failed to fetch player details");
    }

    const data = await response.json();
    console.log("Fetched Player Details Response:", data);

    return data.elements || [];
  } catch (error) {
    console.error("Error fetching player details:", error);
    return [];
  }
};

// ✅ Fetch Live Fixtures from Backend
export const fetchLiveFixtures = async () => {
  try {
    const response = await fetch(`${BASE_URL}/live-fixtures`);
    if (!response.ok) throw new Error("Failed to fetch live fixtures");
    return await response.json();
  } catch (error) {
    console.error("Error fetching live fixtures:", error);
    return null;
  }
};

//Live Score Details
export const fetchLiveMatchDetails = async (gameweek) => {
  try {
    console.log(`Fetching live match details for GW ${gameweek}`);
    const response = await fetch(`https://fantasy.premierleague.com/api/event/${gameweek}/live/`);
    if (!response.ok) throw new Error("Failed to fetch live match details");
    
    const data = await response.json();
    console.log("Live Match Details API Response:", data); // Debugging log
    return data;
  } catch (error) {
    console.error("Error fetching live match details:", error);
    return null;
  }
};

// Fetch Price Change Predictions with optional query parameters
export const fetchPriceChangePredictions = async (options = {}) => {
  try {
    const { type = "", page = 1, limit = 5 } = options; // Default to all, page 1, 5 items
    const queryParams = new URLSearchParams({
      type,
      page: page.toString(),
      limit: limit.toString(),
    }).toString();
    const url = `${BASE_URL}/price-change-prediction${queryParams ? `?${queryParams}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`Failed to fetch price change predictions: ${response.statusText}`);
    const data = await response.json();

    // If backend returns paginated data, adjust the return structure
    return Array.isArray(data) ? data : data.players || [];
  } catch (error) {
    console.error("Error fetching price change predictions:", error);
    return [];
  }
};

//versus
export const fetchVersusHistory = async (teamId1, teamId2, gameweek) => {
  try {
    const response = await fetch(
      `${BASE_URL}/versusHistory?team_id1=${teamId1}&team_id2=${teamId2}&gameweek=${gameweek}`
    );
    if (!response.ok) throw new Error("Failed to fetch versus history");
    return await response.json();
  } catch (error) {
    console.error("Error fetching versus history:", error);
    return null;
  }
};


export async function fetchManagerInfo(entryId) {
  try {
    const res = await fetch(`${BASE_URL}/user-history/${entryId}`);
    if (!res.ok) throw new Error(`manager-info fetch failed (${res.status})`);
    const data = await res.json();

    // Normalize to UI shape
    return {
      manager_name: (data?.name || "").trim(),     
      team_name: data?.team_name || "",            
    };
  } catch (e) {
    console.error("Error in fetchManagerInfo:", e);
    return null;
  }
}




export const fetchCaptainStandings = async (leagueId, mode) => {
  // mode: number|string  -> e.g., 1, 2, "overall"
  const res = await fetch(`${BASE_URL}/captain-standings/${leagueId}/${mode}`);
  if (!res.ok) throw new Error("Failed to fetch captain standings");
  return res.json(); // {mode:"gw"| "overall", gameweek?, standings:[...]}
};

export const fetchGwTop = async (leagueId, gameweek) => {
  const res = await fetch(`${BASE_URL}/gw-top/${leagueId}/${gameweek}`);
  if (!res.ok) throw new Error("Failed to fetch GW top scorers");
  return res.json(); // { gameweek, top3, others }
};



export const fetchMonthlyAvailable = async (year) => {
  try {
    const res = await fetch(`${BASE_URL}/monthly-available?year=${year}`);
    if (!res.ok) throw new Error("Failed to fetch available months");
    return await res.json(); // {year, months:[...]}
  } catch (e) {
    console.error("fetchMonthlyAvailable error:", e);
    return { year, months: [] };
  }
};

export const fetchMonthlyWinner = async (leagueId, year, month) => {
  try {
    const res = await fetch(`${BASE_URL}/monthly-winner/${leagueId}?year=${year}&month=${month}`);
    if (!res.ok) throw new Error("Failed to fetch monthly winner");
    return await res.json();
  } catch (e) {
    console.error("fetchMonthlyWinner error:", e);
    return null;
  }
};

export const fetchEliminationRules = async (gw) => {
  const url = gw ? `${BASE_URL}/elimination/rules?gw=${gw}` : `${BASE_URL}/elimination/rules`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("rules fetch failed");
  return r.json();
};
// src/pages/api/fplApi.js
export const upsertEliminationRule = async (gw, eliminate_count) => {
  const admin = localStorage.getItem("admin_key") || "";
  const r = await fetch(`${BASE_URL}/elimination/rules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": admin,                 // <— add this
    },
    body: JSON.stringify({ gw, eliminate_count }),
  });
  if (!r.ok) throw new Error("rule save failed");
  return r.json();
};

export const fetchEliminationCandidates = async (leagueId, gw, net = true) => {
  const r = await fetch(`${BASE_URL}/elimination/candidates/${leagueId}/${gw}?net=${net}`);
  if (!r.ok) throw new Error("candidates fetch failed"); return r.json();
};
export const confirmEliminations = async (gameweek, eliminations) => {
  const admin = localStorage.getItem("admin_key") || "";
  const res = await fetch(`${BASE_URL}/elimination/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": admin,
    },
    body: JSON.stringify({ gameweek, eliminations }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to confirm eliminations");
  try { return JSON.parse(text); } catch { return { ok: true }; }
};

export const fetchEliminatedSoFar = async (uptoGW) => {
  const url = typeof uptoGW === "number"
    ? `${BASE_URL}/elimination/eliminated?upto=${uptoGW}`
    : `${BASE_URL}/elimination/eliminated`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("eliminated fetch failed"); return r.json();
};
// Public endpoints: eliminated in a GW, and remaining after a GW
export const fetchEliminatedByGW = async (gw) => {
  const r = await fetch(`${BASE_URL}/elimination/public/eliminated/${gw}`);
  if (!r.ok) throw new Error("Failed to load eliminated");
  return r.json();
};

export const fetchRemainingAfterGW = async (leagueId, gw) => {
  const r = await fetch(`${BASE_URL}/elimination/public/remaining/${leagueId}/${gw}`);
  if (!r.ok) throw new Error("Failed to load remaining");
  return r.json();
};


export const adminPing = async () => {
  const admin = localStorage.getItem("admin_key") || "";
  const r = await fetch(`${BASE_URL}/elimination/admin/ping`, {
    headers: { "X-Admin-Token": admin },
  });
  return r.ok;
};

// FPLLIVE: compute final-like GW total after autosubs/bonus/hits
export const fetchFplLive = async (teamId, gw) => {
  const res = await fetch(`${BASE_URL}/fpl-live/${teamId}/${gw}`);
  if (!res.ok) throw new Error("Failed to fetch FPLLIVE");
  return res.json();
};

export async function fetchGwLive(gw) {
  const url = `https://fantasy.premierleague.com/api/event/${gw}/live/`;
  const res = await axios.get(url);
  return res.data; // contains elements[{id, stats}]
}


export const saveSquad = async (squad) => {
  const res = await fetch(`${BASE_URL}/squad`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(squad),
  });
  return await res.json();
};

export const fetchUserSquads = async (userId) => {
  const res = await fetch(`${BASE_URL}/squad/${userId}`);
  return await res.json();
};
