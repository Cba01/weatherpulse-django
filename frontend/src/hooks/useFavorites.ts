import { isCancel } from "axios";
import { useEffect, useState } from "react";

import { errorMessages } from "../api/errors";
import * as favoritesApi from "../api/favorites";
import type { FavoriteCity } from "../api/types";

type Loaded = { userId: number; favorites: FavoriteCity[] };

/**
 * The logged-in user's favorites. Pass null when there's no session.
 * The list is keyed by user, so after switching accounts the previous
 * user's favorites are never shown, not even while the new ones load.
 */
export function useFavorites(userId: number | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  // City being added/removed: its button waits for the server (no optimistic update).
  const [busyCityId, setBusyCityId] = useState<number | null>(null);

  useEffect(() => {
    if (userId === null) return;

    const controller = new AbortController();
    favoritesApi
      .listFavorites(controller.signal)
      .then((favorites) => {
        setLoaded({ userId, favorites });
        setError(null);
      })
      .catch((err) => {
        if (!isCancel(err)) setError(errorMessages(err)[0]);
      });

    return () => controller.abort();
  }, [userId]);

  const isCurrent = userId !== null && loaded?.userId === userId;
  const favorites = isCurrent ? loaded.favorites : [];

  // Functional updates: base the change on the latest list, not the one
  // this render closed over (another add/remove may have landed since).
  function updateList(change: (favorites: FavoriteCity[]) => FavoriteCity[]) {
    setLoaded((current) => (current ? { ...current, favorites: change(current.favorites) } : current));
  }

  async function add(cityId: number): Promise<boolean> {
    setBusyCityId(cityId);
    setError(null);
    try {
      const favorite = await favoritesApi.addFavorite(cityId);
      updateList((list) => [favorite, ...list]); // newest first, like the API's ordering
      return true;
    } catch (err) {
      setError(errorMessages(err)[0]);
      return false;
    } finally {
      setBusyCityId(null);
    }
  }

  async function remove(favorite: FavoriteCity): Promise<boolean> {
    setBusyCityId(favorite.city.id);
    setError(null);
    try {
      await favoritesApi.removeFavorite(favorite.id);
      updateList((list) => list.filter((item) => item.id !== favorite.id));
      return true;
    } catch (err) {
      setError(errorMessages(err)[0]);
      return false;
    } finally {
      setBusyCityId(null);
    }
  }

  return {
    favorites,
    loading: userId !== null && !isCurrent && error === null,
    error,
    busyCityId,
    findByCity: (cityId: number) => favorites.find((favorite) => favorite.city.id === cityId),
    add,
    remove,
  };
}
