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

const relativeTime = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "hace 2 horas", "ayer"… from an ISO date. Uses the largest unit that fits. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return relativeTime.format(seconds, "second");
}
