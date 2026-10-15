import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "./useAuth";

/** What the login page reads to send the user back where they were. */
export type RedirectState = { from?: string };

/**
 * Layout route guarding every child route. Three states, not two:
 * while the session is being restored we must wait, or a page reload
 * would bounce a logged-in user to /login.
 */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <p className="page-status">Cargando…</p>;
  if (status === "anonymous") {
    const state: RedirectState = { from: location.pathname };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}
