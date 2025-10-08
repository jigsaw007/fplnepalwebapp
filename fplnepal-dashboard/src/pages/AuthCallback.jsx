// src/pages/AuthCallback.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const handleRedirect = async () => {
      const { data } = await supabase.auth.getSession();
      const redirect = params.get("redirect") || "/";
      if (data.session) navigate(redirect, { replace: true });
      else navigate("/login", { replace: true });
    };
    handleRedirect();
  }, [navigate, params]);

  return (
    <div className="h-screen flex items-center justify-center text-lg font-semibold">
      Authenticating your session...
    </div>
  );
}
