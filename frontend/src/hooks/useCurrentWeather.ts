import { isCancel } from "axios";
import { useEffect, useState } from "react";

import { errorMessages } from "../api/errors";
import type { CurrentWeather, Place } from "../api/types";
import { getCurrentWeather } from "../api/weather";

type WeatherResult = { place: Place; weather: CurrentWeather | null; error: string | null };

export function useCurrentWeather(place: Place | null) {
  const [result, setResult] = useState<WeatherResult | null>(null);

  useEffect(() => {
    if (!place) return;

    const controller = new AbortController();
    getCurrentWeather(place.lat, place.lon, controller.signal)
      .then((weather) => setResult({ place, weather, error: null }))
      .catch((error) => {
        if (isCancel(error)) return;
        setResult({ place, weather: null, error: errorMessages(error)[0] });
      });

    return () => controller.abort();
  }, [place]);

  // Compare by identity, not by id: map points have no id. Every selection
  // creates a new object, so "same object" means "same selection".
  const isCurrent = place !== null && result?.place === place;
  return {
    // Keep showing the previous place's weather while the new one loads,
    // so the theme doesn't flash back to the default in between.
    // `weatherPlace` says which place that weather belongs to.
    weather: result?.weather ?? null,
    weatherPlace: result?.weather ? result.place : null,
    error: isCurrent ? result.error : null,
    loading: place !== null && !isCurrent,
  };
}
