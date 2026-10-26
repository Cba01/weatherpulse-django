import { api } from "./client";
import { fetchAllPages } from "./pagination";
import type { FavoriteCity } from "./types";

export function listFavorites(signal?: AbortSignal): Promise<FavoriteCity[]> {
  return fetchAllPages<FavoriteCity>("/favorites/", signal);
}

export async function addFavorite(cityId: number): Promise<FavoriteCity> {
  const { data } = await api.post<FavoriteCity>("/favorites/", { city_id: cityId });
  return data;
}

export async function removeFavorite(favoriteId: number): Promise<void> {
  await api.delete(`/favorites/${favoriteId}/`);
}
