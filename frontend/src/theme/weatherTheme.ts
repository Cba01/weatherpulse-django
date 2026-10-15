import type { CurrentWeather } from "../api/types";

export type WeatherTheme = "default" | "clear" | "cloudy" | "rain" | "night";

const RAIN_GROUPS = new Set(["Rain", "Drizzle", "Thunderstorm"]);

/**
 * Picks the UI theme for a weather payload. Priority: rain > night > cloudy > clear.
 *
 * Night is decided with the API's own UTC timestamps (dt vs sunrise/sunset),
 * never the browser clock: viewing Tokyo from Lima must use Tokyo's daylight.
 */
export function getWeatherTheme(weather: CurrentWeather): WeatherTheme {
  const group = weather.weather[0]?.main ?? "";

  if (RAIN_GROUPS.has(group)) return "rain";

  const { sunrise, sunset } = weather.sys;
  if (weather.dt < sunrise || weather.dt > sunset) return "night";

  // Clouds, Mist, Fog, Haze, Snow, Smoke, Dust...: anything that isn't a clear sky.
  return group === "Clear" ? "clear" : "cloudy";
}
