import { motion } from "motion/react";

import type { ComparisonEntry } from "../hooks/useWeatherComparison";
import { capitalize } from "../utils/format";

type Props = { entries: ComparisonEntry[] };

export function WeatherComparison({ entries }: Props) {
  // Highlight extremes only when there's an actual difference to point at.
  const temps = entries.flatMap((entry) => (entry.weather ? [entry.weather.main.temp] : []));
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  const hasExtremes = temps.length >= 2 && max !== min;

  return (
    <div className="comparison">
      {entries.map(({ city, weather, error }, i) => {
        const condition = weather?.weather[0];
        const badge =
          hasExtremes && weather?.main.temp === max ? "Más cálida" : hasExtremes && weather?.main.temp === min ? "Más fría" : null;

        return (
          <motion.article
            key={city.id}
            className="comparison__column card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
          >
            <h3>
              {city.name}
              <span>, {city.country}</span>
            </h3>
            {badge && <p className="comparison__badge">{badge}</p>}

            {error && <p className="home__error">{error}</p>}
            {weather && (
              <>
                {condition && (
                  <img
                    src={`https://openweathermap.org/img/wn/${condition.icon}@2x.png`}
                    alt=""
                    width={64}
                    height={64}
                  />
                )}
                <p className="comparison__temp">{Math.round(weather.main.temp)}°C</p>
                {condition && <p className="comparison__description">{capitalize(condition.description)}</p>}
                <dl>
                  <dt>Sensación</dt>
                  <dd>{Math.round(weather.main.feels_like)}°C</dd>
                  <dt>Humedad</dt>
                  <dd>{weather.main.humidity}%</dd>
                  <dt>Viento</dt>
                  <dd>{Math.round(weather.wind.speed * 3.6)} km/h</dd>
                </dl>
              </>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}
