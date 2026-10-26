import { useAuth } from "../auth/useAuth";
import { AlertForm } from "../components/AlertForm";
import { AlertList } from "../components/AlertList";
import { TopBar } from "../components/TopBar";
import { useAlerts } from "../hooks/useAlerts";

export function AlertsPage() {
  const { user } = useAuth();
  const { alerts, loading, error, busyId, create, toggleActive, remove } = useAlerts(user?.id ?? null);

  return (
    <>
      <TopBar />
      <main className="page">
        <h1>Mis alertas</h1>
        <p className="home__hint">Revisamos tus alertas activas cada 30 minutos.</p>

        <AlertForm onCreate={create} />

        {error && <p className="home__error">{error}</p>}
        {loading && <p className="home__hint">Cargando alertas…</p>}
        {!loading && alerts.length === 0 && <p className="home__hint">Aún no tienes alertas.</p>}
        {alerts.length > 0 && (
          <AlertList alerts={alerts} busyId={busyId} onToggle={toggleActive} onRemove={remove} />
        )}
      </main>
    </>
  );
}
