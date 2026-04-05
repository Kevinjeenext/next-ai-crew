/**
 * Auth Callback — handles OAuth redirect and auto-creates org.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Setting up your team...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session from URL hash (Supabase puts tokens there)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          setStatus("Login failed. Redirecting...");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        // Call setup endpoint to ensure org exists
        setStatus("Creating your AI team...");
        const res = await fetch("/api/auth/setup", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          console.error("Setup failed:", await res.text());
        }

        // Redirect to dashboard
        setStatus("Welcome aboard! 🚀");
        setTimeout(() => navigate("/"), 500);
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("Something went wrong. Redirecting...");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-300">{status}</p>
      </div>
    </div>
  );
}
