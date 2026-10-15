import { motion } from "motion/react";

import type { City, CurrentWeather } from "../api/types";
import { capitalize, formatCityTime } from "../utils/format";

type Props = {
  city: City;
  weather: CurrentWeather;
  updating: boolean;
};

export function WeatherCard({ city, weather, updating }: Props) {
  const condition = weather.weather[0];

  return (
    // key={city.id}: a new city remounts the card, replaying the entrance animation.
    <motion.article
      key={city.id}
      className="weather-card card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: updating ? 0.6 : 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header>
        <h2>
          {city.name}, <span>{city.country}</span>
        </h2>
        {condition && <p className="weather-card__description">{capitalize(condition.description)}</p>}
      </header>

      <div className="weather-card__main">
        {condition && (
          <img
            src={`https://openweathermap.org/img/wn/${condition.icon}@2x.png`}
            alt=""
            width={100}
            height={100}
          />
        )}
        <p className="weather-card__temp">{Math.round(weather.main.temp)}°C</p>
      </div>

      <dl className="weather-card__details">
        <div>
          <dt>Sensación</dt>
          <dd>{Math.round(weather.main.feels_like)}°C</dd>
        </div>
        <div>
          <dt>Humedad</dt>
          <dd>{weather.main.humidity}%</dd>
        </div>
        <div>
          <dt>Viento</dt>
          <dd>{Math.round(weather.wind.speed * 3.6)} km/h</dd>
        </div>
        <div>
          <dt>Amanecer</dt>
          <dd>{formatCityTime(weather.sys.sunrise, weather.timezone)}</dd>
        </div>
        <div>
          <dt>Atardecer</dt>
          <dd>{formatCityTime(weather.sys.sunset, weather.timezone)}</dd>
        </div>
      </dl>
    </motion.article>
  );
}
