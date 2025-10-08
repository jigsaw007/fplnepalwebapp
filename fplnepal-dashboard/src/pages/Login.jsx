import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useLocation } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // 🧭 Get redirect target (fallback: home)
  const redirectTo = location.state?.redirectTo || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // ✅ Send redirect info to Supabase magic link
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          redirectTo
        )}`,
      },
    });

    setLoading(false);
    if (error) alert(error.message);
    else alert("✅ Check your email for the login link!");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-80">
        <h2 className="text-lg font-bold mb-3 text-center">Login to FPLNepal</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border w-full mb-3 p-2 rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
