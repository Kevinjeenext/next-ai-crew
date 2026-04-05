/**
 * Auth Callback — handles OAuth redirect and auto-creates org.
 *
 * Supabase OAuth flow:
 * 1. PKCE flow: URL has ?code=... → exchangeCodeForSession()
 * 2. Implicit flow: URL has #access_token=... → onAuthStateChange detects it
 * 3. Error flow: URL has ?error=... or #error=...
 *
 * Debug: all steps logged to console with [AuthCallback] prefix.
 */
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function log(...args: unknown[]) {
  console.log("[AuthCallback]", ...args);
}

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Setting up your team...");
  const [debugInfo, setDebugInfo] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handleCallback = async () => {
      try {
        const fullUrl = window.location.href;
        const search = window.location.search;
        const hash = window.location.hash;

        log("Full URL:", fullUrl);
        log("Search params:", search);
        log("Hash fragment:", hash ? hash.substring(0, 100) + "..." : "(empty)");

        // Check for error in URL (both query and hash)
        const searchParams = new URLSearchParams(search);
        const hashParams = new URLSearchParams(hash.replace("#", "?"));

        const errorParam = searchParams.get("error") || hashParams.get("error");
        const errorDesc = searchParams.get("error_description") || hashParams.get("error_description");

        if (errorParam) {
          log("OAuth error:", errorParam, errorDesc);
          setStatus(`Login error: ${errorDesc || errorParam}`);
          setDebugInfo(`Error: ${errorParam}\n${errorDesc || ""}`);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // 1. Check for PKCE code in query params
        const code = searchParams.get("code");
        if (code) {
          log("PKCE code found, exchanging...");
          setStatus("Authenticating...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            log("Code exchange failed:", error.message);
            setStatus("Authentication failed. Redirecting...");
            setDebugInfo(`exchangeCodeForSession error: ${error.message}`);
            setTimeout(() => navigate("/login"), 2000);
            return;
          }
          log("Code exchange success, session:", !!data.session);
        }

        // 2. Check for implicit flow tokens in hash
        const hashToken = hashParams.get("access_token");
        if (hashToken) {
          log("Implicit flow: access_token found in hash");
        }

        // 3. Wait for session to be available (up to 8 seconds)
        log("Waiting for session...");
        let session = null;
        for (let i = 0; i < 40; i++) {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            log("getSession error:", error.message);
          }
          if (data.session) {
            session = data.session;
            log("Session found on attempt", i + 1, "user:", session.user.email);
            break;
          }
          await new Promise((r) => setTimeout(r, 200));
        }

        if (!session) {
          log("No session from polling, trying onAuthStateChange...");
          // Last resort: listen for auth state change
          const waitForAuth = new Promise<typeof session>((resolve) => {
            const timeout = setTimeout(() => {
              log("onAuthStateChange timeout (5s)");
              resolve(null);
            }, 5000);
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
              log("Auth state change:", event, "session:", !!s);
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
          log("FAILED: No session after all attempts");
          setStatus("Login failed. Please try again.");
          setDebugInfo("No session detected. Check Supabase redirect URL settings.");
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // 4. Call setup endpoint to ensure org exists
        log("Session OK, calling /api/auth/setup...");
        setStatus("Creating your AI team...");
        try {
          const res = await fetch("/api/auth/setup", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          });
          const data = await res.json();
          log("Setup response:", res.status, data);
        } catch (err) {
          log("Setup request failed:", err);
        }

        // 5. Redirect to dashboard
        setStatus("Welcome aboard! 🚀");
        log("Redirecting to dashboard...");
        setTimeout(() => navigate("/"), 500);
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        setStatus("Something went wrong. Redirecting...");
        setDebugInfo(String(err));
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto" />
        <p style={{ color: "#CBD5E1" }}>{status}</p>
        {debugInfo && (
          <pre className="text-left text-xs p-3 rounded-lg mt-4 overflow-auto max-h-32"
            style={{ color: "#F87171", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {debugInfo}
          </pre>
        )}
      </div>
    </div>
  );
}
