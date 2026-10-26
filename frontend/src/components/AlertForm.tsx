import { useState, type FormEvent } from "react";

import { formErrors } from "../api/errors";
import type { AlertCondition, City, NewWeatherAlert } from "../api/types";
import { CONDITION_LABELS } from "../utils/alerts";
import { CitySearch } from "./CitySearch";

const FIELDS = ["city_id", "condition", "threshold"] as const;
type Field = (typeof FIELDS)[number];
type Errors = { byField: Partial<Record<Field, string>>; general: string[] };

const NO_ERRORS: Errors = { byField: {}, general: [] };

/** The switch narrows `condition`, so each branch builds exactly one variant of the union. */
function toPayload(cityId: number, condition: AlertCondition, threshold: number): NewWeatherAlert {
  switch (condition) {
    case "rain":
      return { city_id: cityId, condition };
    case "temp_below":
    case "temp_above":
      return { city_id: cityId, condition, threshold };
  }
}

type Props = { onCreate: (alert: NewWeatherAlert) => Promise<void> };

export function AlertForm({ onCreate }: Props) {
  const [city, setCity] = useState<City | null>(null);
  const [condition, setCondition] = useState<AlertCondition>("rain");
  // Kept as the raw input text: "" must stay "empty", not become 0.
  const [threshold, setThreshold] = useState("");
  const [errors, setErrors] = useState<Errors>(NO_ERRORS);
  const [submitting, setSubmitting] = useState(false);

  const needsThreshold = condition !== "rain";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Mirrors the serializer's validate() for instant feedback. The server
    // still validates everything; if they ever disagree, the server wins.
    const value = Number(threshold);
    const clientErrors: Errors["byField"] = {};
    if (!city) clientErrors.city_id = "Elige una ciudad.";
    if (needsThreshold && (threshold.trim() === "" || !Number.isFinite(value))) {
      clientErrors.threshold = "Indica una temperatura en °C.";
    }
    if (!city || Object.keys(clientErrors).length > 0) {
      setErrors({ byField: clientErrors, general: [] });
      return;
    }

    setSubmitting(true);
    setErrors(NO_ERRORS);
    try {
      await onCreate(toPayload(city.id, condition, value));
      setCity(null);
      setCondition("rain");
      setThreshold("");
    } catch (error) {
      setErrors(formErrors(error, FIELDS));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="alert-form card">
      <h2>Nueva alerta</h2>

      {/* Outside the <form>: Enter in the search box must not submit the alert. */}
      <div className="alert-form__field">
        <span className="alert-form__label">Ciudad</span>
        {city ? (
          <p className="alert-form__city">
            {city.name}, <span>{city.country}</span>
            <button type="button" className="link-button" onClick={() => setCity(null)}>
              Cambiar
            </button>
          </p>
        ) : (
          <CitySearch onSelect={setCity} />
        )}
        {errors.byField.city_id && <p className="field-error">{errors.byField.city_id}</p>}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="alert-form__row">
          <label className="alert-form__field">
            <span className="alert-form__label">Condición</span>
            <select value={condition} onChange={(e) => setCondition(e.target.value as AlertCondition)}>
              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.byField.condition && <p className="field-error">{errors.byField.condition}</p>}
          </label>

          {needsThreshold && (
            <label className="alert-form__field">
              <span className="alert-form__label">Umbral (°C)</span>
              <input
                type="number"
                step="0.5"
                inputMode="decimal"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                aria-invalid={errors.byField.threshold ? true : undefined}
              />
              {errors.byField.threshold && <p className="field-error">{errors.byField.threshold}</p>}
            </label>
          )}
        </div>

        {errors.general.length > 0 && (
          <ul className="errors">
            {errors.general.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creando…" : "Crear alerta"}
        </button>
      </form>
    </section>
  );
}
