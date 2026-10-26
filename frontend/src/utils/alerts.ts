import type { AlertCondition, WeatherAlert } from "../api/types";

export const CONDITION_LABELS: Record<AlertCondition, string> = {
  rain: "Lluvia",
  temp_below: "Temperatura menor que",
  temp_above: "Temperatura mayor que",
};

/** "Lluvia" or "Temperatura menor que 5 °C". */
export function describeCondition(alert: Pick<WeatherAlert, "condition" | "threshold">): string {
  const label = CONDITION_LABELS[alert.condition];
  return alert.threshold === null ? label : `${label} ${alert.threshold} °C`;
}
