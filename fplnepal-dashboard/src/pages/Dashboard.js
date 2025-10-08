import TopStats from "../components/TopStats";
import TopSelectedPlayers from "../components/TopSelectedPlayers";
import TopTransfersIn from "../components/TopTransfersIn";
import TopTransfersOut from "../components/TopTransfersOut";
import InjuryNews from "../components/InjuryNews";
import DreamTeam from "../components/DreamTeam";
import Suggestion from "../components/Suggestion";
import Live from "../components/Live";
import PriceChangePrediction from "../components/PriceChangePrediction";
import AdComponent from "../components/AdComponent";
import Banner from "../components/Banner";

const Dashboard = () => {
  return (
    <div className="p-2 sm:p-4 w-full">
      {/* ================= BANNER SECTION ================= */}
      <section className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white p-5 sm:p-6 shadow-md mb-5">
        <Banner />
      </section>

      {/* ================= TOP STATS SECTION ================= */}
      <section className="rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-fuchsia-700 text-white p-4 sm:p-5 shadow-md mb-6">
        <TopStats />
      </section>

      {/* ================== PRICE CHANGE + LIVE ================== */}
      <section className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-2xl p-3 sm:p-4 text-white">
          <h2 className="text-sm font-semibold mb-1">Price Change Predictions</h2>
          <PriceChangePrediction />
        </div>

        <div className="bg-white/10 rounded-2xl p-3 sm:p-4 text-white">
          <h2 className="text-sm font-semibold mb-1">Live Fixtures</h2>
          <Live />
        </div>
      </section>

      {/* ================== AD COMPONENT ================== */}
      <div className="mt-4">
        <AdComponent />
      </div>

      {/* ================== TRANSFERS + SELECTED + INJURIES ================== */}
      <section className="mt-6 space-y-6">
        {/* 🔹 Transfers In / Out */}
        <div className="bg-white/10 backdrop-blur-sm text-white rounded-2xl shadow-md p-4">
          <h2 className="text-md font-semibold mb-3 text-center">Top Transfers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TopTransfersIn />
            <TopTransfersOut />
          </div>
        </div>

        {/* 🔹 Most Selected Players */}
        <div className="bg-white/10 backdrop-blur-sm text-white rounded-2xl shadow-md p-4">
          <h2 className="text-md font-semibold mb-3 text-center">
            Most Selected Players
          </h2>
          <TopSelectedPlayers />
        </div>
      </section>

      {/* ================== DREAM TEAM + SUGGESTION ================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 items-stretch">
        {/* LEFT: Dream Team */}
        <div className="bg-white/10 rounded-2xl p-4 text-white shadow-md h-full">
          <DreamTeam />
        </div>

        {/* RIGHT: Suggestion + Injury News */}
        <div className="flex flex-col gap-4 h-full">
          <div className="bg-white/10 rounded-2xl p-4 text-white shadow-md flex-1">
            <Suggestion />
          </div>
          <div className="bg-white/10 rounded-2xl p-4 text-white shadow-md flex-1">
            <InjuryNews />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
