export type Perfil = 'usuario' | 'administrador';

export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcion: string;
  imagenPerfil: string | null;
  perfil: Perfil;
  createdAt: string;
  updatedAt: string;
}

export interface RespuestaAuth {
  mensaje: string;
  usuario: Usuario;
  token?: string;
}
