import { useEffect, useState } from "react";
 import { fetchDreamTeam, fetchFPLData } from "../api/fplApi";
 import { POSITIONS, TEAM_SHORT_NAMES } from "../utils/teamData";
import "./dreamteam.css";

const DreamTeam = () => {
  const [gameweek, setGameweek] = useState(null);
  const [dreamTeam, setDreamTeam] = useState([]);
  const [playersData, setPlayersData] = useState([]);
  const [teamsData, setTeamsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentGameweek, setCurrentGameweek] = useState(null);

  useEffect(() => {
    const getFPLData = async () => {
      setLoading(true);
      const fplData = await fetchFPLData();
      if (fplData) {
        setPlayersData(fplData.elements);
        setTeamsData(fplData.teams);
        const latestGW = fplData.events.find(e => e.is_current)?.id || 28;
        setCurrentGameweek(latestGW);
        if (gameweek === null) setGameweek(latestGW);
      }
      setLoading(false);
    };
    getFPLData();
  }, []);

  useEffect(() => {
    if (gameweek !== null) {
      fetchDreamTeamData(gameweek);
    }
  }, [gameweek]);

  const fetchDreamTeamData = async (gw) => {
    if (gw === null) return;
    setLoading(true);
    try {
      const data = await fetchDreamTeam(gw);
      setDreamTeam(data?.team?.length > 0 ? data.team : []);
    } catch (error) {
      console.error(`Error fetching dream team for GW${gw}:`, error.message);
    }
    setLoading(false);
  };

  const changeGameweek = (direction) => {
    setGameweek((prev) => {
      if (prev === null) return prev;
      let newGW = prev + direction;
      if (newGW < 1) newGW = 1;
      if (newGW > currentGameweek) newGW = currentGameweek;
      return newGW;
    });
  };

  const getPlayerDetails = (playerId) => {
    return playersData.find((player) => player.id === playerId) || {};
  };

  const getTeamObjById = (teamIndex) => {
    return teamsData.find((t) => t.id === teamIndex) || null;
  };

  if (gameweek === null) {
    return (
      <div className="loading-container">
        <p>Loading Gameweek Data...</p>
      </div>
    );
  }

  return (
    <div className="dreamteam-container mt-1">
      <h2 className="title">Team of the Week</h2>

      <div className="gameweek-nav">
        <button onClick={() => changeGameweek(-1)} disabled={gameweek === 1} className="gw-btn">
          ◀ Prev
        </button>
        <span className="gameweek-label">GW {gameweek}</span>
        <button onClick={() => changeGameweek(1)} disabled={gameweek === currentGameweek} className="gw-btn">
          Next ▶
        </button>
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <table className="dreamteam-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th></th>
              <th>Player</th>
              <th>Club</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {dreamTeam.length > 0
              ? dreamTeam.map((player) => renderPlayerRow(player, getPlayerDetails, getTeamObjById))
              : <tr><td colSpan="5" className="text-center">N/A</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
};

/** Build a reliable kit URL from team_code; fallback to club badge if needed */
const shirtFromTeamCode = (teamCode) =>
  teamCode ? `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-66.png` : null;

const badgeFromTeamCode = (teamCode) =>
  teamCode ? `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png` : null;

const renderPlayerRow = (player, getPlayerDetails, getTeamObjById) => {
  const playerDetails = getPlayerDetails(player.element);
  const position = POSITIONS[playerDetails.element_type] || "Unknown";

  // Player’s team object (for name/short name) and codes (for images)
  const teamObj = getTeamObjById(playerDetails.team);
  const clubShortName = TEAM_SHORT_NAMES[teamObj?.id] || "N/A";
  const teamCode = playerDetails.team_code || teamObj?.code || null;

  const kitSrc = shirtFromTeamCode(teamCode) || badgeFromTeamCode(teamCode);

  return (
    <tr key={player.element}>
      <td>{position}</td>
      <td>
        {kitSrc ? (
          <img src={kitSrc} alt={`${playerDetails.web_name} Kit`} className="team-kit" />
        ) : (
          <div className="team-kit team-kit--placeholder" title="No image">N/A</div>
        )}
      </td>
      <td>{playerDetails.web_name || "Unknown"}</td>
      <td>{clubShortName}</td>
      <td>{player.points} Pts</td>
    </tr>
  );
};

export default DreamTeam;
