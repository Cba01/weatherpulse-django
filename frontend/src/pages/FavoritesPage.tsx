import { useMemo, useState } from "react";
import { Link } from "react-router";

import type { FavoriteCity } from "../api/types";
import { useAuth } from "../auth/useAuth";
import { TopBar } from "../components/TopBar";
import { WeatherComparison } from "../components/WeatherComparison";
import { useFavorites } from "../hooks/useFavorites";
import { useWeatherComparison } from "../hooks/useWeatherComparison";

const MAX_COMPARED = 3;

export function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, loading, error, busyCityId, remove } = useFavorites(user?.id ?? null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Memoized so its identity only changes when the selection really does:
  // useWeatherComparison refetches whenever this array changes.
  const compared = useMemo(
    () => favorites.filter((favorite) => selectedIds.includes(favorite.city.id)).map((favorite) => favorite.city),
    [favorites, selectedIds],
  );
  const comparison = useWeatherComparison(compared);

  function toggleSelected(cityId: number) {
    setSelectedIds((ids) =>
      ids.includes(cityId) ? ids.filter((id) => id !== cityId) : ids.length < MAX_COMPARED ? [...ids, cityId] : ids,
    );
  }

  async function handleRemove(favorite: FavoriteCity) {
    if (!(await remove(favorite))) return;
    setSelectedIds((ids) => ids.filter((id) => id !== favorite.city.id));
  }

  return (
    <>
      <TopBar />
      <main className="favorites">
        <h1>Mis favoritos</h1>
        {error && <p className="home__error">{error}</p>}
        {loading && <p className="home__hint">Cargando favoritos…</p>}
        {!loading && favorites.length === 0 && (
          <p className="home__hint">
            Aún no tienes favoritos. <Link to="/">Busca una ciudad</Link> y pulsa la estrella.
          </p>
        )}

        {favorites.length > 0 && (
          <section className="card">
            <p className="favorites__help">
              Marca hasta {MAX_COMPARED} ciudades para compararlas ({selectedIds.length}/{MAX_COMPARED}).
            </p>
            <ul className="favorites__list">
              {favorites.map((favorite) => {
                const { city } = favorite;
                const checked = selectedIds.includes(city.id);
                return (
                  <li key={favorite.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && selectedIds.length >= MAX_COMPARED}
                        onChange={() => toggleSelected(city.id)}
                      />
                      {city.name} <span>{city.country}</span>
                    </label>
                    <button
                      type="button"
                      className="favorites__remove"
                      onClick={() => handleRemove(favorite)}
                      disabled={busyCityId === city.id}
                    >
                      Quitar
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {comparison.loading && <p className="home__hint">Cargando comparación…</p>}
        {comparison.entries.length > 0 && <WeatherComparison entries={comparison.entries} />}
      </main>
    </>
  );
}
