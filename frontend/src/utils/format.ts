import type { CurrentWeather, Place } from "../api/types";

/** "06:12" in the city's local time, from a UTC unix timestamp + the city's UTC offset. */
export function formatCityTime(unixSeconds: number, utcOffsetSeconds: number): string {
  // Shift the instant by the city's offset, then format it as if it were UTC.
  const shifted = new Date((unixSeconds + utcOffsetSeconds) * 1000);
  return shifted.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

/**
 * Display name for a place. A searched City brings its own name; a map
 * point borrows OpenWeatherMap's nearest locality, which is empty at sea.
 */
export function placeLabel(place: Place, weather: CurrentWeather): { name: string; country?: string } {
  return {
    name: place.name ?? (weather.name || "Ubicación seleccionada"),
    country: place.country ?? weather.sys.country,
  };
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
