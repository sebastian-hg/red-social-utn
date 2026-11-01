import { HttpErrorResponse } from '@angular/common/http';

/** Convierte un error de la API en una lista de mensajes para mostrar al usuario. */
export function mensajesDeError(error: unknown): string[] {
  if (!(error instanceof HttpErrorResponse)) {
    return ['Ocurrió un error inesperado. Intentá nuevamente.'];
  }
  if (error.status === 0) {
    return ['No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.'];
  }
  const mensaje = error.error?.message;
  if (Array.isArray(mensaje)) return mensaje;
  if (typeof mensaje === 'string') return [mensaje];
  return ['Ocurrió un error inesperado. Intentá nuevamente.'];
}
