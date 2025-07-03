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


export const fetchManagerInfo = async (entryId) => {
  try {
    const res = await fetch(`/api/entry/${entryId}/`);
    const data = await res.json();
    return {
      name: `${data.player_first_name} ${data.player_last_name}`,
      teamName: data.name,
    };
  } catch (error) {
    console.error("Error in fetchManagerInfo:", error);
    return null;
  }
};


