import { isCancel } from "axios";
import { useEffect, useState } from "react";

import { errorMessages } from "../api/errors";
import type { City, CurrentWeather } from "../api/types";
import { getCurrentWeather } from "../api/weather";

type WeatherResult = { city: City; weather: CurrentWeather | null; error: string | null };

export function useCurrentWeather(city: City | null) {
  const [result, setResult] = useState<WeatherResult | null>(null);

  useEffect(() => {
    if (!city) return;

    const controller = new AbortController();
    getCurrentWeather(city.lat, city.lon, controller.signal)
      .then((weather) => setResult({ city, weather, error: null }))
      .catch((error) => {
        if (isCancel(error)) return;
        setResult({ city, weather: null, error: errorMessages(error)[0] });
      });

    return () => controller.abort();
  }, [city]);

  const isCurrent = city !== null && result?.city.id === city.id;
  return {
    // Keep showing the previous city's weather while the new one loads,
    // so the theme doesn't flash back to the default in between.
    // `weatherCity` says which city that weather belongs to.
    weather: result?.weather ?? null,
    weatherCity: result?.weather ? result.city : null,
    error: isCurrent ? result.error : null,
    loading: city !== null && !isCurrent,
  };
}
