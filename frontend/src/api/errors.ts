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

/**
 * Like errorMessages, but keeps DRF's per-field errors apart so a form can
 * show each one under its own input. Errors for fields the form doesn't
 * render (and "detail"/network errors) end up in `general`.
 */
export function formErrors<F extends string>(
  error: unknown,
  fields: readonly F[],
): { byField: Partial<Record<F, string>>; general: string[] } {
  const data = isAxiosError(error) ? (error.response?.data as Record<string, unknown> | undefined) : undefined;
  if (!data || typeof data !== "object") return { byField: {}, general: errorMessages(error) };

  const byField: Partial<Record<F, string>> = {};
  const general: string[] = [];
  for (const [field, value] of Object.entries(data)) {
    const message = Array.isArray(value) ? value.map(String).join(" ") : String(value);
    if ((fields as readonly string[]).includes(field)) byField[field as F] = message;
    else general.push(message);
  }
  return { byField, general };
}
