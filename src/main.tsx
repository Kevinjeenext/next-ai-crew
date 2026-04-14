import { StrictMode, Component, useState, useEffect, type ReactNode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import { LoginPage } from "./pages/LoginPage";
import { AuthCallback } from "./pages/AuthCallback";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import AppShell from "./components/layout/AppShell";
import DashboardOutlet from "./components/layout/DashboardOutlet";
import SoulHireV2 from "./components/hire/SoulHireV2";
import SettingsPage from "./components/settings/SettingsPage";

// Lazy load admin pages (code-split)
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminTenants = lazy(() => import("./pages/admin/AdminTenants"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const OrgChart = lazy(() => import("./components/org-chart/OrgChart"));
const GoalsPage = lazy(() => import("./components/goals/GoalsPage"));

import "./styles/design-system.css";
import "./index.css";

/**
 * Top-level Error Boundary — prevents full white screen on unexpected errors.
 */
class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) { console.error("[RootErrorBoundary]", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0A0F1C", color: "#fff", padding: 32 }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Something went wrong</h1>
          <p style={{ color: "#94A3B8", marginBottom: 24, maxWidth: 480, textAlign: "center" }}>{this.state.error.message}</p>
          <button onClick={() => { this.setState({ error: null }); window.location.href = "/"; }} style={{ padding: "10px 24px", borderRadius: 8, background: "#3B82F6", color: "#fff", border: "none", cursor: "pointer", fontSize: 14 }}>
            홈으로 돌아가기
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Auth guard — redirects to landing if not authenticated
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return <Navigate to="/landing" replace />;
  return <>{children}</>;
}

const AdminSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' }}>Loading...</div>}>
    {children}
  </Suspense>
);

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

            {/* Authenticated routes — AppShell persistent sidebar */}
            <Route path="/" element={<AuthGuard><AppShell /></AuthGuard>}>
              <Route index element={<DashboardOutlet />} />
              <Route path="hire" element={<SoulHireV2 />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="org-chart" element={<AdminSuspense><OrgChart /></AdminSuspense>} />
              <Route path="goals" element={<AdminSuspense><GoalsPage /></AdminSuspense>} />
              <Route path="dashboard/billing" element={<SettingsPage />} />
            </Route>

            {/* Admin — separate layout, code-split */}
            <Route path="/admin" element={<AdminSuspense><AdminLayout /></AdminSuspense>}>
              <Route index element={<AdminSuspense><AdminDashboard /></AdminSuspense>} />
              <Route path="users" element={<AdminSuspense><AdminUsers /></AdminSuspense>} />
              <Route path="tenants" element={<AdminSuspense><AdminTenants /></AdminSuspense>} />
              <Route path="audit" element={<AdminSuspense><AdminAuditLog /></AdminSuspense>} />
              <Route path="settings" element={<AdminSuspense><AdminSettings /></AdminSuspense>} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </RootErrorBoundary>
  </StrictMode>,
);
