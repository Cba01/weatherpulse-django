import { useEffect, useState } from "react";
import { Link } from "react-router";

import type { Place } from "../api/types";
import { useAuth } from "../auth/useAuth";
import { CitySearch } from "../components/CitySearch";
import { WeatherBackground } from "../components/WeatherBackground";
import { WeatherCard } from "../components/WeatherCard";
import { WeatherMap } from "../components/WeatherMap";
import { useCurrentWeather } from "../hooks/useCurrentWeather";
import { getWeatherTheme } from "../theme/weatherTheme";

// Key kept from when only searched cities were stored: a saved City is a valid Place.
const LAST_PLACE_KEY = "weatherpulse.lastCity";

function loadLastPlace(): Place | null {
  try {
    const stored = localStorage.getItem(LAST_PLACE_KEY);
    return stored ? (JSON.parse(stored) as Place) : null;
  } catch {
    return null;
  }
}

export function HomePage() {
  const { user, status, logout } = useAuth();
  // Lazy initializer: read localStorage once, not on every render.
  const [place, setPlace] = useState<Place | null>(loadLastPlace);
  const { weather, weatherPlace, error, loading } = useCurrentWeather(place);
  const theme = weather ? getWeatherTheme(weather) : "default";

  // One attribute on <html> drives every themed CSS custom property.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    return () => {
      document.documentElement.dataset.theme = "default";
    };
  }, [theme]);

  function selectPlace(selected: Place) {
    setPlace(selected);
    try {
      localStorage.setItem(LAST_PLACE_KEY, JSON.stringify(selected));
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
        <CitySearch onSelect={selectPlace} />

        {error && <p className="home__error">{error}</p>}
        {weatherPlace && weather && <WeatherCard place={weatherPlace} weather={weather} updating={loading} />}
        {place && !weather && loading && <p className="home__hint">Cargando clima…</p>}
        {!place && <p className="home__hint">Busca una ciudad o haz clic en el mapa para ver su clima.</p>}

        <WeatherMap place={place} weather={weatherPlace === place ? weather : null} onPick={selectPlace} />
      </main>
    </>
  );
}
