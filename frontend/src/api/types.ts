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

/**
 * Anything the weather can be fetched for: a stored City (structurally a
 * Place) or a point clicked on the map, which has no id and no name yet.
 */
export type Place = {
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
