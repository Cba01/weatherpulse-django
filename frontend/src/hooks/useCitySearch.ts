import { isAxiosError, isCancel } from "axios";
import { useEffect, useState } from "react";

import { errorMessages } from "../api/errors";
import type { City } from "../api/types";
import { searchCities } from "../api/weather";
import { useDebouncedValue } from "./useDebouncedValue";

const MIN_QUERY_LENGTH = 2;

type SearchResult = { query: string; cities: City[]; error: string | null };

export function useCitySearch(query: string) {
  const debouncedQuery = useDebouncedValue(query.trim(), 400);
  const [result, setResult] = useState<SearchResult | null>(null);
  const searchable = debouncedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!searchable) return;

    // Abort this request if the query changes before it answers, so a slow
    // response for "Lim" can't overwrite the results for "Lima".
    const controller = new AbortController();
    searchCities(debouncedQuery, controller.signal)
      .then((cities) => setResult({ query: debouncedQuery, cities, error: null }))
      .catch((error) => {
        if (isCancel(error)) return;
        const notFound = isAxiosError(error) && error.response?.status === 404;
        setResult({
          query: debouncedQuery,
          cities: [],
          error: notFound ? "No se encontraron ciudades." : errorMessages(error)[0],
        });
      });

    return () => controller.abort();
  }, [debouncedQuery, searchable]);

  // Derived instead of stored: a result only counts if it answers the
  // current query, so stale results never show and no reset is needed.
  const current = searchable && result?.query === debouncedQuery ? result : null;
  return {
    cities: current?.cities ?? [],
    error: current?.error ?? null,
    loading: query.trim().length >= MIN_QUERY_LENGTH && !current,
  };
}
