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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-700 text-white px-4">
      <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-2xl p-8 w-full max-w-md text-center border border-white/20">
        <h1 className="text-2xl font-extrabold mb-3 tracking-wide">
          Welcome to <span className="text-yellow-300">FPL NEPAL SQUAD PLANNER</span>
        </h1>

        <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-6">
          Build your ultimate FPL team with powerful planning tools.  
          Create, save, and share your squads with friends.  
          Use <strong>Fixed</strong>, <strong>Unlimited</strong>, or <strong>Default Budgets</strong>,  
          activate your <strong>Chips</strong>, and explore <strong>Score Predictions</strong> based on real data.  
          Plan your <span className="text-yellow-300 font-semibold">FPL journey</span> ahead with smart strategy and fun.
        </p>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            {loading ? "Sending Magic Link..." : "Send Magic Link"}
          </button>
        </form>

        <div className="mt-6 text-xs text-white/60">
          🔒 Secure login via email. No password required.
        </div>
      </div>
    </div>
  );
}
