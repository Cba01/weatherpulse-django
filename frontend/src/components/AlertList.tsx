import type { WeatherAlert } from "../api/types";
import { describeCondition } from "../utils/alerts";
import { formatRelative } from "../utils/format";

type Props = {
  alerts: WeatherAlert[];
  busyId: number | null;
  onToggle: (alert: WeatherAlert) => void;
  onRemove: (alert: WeatherAlert) => void;
};

export function AlertList({ alerts, busyId, onToggle, onRemove }: Props) {
  return (
    <ul className="alert-list card">
      {alerts.map((alert) => (
        <li key={alert.id} className={alert.is_active ? undefined : "alert-list__item--inactive"}>
          <div>
            <strong>{describeCondition(alert)}</strong> en {alert.city.name}, {alert.city.country}
            <small>
              {alert.last_triggered
                ? `Última activación: ${formatRelative(alert.last_triggered)}`
                : "Aún no se ha activado"}
            </small>
          </div>
          <label className="alert-list__toggle">
            <input
              type="checkbox"
              checked={alert.is_active}
              onChange={() => onToggle(alert)}
              disabled={busyId === alert.id}
            />
            Activa
          </label>
          <button
            type="button"
            className="danger-button"
            onClick={() => onRemove(alert)}
            disabled={busyId === alert.id}
          >
            Borrar
          </button>
        </li>
      ))}
    </ul>
  );
}
