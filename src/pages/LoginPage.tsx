/**
 * Login / Signup Page — ClawPod-style 2-split layout
 * Left: Gradient hero + branding
 * Right: Clean form (login/signup toggle)
 * Supports: Email+Password, Google OAuth, GitHub OAuth, Kakao OAuth
 */
import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useTheme } from "../ThemeContext";
import "./auth.css";

type Mode = "login" | "signup";
type Provider = "google" | "github" | "kakao";

export function LoginPage() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [usagePurpose, setUsagePurpose] = useState<"personal" | "business" | "other">("personal");
  const [agreedToS, setAgreedToS] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [disabledProviders, setDisabledProviders] = useState<Set<Provider>>(new Set());

  const redirectTo = "https://nextaicrew.com/auth/callback";

  const handleOAuth = useCallback(async (provider: Provider) => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("provider") && (msg.includes("not enabled") || msg.includes("not supported") || msg.includes("unsupported"))) {
        setDisabledProviders((prev) => new Set(prev).add(provider));
        setMessage({ text: `${provider} login is not yet configured.`, type: "error" });
      } else {
        setMessage({ text: error.message, type: "error" });
      }
    }
    setLoading(false);
  }, [redirectTo]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === "signup" && !agreedToS) {
      setMessage({ text: "Please agree to the Terms of Service and Privacy Policy.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: name,
            workspace_name: workspaceName,
            usage_purpose: usagePurpose,
          },
        },
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

  const allProvidersDisabled = disabledProviders.size >= 3;

  return (
    <div className="auth-page">
      {/* Left: Hero */}
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-logo">
            <img src={theme === 'dark' ? '/logo.svg' : '/logo-light.svg'} alt="Next AI Crew" style={{ height: 36 }} />
          </div>
          <span className="auth-hero-badge">AI Agent Platform</span>
          <h1 className="auth-hero-title">
            Your AI Crew,<br />with Soul.
          </h1>
          <p className="auth-hero-desc">
            AI 직원을 채용하고, 함께 성장하세요.<br />
            Recruit specialized AI agents — powered by next-generation Soul engine.
          </p>
          <div className="auth-soul-preview">
            <img src="/icons/departments/icon-developer.svg" alt="Dev" />
            <img src="/icons/departments/icon-designer.svg" alt="Design" />
            <img src="/icons/departments/icon-pm.svg" alt="PM" />
            <span>+17 Souls</span>
          </div>
          <a href="https://nextaicrew.com" className="auth-hero-cta" target="_blank" rel="noopener noreferrer">
            Explore Next AI Crew ↗
          </a>
        </div>
        <div className="auth-hero-footer">
          <span>🔒 Enterprise-grade security</span>
        </div>
      </div>

      {/* Right: Form */}
      <div className="auth-form-side">
        {/* Theme / Language toggles */}
        <div className="auth-top-actions">
          {/* Placeholder for i18n + dark/light toggle */}
        </div>

        <div className="auth-form-container">
          <h2 className="auth-form-title">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="auth-form-subtitle">
            {mode === "login"
              ? "Enter your credentials to access your account"
              : "Get started with Next AI Crew"}
          </p>

          {/* Signup extra fields */}
          {mode === "signup" && (
            <>
              <div className="auth-field">
                <label className="auth-label">Name</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Workspace Name</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter your workspace name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
                <span className="auth-hint">This name will be automatically created as an Organization</span>
              </div>
            </>
          )}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input auth-input-pw"
                placeholder="••••••••"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Signup: Usage Purpose + ToS */}
          {mode === "signup" && (
            <>
              <div className="auth-field">
                <label className="auth-label">Usage Purpose</label>
                <div className="purpose-pills">
                  {(["personal", "business", "other"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`purpose-pill${usagePurpose === opt ? " selected" : ""}`}
                      onClick={() => setUsagePurpose(opt)}
                    >
                      {opt === "personal" ? "개인 프로젝트" : opt === "business" ? "비즈니스" : "기타"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    className="auth-checkbox"
                    checked={agreedToS}
                    onChange={(e) => setAgreedToS(e.target.checked)}
                  />
                  I agree to the{" "}
                  <a href="/terms" className="auth-link">Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" className="auth-link">Privacy Policy</a>
                  {" "}(required)
                </label>
              </div>
            </>
          )}

          {/* Login: Remember me + Forgot */}
          {mode === "login" && (
            <div className="auth-login-options">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  className="auth-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <a href="/login/forgot-password" className="auth-link">Forgot Password?</a>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleEmailAuth as any}
            disabled={loading || !email || !password || (mode === "signup" && !agreedToS)}
            className={`auth-submit${loading ? " loading" : ""}`}
          >
            {loading ? "" : mode === "login" ? "Sign In" : "Sign Up"}
          </button>

          {/* OAuth divider */}
          {!allProvidersDisabled && (
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or continue with</span>
              <div className="auth-divider-line" />
            </div>
          )}

          {/* OAuth buttons */}
          {!allProvidersDisabled && (
            <div className="auth-oauth-row">
              {!disabledProviders.has("google") && (
                <button onClick={() => handleOAuth("google")} disabled={loading} className="auth-oauth-btn" title="Google">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </button>
              )}
              {!disabledProviders.has("github") && (
                <button onClick={() => handleOAuth("github")} disabled={loading} className="auth-oauth-btn" title="GitHub">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </button>
              )}
              {!disabledProviders.has("kakao") && (
                <button onClick={() => handleOAuth("kakao")} disabled={loading} className="auth-oauth-btn auth-oauth-kakao" title="Kakao">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
                    <path d="M12 3c-5.523 0-10 3.618-10 8.083 0 2.894 1.923 5.433 4.822 6.873-.212.79-.77 2.86-.882 3.305-.138.548.201.541.423.394.174-.116 2.77-1.886 3.892-2.652.564.083 1.145.126 1.745.126 5.523 0 10-3.617 10-8.083C22 6.618 17.523 3 12 3z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Toggle mode */}
          <p className="auth-toggle">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => { setMode("signup"); setMessage(null); }} className="auth-link">Sign Up</button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); setMessage(null); }} className="auth-link">Sign In</button>
              </>
            )}
          </p>

          {/* Error / Success */}
          {message && (
            <p className={`auth-message ${message.type}`}>{message.text}</p>
          )}
        </div>

        {/* Footer */}
        <footer className="auth-footer">
          <span>©2026 <a href="https://nextaicrew.com" className="auth-link">Next AI Crew</a></span>
          <a href="/terms" className="auth-link">Terms of Service</a>
          <a href="/privacy" className="auth-link">Privacy Policy</a>
        </footer>
      </div>
    </div>
  );
}
