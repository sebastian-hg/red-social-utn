import { Perfil } from './usuario';

export interface Autor {
  _id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  imagenPerfil: string | null;
  perfil: Perfil;
}

export interface Publicacion {
  _id: string;
  titulo: string;
  mensaje: string;
  imagen: string | null;
  autor: Autor;
  cantidadMeGusta: number;
  meGustaYo: boolean;
  cantidadComentarios: number;
  createdAt: string;
}

export type Orden = 'fecha' | 'meGusta';

export interface PaginaPublicaciones {
  total: number;
  offset: number;
  limit: number;
  publicaciones: Publicacion[];
}

export interface Comentario {
  _id: string;
  publicacion: string;
  autor: Autor;
  mensaje: string;
  modificado: boolean;
  createdAt: string;
}

export interface PaginaComentarios {
  total: number;
  offset: number;
  limit: number;
  comentarios: Comentario[];
}

export interface EstadoMeGusta {
  cantidadMeGusta: number;
  meGustaYo: boolean;
}
