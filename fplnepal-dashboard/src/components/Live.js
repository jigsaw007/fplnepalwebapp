import { useEffect, useState } from "react";
import { fetchFixturesByGameweek, fetchFPLData } from "../api/fplApi";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Live = () => {
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentGW, setCurrentGW] = useState(null);
  const [activeGW, setActiveGW] = useState(null);

  // 🕒 Convert UTC → local time (auto detects browser timezone)
  const formatLocalTime = (utcString) => {
    if (!utcString) return "";
    const date = new Date(utcString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const getInitialData = async () => {
      setLoading(true);
      const fplData = await fetchFPLData();
      if (!fplData) return;

      setTeams(fplData.teams);
      const events = fplData.events;
      const current = events.find((gw) => gw.is_current)?.id || 1;
      setCurrentGW(current);
      setActiveGW(current);

      const fixtureData = await fetchFixturesByGameweek(current);
      setFixtures(fixtureData || []);
      setLoading(false);
    };
    getInitialData();
  }, []);

  const getTeamName = (teamId) => {
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : "Unknown";
  };

  const getKitUrl = (teamCode) =>
    `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-220.webp`;

  const handlePrev = async () => {
    if (activeGW > 1) {
      setLoading(true);
      const fixtureData = await fetchFixturesByGameweek(activeGW - 1);
      setFixtures(fixtureData || []);
      setActiveGW(activeGW - 1);
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (activeGW < 38) {
      setLoading(true);
      const fixtureData = await fetchFixturesByGameweek(activeGW + 1);
      setFixtures(fixtureData || []);
      setActiveGW(activeGW + 1);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-950 to-fuchsia-950 p-3 rounded-2xl shadow-md text-white">
      <div className="flex justify-between items-center mb-2 px-2">
        <h2 className="text-sm font-bold">Live Fixtures</h2>

        {/* GW Navigation */}
        <div className="flex items-center gap-2">
          <button
            className={`p-1 rounded bg-white/10 hover:bg-white/20 ${
              activeGW === 1 ? "opacity-40 cursor-not-allowed" : ""
            }`}
            disabled={activeGW === 1}
            onClick={handlePrev}
          >
            <FaChevronLeft size={10} />
          </button>
          <span className="text-xs font-semibold">GW {activeGW}</span>
          <button
            className={`p-1 rounded bg-white/10 hover:bg-white/20 ${
              activeGW === 38 ? "opacity-40 cursor-not-allowed" : ""
            }`}
            disabled={activeGW === 38}
            onClick={handleNext}
          >
            <FaChevronRight size={10} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-white rounded-full"></div>
        </div>
      ) : fixtures.length === 0 ? (
        <p className="text-center text-xs text-gray-300">No fixtures available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fixtures.map((fixture) => {
            const homeTeam = getTeamName(fixture.team_h);
            const awayTeam = getTeamName(fixture.team_a);

            const homeKit = getKitUrl(
              teams.find((t) => t.id === fixture.team_h)?.code
            );
            const awayKit = getKitUrl(
              teams.find((t) => t.id === fixture.team_a)?.code
            );

            const status = fixture.finished
              ? "Full Time"
              : fixture.started
              ? "In Progress"
              : "Upcoming";

            return (
              <div
                key={fixture.id}
                className="bg-white/10 rounded-xl p-2 text-xs flex flex-col items-center shadow-md hover:bg-white/20 transition"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex flex-col items-center w-1/3">
                    <img src={homeKit} alt={homeTeam} className="w-8 h-8" />
                    <p className="mt-0.5 text-[10px] text-center">{homeTeam}</p>
                  </div>

                  <div className="flex flex-col items-center justify-center w-1/3">
                    <p className="font-bold text-sm">
                      {fixture.team_h_score ?? "-"} : {fixture.team_a_score ?? "-"}
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-[1px] rounded ${
                        status === "Full Time"
                          ? "bg-green-600"
                          : status === "In Progress"
                          ? "bg-yellow-400 text-black"
                          : "bg-gray-500"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="flex flex-col items-center w-1/3">
                    <img src={awayKit} alt={awayTeam} className="w-8 h-8" />
                    <p className="mt-0.5 text-[10px] text-center">{awayTeam}</p>
                  </div>
                </div>

                {/* Local time only (no "Kickoff") */}
                <p className="text-[10px] text-gray-300">{formatLocalTime(fixture.kickoff_time)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Live;
