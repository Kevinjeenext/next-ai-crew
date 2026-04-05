/**
 * Login / Signup Page — Supabase Auth
 * Supports: Email+Password, Google OAuth, GitHub OAuth, Kakao OAuth
 *
 * Soul & Body: "Assemble your AI team."
 * All text colors use inline styles to avoid Tailwind theme override issues.
 */
import { useState } from "react";
import { supabase } from "../lib/supabase";

type Mode = "login" | "signup";

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const redirectTo = `${window.location.origin}/auth/callback`;

  const handleOAuth = async (provider: "google" | "github" | "kakao") => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) setMessage({ text: error.message, type: "error" });
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setMessage(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "Check your email to confirm your account!", type: "success" });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        window.location.href = "/auth/callback";
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      <div className="w-full max-w-md p-8 space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold" style={{ color: "#FFFFFF" }}>Next AI Crew</h1>
          <p style={{ color: "#94A3B8" }}>
            {mode === "login" ? "Welcome back, CEO." : "Assemble your AI team."}
          </p>
        </div>

        {/* OAuth Providers */}
        <div className="space-y-2.5">
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 font-medium rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
            style={{ backgroundColor: "#FFFFFF", color: "#1F2937" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth("github")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 font-medium rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: "#374151", color: "#FFFFFF" }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          <button
            onClick={() => handleOAuth("kakao")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 font-medium rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: "#FEE500", color: "#191919" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3c-5.523 0-10 3.618-10 8.083 0 2.894 1.923 5.433 4.822 6.873-.212.79-.77 2.86-.882 3.305-.138.548.201.541.423.394.174-.116 2.77-1.886 3.892-2.652.564.083 1.145.126 1.745.126 5.523 0 10-3.617 10-8.083C22 6.618 17.523 3 12 3z" />
            </svg>
            Continue with Kakao
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: "#475569" }} />
          <span className="text-sm" style={{ color: "#94A3B8" }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#475569" }} />
        </div>

        {/* Email + Password */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            style={{ backgroundColor: "#1E293B", border: "1px solid #475569", color: "#FFFFFF" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            minLength={6}
            className="w-full px-4 py-3 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            style={{ backgroundColor: "#1E293B", border: "1px solid #475569", color: "#FFFFFF" }}
          />
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full px-4 py-3 font-medium rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: "#4F46E5", color: "#FFFFFF" }}
          >
            {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-sm" style={{ color: "#94A3B8" }}>
          {mode === "login" ? (
            <>
              New here?{" "}
              <button onClick={() => { setMode("signup"); setMessage(null); }} style={{ color: "#818CF8" }}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("login"); setMessage(null); }} style={{ color: "#818CF8" }}>
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Message */}
        {message && (
          <p className="text-sm text-center" style={{ color: message.type === "success" ? "#4ADE80" : "#F87171" }}>
            {message.text}
          </p>
        )}

        <p className="text-center text-xs" style={{ color: "#94A3B8" }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
