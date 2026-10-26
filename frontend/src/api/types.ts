// Shapes of the JSON returned by the Django API (see the DRF serializers).

export type User = {
  id: number;
  username: string;
  email: string;
};

export type Tokens = {
  access: string;
  refresh: string;
};

export type City = {
  id: number;
  name: string;
  country: string;
  lat: number;
  lon: number;
};

/** DRF's PageNumberPagination envelope. `next` is an absolute URL, or null on the last page. */
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type FavoriteCity = {
  id: number;
  city: City;
  added_at: string; // ISO 8601
};

export type AlertCondition = "rain" | "temp_below" | "temp_above";

export type WeatherAlert = {
  id: number;
  city: City;
  condition: AlertCondition;
  threshold: number | null; // °C; null for rain alerts
  is_active: boolean;
  last_triggered: string | null; // ISO 8601, set by the Celery task
};

/**
 * Body for POST /api/alerts/. A discriminated union: `condition` decides
 * which variant you're holding, so TypeScript only lets you read (and
 * forces you to send) `threshold` on temperature alerts.
 */
export type NewWeatherAlert = { city_id: number } & (
  | { condition: "rain" }
  | { condition: "temp_below" | "temp_above"; threshold: number }
);

/**
 * Anything the weather can be fetched for: a stored City (structurally a
 * Place) or a point clicked on the map, which has no id and no name yet.
 */
export type Place = {
  id?: number; // only stored cities have one
  lat: number;
  lon: number;
  name?: string;
  country?: string;
};

/** The parts of OpenWeatherMap's /data/2.5/weather payload the UI uses. */
export type CurrentWeather = {
  name: string; // nearest locality; "" over the ocean
  dt: number; // measurement time, unix seconds (UTC)
  timezone: number; // city's offset from UTC, in seconds
  weather: { main: string; description: string; icon: string }[];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number }; // m/s
  sys: { sunrise: number; sunset: number; country?: string }; // times: unix seconds (UTC)
};
