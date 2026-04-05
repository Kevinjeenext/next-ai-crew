/**
 * Auth Guard — protects routes, redirects unauthenticated users to /login.
 * Uses AuthProvider context to avoid duplicate session checks.
 */
import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface Props {
  children: ReactNode;
}

export function AuthGuard({ children }: Props) {
  const { session, loading } = useAuth();

  // Loading — show spinner, do NOT redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated after loading complete
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
