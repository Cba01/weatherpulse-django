import { useEffect, useState } from "react";

import type { Place } from "../api/types";
import { useAuth } from "../auth/useAuth";
import { CitySearch } from "../components/CitySearch";
import { FavoriteButton } from "../components/FavoriteButton";
import { TopBar } from "../components/TopBar";
import { WeatherBackground } from "../components/WeatherBackground";
import { WeatherCard } from "../components/WeatherCard";
import { WeatherMap } from "../components/WeatherMap";
import { useCurrentWeather } from "../hooks/useCurrentWeather";
import { useFavorites } from "../hooks/useFavorites";
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
  const { user } = useAuth();
  const favorites = useFavorites(user?.id ?? null);
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

  // Only stored cities (with an id) can be favorites: the API references a City row.
  function favoriteAction(cityId: number | undefined) {
    if (cityId === undefined || !user || favorites.loading) return null;
    const favorite = favorites.findByCity(cityId);
    return (
      <FavoriteButton
        active={favorite !== undefined}
        busy={favorites.busyCityId === cityId}
        onToggle={() => (favorite ? favorites.remove(favorite) : favorites.add(cityId))}
      />
    );
  }

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
      <TopBar />

      <main className="home">
        <CitySearch onSelect={selectPlace} />

        {error && <p className="home__error">{error}</p>}
        {favorites.error && <p className="home__error">{favorites.error}</p>}
        {weatherPlace && weather && (
          <WeatherCard
            place={weatherPlace}
            weather={weather}
            updating={loading}
            action={favoriteAction(weatherPlace.id)}
          />
        )}
        {place && !weather && loading && <p className="home__hint">Cargando clima…</p>}
        {!place && <p className="home__hint">Busca una ciudad o haz clic en el mapa para ver su clima.</p>}

        <WeatherMap place={place} weather={weatherPlace === place ? weather : null} onPick={selectPlace} />
      </main>
    </>
  );
}
