import { Perfil } from '../usuarios/schemas/usuario.schema.js';

/** Datos que viajan dentro del token: quién es el usuario y su rol. */
export interface PayloadJwt {
  sub: string;
  correo: string;
  nombreUsuario: string;
  perfil: Perfil;
}

export const DURACION_TOKEN = '15m';
export const NOMBRE_COOKIE_AUTH = 'arena_token';

const factoresDuracion = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
} as const;

export function duracionJwtEnMilisegundos(duracion: string): number {
  const coincidencia = duracion.match(/^([0-9]+)(ms|s|m|h|d|w)$/);
  if (!coincidencia) throw new Error(`Duración JWT inválida: ${duracion}`);

  const [, cantidad, unidad] = coincidencia;
  return Number(cantidad) * factoresDuracion[unidad as keyof typeof factoresDuracion];
}

export const DURACION_TOKEN_MS = duracionJwtEnMilisegundos(DURACION_TOKEN);
