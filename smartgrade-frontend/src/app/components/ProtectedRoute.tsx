import { Navigate, useLocation } from "react-router";
import { useAuth } from "../lib/AuthContext";

/**
 * Wrap protected routes with this. Behavior:
 *  - while we're checking the stored token: show a small splash
 *  - if no user after the check: redirect to /auth (remembering where they
 *    were trying to go, so we can bounce them back after login)
 *  - otherwise: render the children
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: "var(--color-section-bg)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin"
            style={{
              borderColor: "rgba(108,92,231,0.2)",
              borderTopColor: "var(--color-primary)",
            }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
