import { api } from "./client";
import type { Paginated } from "./types";

/** Every item of a paginated list endpoint, following `next` until the last page. */
export async function fetchAllPages<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = [];
  let url: string | null = path;
  while (url) {
    // `next` is absolute; axios uses an absolute URL as-is instead of joining it to baseURL.
    const response: { data: Paginated<T> } = await api.get(url, { signal });
    items.push(...response.data.results);
    url = response.data.next;
  }
  return items;
}
