import { isAxiosError } from "axios";

/**
 * Flattens a DRF error response into readable messages.
 * DRF sends either {"detail": "..."} or {"field": ["msg", ...], ...}.
 */
export function errorMessages(error: unknown): string[] {
  if (!isAxiosError(error)) return ["Ocurrió un error inesperado."];
  if (!error.response) return ["No se pudo conectar con el servidor."];

  const data = error.response.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") return [`Error ${error.response.status}.`];

  return Object.entries(data).flatMap(([field, value]) => {
    const messages = Array.isArray(value) ? value.map(String) : [String(value)];
    return field === "detail" || field === "non_field_errors"
      ? messages
      : messages.map((message) => `${field}: ${message}`);
  });
}
