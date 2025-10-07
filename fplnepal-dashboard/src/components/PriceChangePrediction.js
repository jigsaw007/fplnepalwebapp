import React, { useState, useEffect } from "react";
import { fetchPriceChangePredictions } from "../api/fplApi";
import { ChevronLeft, ChevronRight } from "lucide-react"; // ✅ Requires lucide-react

const PriceChangePrediction = () => {
  const [risePlayers, setRisePlayers] = useState([]);
  const [dropPlayers, setDropPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [risePage, setRisePage] = useState(1);
  const [dropPage, setDropPage] = useState(1);
  const playersPerPage = 5;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchPriceChangePredictions();
        if (!data || data.length === 0) {
          setError("No price change predictions available");
          setLoading(false);
          return;
        }

        const rise = data
          .filter((p) => p.predicted_change === "Rise")
          .sort((a, b) => b.transfers_in - a.transfers_in);
        const drop = data
          .filter((p) => p.predicted_change === "Fall")
          .sort((a, b) => b.transfers_out - a.transfers_out);

        setRisePlayers(rise);
        setDropPlayers(drop);
      } catch (err) {
        setError("Failed to load price change predictions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const paginate = (list, page) => {
    const start = (page - 1) * playersPerPage;
    return list.slice(start, start + playersPerPage);
  };

  const risePages = Math.ceil(risePlayers.length / playersPerPage);
  const dropPages = Math.ceil(dropPlayers.length / playersPerPage);

  const handleNext = (type) => {
    if (type === "rise") {
      setRisePage((prev) => (prev < risePages ? prev + 1 : 1));
    } else {
      setDropPage((prev) => (prev < dropPages ? prev + 1 : 1));
    }
  };

  const handlePrev = (type) => {
    if (type === "rise") {
      setRisePage((prev) => (prev > 1 ? prev - 1 : risePages));
    } else {
      setDropPage((prev) => (prev > 1 ? prev - 1 : dropPages));
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full border-white"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-300 text-sm py-4">{error}</div>
    );

  const renderCards = (
    players,
    title,
    color,
    page,
    totalPages,
    setPage,
    type
  ) => (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-800 via-indigo-800 to-purple-900 rounded-2xl p-4 shadow-md text-white min-h-[350px]">
      <div className="flex justify-between items-center mb-3">
        <h3
          className={`text-center text-sm font-semibold tracking-wide uppercase ${color}`}
        >
          {title}
        </h3>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrev(type)}
            className="p-1 bg-white/20 hover:bg-white/40 rounded-md transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => handleNext(type)}
            className="p-1 bg-white/20 hover:bg-white/40 rounded-md transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
        {players.length === 0 ? (
          <p className="text-center text-gray-200 text-xs">
            No players predicted.
          </p>
        ) : (
          <div className="space-y-3">
            {paginate(players, page).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 transition-all duration-200"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{p.web_name}</span>
                  <span className="text-[10px] text-gray-200">{p.team}</span>
                </div>

                <div className="text-[11px] text-right leading-tight">
                  <p className="text-gray-200">
                    Price: £{p.current_price.toFixed(1)}
                  </p>
                  <p
                    className={`font-bold ${
                      p.predicted_change === "Rise"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {p.predicted_change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 text-white rounded-3xl p-5 shadow-lg h-full flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">Price Change Predictions</h2>
        <p className="text-xs text-white/80">
          Predicted player price movements based on form and transfers.
        </p>
      </div>

      {/* Equal-height columns */}
      <div className="flex flex-col md:flex-row gap-4 flex-1">
        {renderCards(
          risePlayers,
          "Predicted Price Rises",
          "text-green-300",
          risePage,
          risePages,
          setRisePage,
          "rise"
        )}
        {renderCards(
          dropPlayers,
          "Predicted Price Drops",
          "text-red-300",
          dropPage,
          dropPages,
          setDropPage,
          "drop"
        )}
      </div>
    </div>
  );
};

export default PriceChangePrediction;
