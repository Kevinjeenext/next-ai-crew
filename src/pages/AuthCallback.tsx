/**
 * Auth Callback — handles OAuth redirect and auto-creates org.
 *
 * Supabase OAuth flow:
 * 1. PKCE flow: URL has ?code=... → exchangeCodeForSession()
 * 2. Implicit flow: URL has #access_token=... → onAuthStateChange detects it
 *
 * We handle both cases and wait for a valid session before proceeding.
 */
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Setting up your team...");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handleCallback = async () => {
      try {
        // 1. Check for PKCE code in query params
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          setStatus("Authenticating...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Code exchange failed:", error.message);
            setStatus("Login failed. Redirecting...");
            setTimeout(() => navigate("/login"), 2000);
            return;
          }
        }

        // 2. For implicit flow (hash fragment), Supabase client auto-detects
        //    via detectSessionInUrl: true. We need to wait for it.
        //    Also covers the PKCE case after exchange.

        // Wait for session to be available (up to 5 seconds)
        let session = null;
        for (let i = 0; i < 25; i++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            session = data.session;
            break;
          }
          await new Promise((r) => setTimeout(r, 200));
        }

        if (!session) {
          // Last resort: listen for auth state change
          const waitForAuth = new Promise<typeof session>((resolve) => {
            const timeout = setTimeout(() => resolve(null), 5000);
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
              if (s) {
                clearTimeout(timeout);
                subscription.unsubscribe();
                resolve(s);
              }
            });
          });
          session = await waitForAuth;
        }

        if (!session) {
          setStatus("Login failed. Please try again.");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        // 3. Call setup endpoint to ensure org exists
        setStatus("Creating your AI team...");
        try {
          const res = await fetch("/api/auth/setup", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error("Setup failed:", errText);
            // Non-fatal: user is authenticated, org creation can be retried
          }
        } catch (err) {
          console.error("Setup request failed:", err);
        }

        // 4. Redirect to dashboard
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
        <p style={{ color: "#CBD5E1" }}>{status}</p>
      </div>
    </div>
  );
}
