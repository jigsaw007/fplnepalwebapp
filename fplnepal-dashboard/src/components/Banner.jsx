import { useEffect, useState } from "react";
import { fetchFPLData } from "../api/fplApi";

export default function Banner() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await fetchFPLData();
        if (!data?.elements) return;

        // Choose 5 unique top players (variety)
        const topScorers = [...data.elements]
          .sort((a, b) => b.total_points - a.total_points)
          .slice(0, 2);
        const mostSelected = [...data.elements]
          .sort((a, b) => b.selected_by_percent - a.selected_by_percent)
          .slice(0, 2);
        const inForm = [...data.elements]
          .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
          .slice(0, 2);

        const combined = [...topScorers, ...mostSelected, ...inForm]
          .slice(0, 8)
          .map((p) => ({
            id: p.id,
            name: p.web_name,
            code: p.code,
            team: p.team_code,
            img: `https://resources.premierleague.com/premierleague25/photos/players/110x140/${p.code}.png`,
          }));

        // Remove duplicates & limit to 5
        const uniquePlayers = Array.from(new Map(combined.map((p) => [p.id, p])).values()).slice(
          0,
          5
        );
        setPlayers(uniquePlayers);
      } catch (err) {
        console.error("Error loading banner players:", err);
      }
    };
    loadPlayers();
  }, []);

const handleClick = () => {
  window.open("https://webapp.fplnepal.com/create-squad", "_blank");
};

  return (
    <div
      onClick={handleClick}
      style={{
        position: "relative",
        width: "100%",
        height: "220px",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 40%, #a21caf 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingLeft: "20px",
        color: "white",
        fontFamily: "'Poppins', sans-serif",
        marginBottom: "18px",
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent 70%)",
        }}
      />

      {/* Left Text Section */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: "55%",
        }}
      >
        <h1
          style={{
            fontSize: "1.9rem",
            fontWeight: "800",
            letterSpacing: "0.05em",
            textShadow: "0 3px 8px rgba(0,0,0,0.3)",
            lineHeight: "1.2",
          }}
        >
          FPL NEPAL
          <br />
          SQUAD PLANNER
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            opacity: 0.9,
            marginTop: "6px",
            textShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          Create, plan and share your dream FPL team — powered by real data.
        </p>
      </div>

      {/* Player Images */}
      <div
        style={{
          position: "absolute",
          right: "0",
          bottom: "0",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          zIndex: 2,
          gap: "5px", // ✅ spacing between players
          paddingRight: "10px",
        }}
      >
        {players.map((p, idx) => (
          <div
            key={p.id}
            style={{
              position: "relative",
              marginRight: idx === players.length - 1 ? "0" : "-20px", // ✅ subtle overlap
              zIndex: players.length - idx,
              animation: `float${idx} 3.5s ease-in-out infinite`,
              filter: "drop-shadow(0 5px 8px rgba(0,0,0,0.5))",
            }}
          >
            <img
              src={p.img}
              alt={p.name}
              title={p.name}
              style={{
                height: "210px",
                width: "auto",
                objectFit: "contain",
                transform: `translateY(-8px) scale(${1.25 - idx * 0.03})`, // ✅ smoother scaling
                transition: "transform 0.4s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-8px) scale(1.4)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = `translateY(-8px) scale(${1.25 - idx * 0.03})`)
              }
            />
          </div>
        ))}
      </div>

      {/* Animations & Responsive */}
      <style>
        {`
        @keyframes float0 { 0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);} }
        @keyframes float1 { 0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);} }
        @keyframes float2 { 0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);} }
        @keyframes float3 { 0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);} }
        @keyframes float4 { 0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);} }

        /* ✅ Responsive scaling */
        @media (max-width: 1024px) {
          div[style*="height: 220px"] {
            height: 200px !important;
          }
          img {
            height: 180px !important;
          }
        }

        @media (max-width: 768px) {
          div[style*="height: 220px"] {
            height: 180px !important;
          }
          img {
            height: 160px !important;
            transform: translateY(-6px) scale(1.15) !important;
          }
          h1 {
            font-size: 1.4rem !important;
          }
          p {
            font-size: 0.85rem !important;
          }
        }

        @media (max-width: 480px) {
          div[style*="height: 220px"] {
            height: 160px !important;
          }
          img {
            height: 130px !important;
            transform: translateY(-5px) scale(1.1) !important;
          }
          h1 {
            font-size: 1.1rem !important;
          }
          p {
            font-size: 0.8rem !important;
          }
        }
      `}
      </style>
    </div>
  );
}
