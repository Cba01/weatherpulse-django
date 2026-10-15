import { Link } from "react-router";

import { useAuth } from "../auth/useAuth";

export function HomePage() {
  const { user, status, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <strong>WeatherPulse</strong>
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
      <main className="home">
        <p>Aquí irán la búsqueda de ciudades y el clima actual.</p>
      </main>
    </>
  );
}
