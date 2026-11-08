import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { guardarImagen } from '../common/imagenes.js';
import { BASE_URL } from '../configuracion.js';
import { UsuarioDocument } from '../usuarios/schemas/usuario.schema.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { PayloadJwt } from './payload-jwt.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async registro(dto: RegistroDto, imagen?: Express.Multer.File) {
    if (await this.usuariosService.existe('correo', dto.correo)) {
      throw new ConflictException('El correo ya está registrado');
    }
    if (await this.usuariosService.existe('nombreUsuario', dto.nombreUsuario)) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    const imagenPerfil = imagen
      ? await guardarImagen(imagen, 'perfiles', BASE_URL)
      : null;

    const usuario = await this.usuariosService.crear({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo: dto.correo,
      nombreUsuario: dto.nombreUsuario,
      descripcion: dto.descripcion,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      password: await bcrypt.hash(dto.password, 10),
      imagenPerfil,
    });
    return this.sesion(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.buscarParaLogin(dto.usuario);
    if (!usuario || !(await bcrypt.compare(dto.password, usuario.password))) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    if (!usuario.activo) {
      throw new UnauthorizedException('Tu usuario está deshabilitado. Contactá a un administrador.');
    }
    return this.sesion(usuario);
  }

  /** Devuelve los datos actuales del dueño de un token ya validado. */
  async autorizar(payload: PayloadJwt) {
    const usuario = await this.usuariosService.buscarPorId(payload.sub);
    if (!usuario) {
      throw new UnauthorizedException('El usuario del token ya no existe');
    }
    if (!usuario.activo) {
      throw new UnauthorizedException('Tu usuario está deshabilitado');
    }
    return usuario.toJSON();
  }

  /** Emite un token nuevo con el mismo payload y 15 minutos de vigencia. */
  refrescar(payload: PayloadJwt) {
    return this.jwtService.signAsync(payload);
  }

  private async sesion(usuario: UsuarioDocument) {
    const payload: PayloadJwt = {
      sub: usuario.id,
      correo: usuario.correo,
      nombreUsuario: usuario.nombreUsuario,
      perfil: usuario.perfil,
    };
    return {
      usuario: usuario.toJSON(),
      token: await this.jwtService.signAsync(payload),
    };
  }
}
