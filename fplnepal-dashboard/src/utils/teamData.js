// ✅ Player Position Mapping
export const POSITIONS = {
    1: "GKP",   // Goalkeeper
    2: "DEF",   // Defender
    3: "MID",   // Midfielder
    4: "FWD",   // Forward
  };
  
  // ✅ Team ID to Club Short Name Mapping
  export const TEAM_SHORT_NAMES = {
    1: "ARS",  2: "AVL",  3: "BOU",  4: "BRE",  5: "BHA",
    6: "CHE",  7: "CRY",  8: "EVE",  9: "FUL",  10: "IPS",
    11: "LEI", 12: "LIV", 13: "MCI", 14: "MUN", 15: "NEW",
    16: "NFO", 17: "SOU", 18: "TOT", 19: "WHU", 20: "WOL"
  };
  
  // ✅ Manually Map Team IDs to Correct Kit IDs (2024-25 Season)
  export const TEAM_KIT_MAP = {
    1: 3, 2: 7, 3: 91, 4: 94, 5: 36, 6: 8, 7: 31, 8: 11, 9: 54, 10: 40,
    11: 13, 12: 14, 13: 43, 14: 1, 15: 4, 16: 17, 17: 20, 18: 6, 19: 21, 20: 39
  };
  
  // ✅ Function to Get Team Kit URL (with `_1` for GKP)
export const getTeamKit = (teamId, position) => {
  const kitId = TEAM_KIT_MAP[teamId] || teamId;
  const kitSuffix = position === "GKP" ? "_1" : ""; // ✅ goalkeepers
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${kitId}${kitSuffix}-220.webp`;
};
