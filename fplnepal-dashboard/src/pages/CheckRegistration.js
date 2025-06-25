// src/pages/CheckRegistration.js
import { useState } from "react";
import { ClipLoader } from "react-spinners";

const CheckRegistration = () => {
  const [name, setName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const GOOGLE_SHEET_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFgEn7uoB56QwPdWGMXI_40BZacqnLu_8NoDouiZU4WPhLnhhd-fHcCMd8PdBZQjWzEyd7Ya0tQXG6/pub?output=csv";

  const handleCheck = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(GOOGLE_SHEET_CSV_URL);
      const text = await res.text();
      const rows = text.split("\n").map((r) => r.split(","));
      const flatNames = rows.flat().map((n) => n.trim().toLowerCase());

      if (flatNames.includes(name.trim().toLowerCase())) {
        setResult("✅ You are registered.");
      } else {
        setResult("❌ You are not registered. Please contact Admins.");
      }
    } catch (err) {
      setResult("Error checking registration. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-md border border-purple-200">
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-900">
          Check Registration for Season 25|26 <br />
          <span className="text-sm text-gray-600">(FPL NEPAL Season 15)</span>
        </h2>

        <p className="mb-4 text-sm text-gray-600 text-center">
          Names are case sensitive. Make sure to enter your full name.
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name..."
          className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={handleCheck}
          disabled={loading}
          className="w-full bg-purple-700 text-white py-2 rounded hover:bg-purple-800 transition duration-200"
        >
          {loading ? <ClipLoader size={20} color="#ffffff" /> : "Check"}
        </button>

        {result && (
          <p className={`mt-4 text-center text-lg font-medium ${result.includes("not registered") ? "text-red-600" : "text-green-600"}`}>
            {result}
          </p>
        )}
      </div>

      <div className="max-w-xl mx-auto mt-10 mb-16">
        <img
          src="/registration.jpg"
          alt="FPL Nepal Registration Rewards"
          className="rounded-lg shadow-lg w-full"
        />
      </div>
    </>
  );
};

export default CheckRegistration;