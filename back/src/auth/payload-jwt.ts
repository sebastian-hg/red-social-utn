import { Perfil } from '../usuarios/schemas/usuario.schema.js';

/** Datos que viajan dentro del token: quién es el usuario y su rol. */
export interface PayloadJwt {
  sub: string;
  correo: string;
  nombreUsuario: string;
  perfil: Perfil;
}

export const DURACION_TOKEN = '15m';
