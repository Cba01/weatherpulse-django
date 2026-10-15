import { api } from "./client";
import type { FavoriteCity, Paginated } from "./types";

/** Every favorite, following `next` across pages (the API pages by 20). */
export async function listFavorites(signal?: AbortSignal): Promise<FavoriteCity[]> {
  const favorites: FavoriteCity[] = [];
  let url: string | null = "/favorites/";
  while (url) {
    // `next` is absolute; axios uses an absolute URL as-is instead of joining it to baseURL.
    const response: { data: Paginated<FavoriteCity> } = await api.get(url, { signal });
    favorites.push(...response.data.results);
    url = response.data.next;
  }
  return favorites;
}

export async function addFavorite(cityId: number): Promise<FavoriteCity> {
  const { data } = await api.post<FavoriteCity>("/favorites/", { city_id: cityId });
  return data;
}

export async function removeFavorite(favoriteId: number): Promise<void> {
  await api.delete(`/favorites/${favoriteId}/`);
}
