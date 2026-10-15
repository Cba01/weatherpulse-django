import { api } from "./client";
import type { City, CurrentWeather } from "./types";

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const { data } = await api.get<City[]>("/cities/search/", { params: { q: query }, signal });
  return data;
}

export async function getCurrentWeather(lat: number, lon: number, signal?: AbortSignal): Promise<CurrentWeather> {
  const { data } = await api.get<CurrentWeather>("/weather/current/", { params: { lat, lon }, signal });
  return data;
}
