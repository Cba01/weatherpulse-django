import { useEffect, useState } from "react";

import { errorMessages } from "../api/errors";
import type { City, CurrentWeather } from "../api/types";
import { getCurrentWeather } from "../api/weather";

export type ComparisonEntry = { city: City; weather: CurrentWeather | null; error: string | null };

/**
 * Current weather for several cities at once. `cities` must keep its
 * identity between renders (memoize it), since it's the effect's dependency.
 */
export function useWeatherComparison(cities: City[]) {
  const [result, setResult] = useState<{ cities: City[]; entries: ComparisonEntry[] } | null>(null);

  useEffect(() => {
    if (cities.length === 0) return;

    const controller = new AbortController();
    // allSettled, not all: one failing city must not throw away the others.
    Promise.allSettled(cities.map((city) => getCurrentWeather(city.lat, city.lon, controller.signal))).then(
      (outcomes) => {
        if (controller.signal.aborted) return;
        const entries = outcomes.map((outcome, i): ComparisonEntry =>
          outcome.status === "fulfilled"
            ? { city: cities[i], weather: outcome.value, error: null }
            : { city: cities[i], weather: null, error: errorMessages(outcome.reason)[0] },
        );
        setResult({ cities, entries });
      },
    );

    return () => controller.abort();
  }, [cities]);

  const isCurrent = result?.cities === cities;
  return {
    entries: isCurrent ? result.entries : [],
    loading: cities.length > 0 && !isCurrent,
  };
}
