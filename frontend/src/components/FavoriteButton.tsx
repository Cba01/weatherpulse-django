type Props = {
  active: boolean;
  busy: boolean;
  onToggle: () => void;
};

export function FavoriteButton({ active, busy, onToggle }: Props) {
  const label = active ? "Quitar de favoritos" : "Agregar a favoritos";

  return (
    <button
      type="button"
      className="favorite-button"
      onClick={onToggle}
      disabled={busy}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
