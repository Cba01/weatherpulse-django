import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import type { City } from "../api/types";
import { useCitySearch } from "../hooks/useCitySearch";

type Props = {
  onSelect: (city: City) => void;
};

export function CitySearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const { cities, error, loading } = useCitySearch(query);

  function select(city: City) {
    onSelect(city);
    setQuery("");
  }

  return (
    <div className="city-search">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ciudad…"
        aria-label="Buscar ciudad"
      />
      {loading && <p className="city-search__status">Buscando…</p>}
      {error && <p className="city-search__status">{error}</p>}
      <AnimatePresence>
        {cities.length > 0 && (
          <motion.ul
            className="city-search__results card"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {cities.map((city) => (
              <li key={city.id}>
                <button type="button" onClick={() => select(city)}>
                  {city.name}, <span>{city.country}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
