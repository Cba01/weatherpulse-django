import { isCancel } from "axios";
import { useEffect, useState } from "react";

import * as alertsApi from "../api/alerts";
import { errorMessages } from "../api/errors";
import type { NewWeatherAlert, WeatherAlert } from "../api/types";

type Loaded = { userId: number; alerts: WeatherAlert[] };

/** The logged-in user's alerts, keyed by user like useFavorites. */
export function useAlerts(userId: number | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (userId === null) return;

    const controller = new AbortController();
    alertsApi
      .listAlerts(controller.signal)
      .then((alerts) => {
        setLoaded({ userId, alerts });
        setError(null);
      })
      .catch((err) => {
        if (!isCancel(err)) setError(errorMessages(err)[0]);
      });

    return () => controller.abort();
  }, [userId]);

  const isCurrent = userId !== null && loaded?.userId === userId;
  const alerts = isCurrent ? loaded.alerts : [];

  function updateList(change: (alerts: WeatherAlert[]) => WeatherAlert[]) {
    setLoaded((current) => (current ? { ...current, alerts: change(current.alerts) } : current));
  }

  /** Throws on failure: the form needs the raw error to place field messages. */
  async function create(alert: NewWeatherAlert) {
    const created = await alertsApi.createAlert(alert);
    updateList((list) => [created, ...list]); // the API lists newest first
  }

  async function toggleActive(alert: WeatherAlert) {
    setBusyId(alert.id);
    setError(null);
    try {
      const updated = await alertsApi.setAlertActive(alert.id, !alert.is_active);
      updateList((list) => list.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(errorMessages(err)[0]);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(alert: WeatherAlert) {
    setBusyId(alert.id);
    setError(null);
    try {
      await alertsApi.deleteAlert(alert.id);
      updateList((list) => list.filter((item) => item.id !== alert.id));
    } catch (err) {
      setError(errorMessages(err)[0]);
    } finally {
      setBusyId(null);
    }
  }

  return {
    alerts,
    loading: userId !== null && !isCurrent && error === null,
    error,
    busyId,
    create,
    toggleActive,
    remove,
  };
}
