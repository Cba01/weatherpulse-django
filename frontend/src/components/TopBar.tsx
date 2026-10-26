import { Link, NavLink } from "react-router";

import { useAuth } from "../auth/useAuth";

export function TopBar() {
  const { user, status, logout } = useAuth();

  return (
    <header className="topbar">
      <nav className="topbar__nav">
        <strong>WeatherPulse</strong>
        <NavLink to="/" end>
          Inicio
        </NavLink>
        {status === "authenticated" && (
          <>
            <NavLink to="/favorites">Favoritos</NavLink>
            <NavLink to="/alerts">Alertas</NavLink>
          </>
        )}
      </nav>
      {status === "loading" && <span>Cargando…</span>}
      {status === "authenticated" && user && (
        <span className="session">
          Hola, {user.username}
          <button type="button" onClick={logout}>
            Cerrar sesión
          </button>
        </span>
      )}
      {status === "anonymous" && (
        <span className="session">
          <Link to="/login">Iniciar sesión</Link>
          <Link to="/register">Registrarse</Link>
        </span>
      )}
    </header>
  );
}
