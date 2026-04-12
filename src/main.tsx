import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import { LoginPage } from "./pages/LoginPage";
import { AuthCallback } from "./pages/AuthCallback";
import { LandingPage } from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import SoulHirePage from "./components/hire/SoulHirePage";
import "./index.css";

/**
 * Top-level Error Boundary — prevents full white screen on unexpected errors.
 * Shows a recoverable error UI instead of crashing the demo.
 */
class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#0F172A", flexDirection: "column", gap: "1rem", padding: "2rem",
        }}>
          <div style={{ fontSize: "3rem" }}>⚠️</div>
          <h1 style={{ color: "#F1F5F9", fontFamily: "sans-serif", fontSize: "1.25rem", margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#94A3B8", fontFamily: "sans-serif", fontSize: "0.9rem", margin: 0, maxWidth: 400, textAlign: "center" }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = "/"; }}
            style={{
              marginTop: "0.5rem", padding: "0.625rem 1.5rem",
              background: "linear-gradient(135deg, #06B6D4, #6366F1)",
              color: "#fff", border: "none", borderRadius: "0.5rem",
              cursor: "pointer", fontFamily: "sans-serif", fontSize: "0.9rem",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Route guard: shows the original Next AI Crew office app only when authenticated.
 * Unauthenticated users see Landing → Login flow.
 */
function ProtectedApp({ children }: { children?: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/landing" replace />;
  }

  // If children provided (e.g. /hire page), render them instead of App
  return children ? <>{children}</> : <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/hire" element={<ProtectedApp><SoulHirePage /></ProtectedApp>} />
            <Route path="/*" element={<ProtectedApp />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </RootErrorBoundary>
  </StrictMode>,
);
