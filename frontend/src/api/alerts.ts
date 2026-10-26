import { api } from "./client";
import { fetchAllPages } from "./pagination";
import type { NewWeatherAlert, WeatherAlert } from "./types";

export function listAlerts(signal?: AbortSignal): Promise<WeatherAlert[]> {
  return fetchAllPages<WeatherAlert>("/alerts/", signal);
}

export async function createAlert(alert: NewWeatherAlert): Promise<WeatherAlert> {
  const { data } = await api.post<WeatherAlert>("/alerts/", alert);
  return data;
}

/** PATCH, not PUT: send only the field that changes. The serializer fills in the rest from the instance. */
export async function setAlertActive(alertId: number, isActive: boolean): Promise<WeatherAlert> {
  const { data } = await api.patch<WeatherAlert>(`/alerts/${alertId}/`, { is_active: isActive });
  return data;
}

export async function deleteAlert(alertId: number): Promise<void> {
  await api.delete(`/alerts/${alertId}/`);
}
