import { useEffect, useState } from "react";
import { Link } from "react-router";

import type { City } from "../api/types";
import { useAuth } from "../auth/useAuth";
import { CitySearch } from "../components/CitySearch";
import { WeatherBackground } from "../components/WeatherBackground";
import { WeatherCard } from "../components/WeatherCard";
import { useCurrentWeather } from "../hooks/useCurrentWeather";
import { getWeatherTheme } from "../theme/weatherTheme";

const LAST_CITY_KEY = "weatherpulse.lastCity";

function loadLastCity(): City | null {
  try {
    const stored = localStorage.getItem(LAST_CITY_KEY);
    return stored ? (JSON.parse(stored) as City) : null;
  } catch {
    return null;
  }
}

export function HomePage() {
  const { user, status, logout } = useAuth();
  // Lazy initializer: read localStorage once, not on every render.
  const [city, setCity] = useState<City | null>(loadLastCity);
  const { weather, weatherCity, error, loading } = useCurrentWeather(city);
  const theme = weather ? getWeatherTheme(weather) : "default";

  // One attribute on <html> drives every themed CSS custom property.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    return () => {
      document.documentElement.dataset.theme = "default";
    };
  }, [theme]);

  function selectCity(selected: City) {
    setCity(selected);
    try {
      localStorage.setItem(LAST_CITY_KEY, JSON.stringify(selected));
    } catch {
      // Storage unavailable (private mode): the choice just won't persist.
    }
  }

  return (
    <>
      <WeatherBackground theme={theme} />
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
        <CitySearch onSelect={selectCity} />

        {error && <p className="home__error">{error}</p>}
        {weatherCity && weather && <WeatherCard city={weatherCity} weather={weather} updating={loading} />}
        {city && !weather && loading && <p className="home__hint">Cargando clima…</p>}
        {!city && <p className="home__hint">Busca una ciudad para ver su clima.</p>}
      </main>
    </>
  );
}
