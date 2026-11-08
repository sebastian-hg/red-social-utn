import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';
import { AdminCrearUsuarioDto } from './dto/admin-crear-usuario.dto.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
  ) {}

  crear(datos: Partial<Usuario>): Promise<UsuarioDocument> {
    return this.usuarioModel.create(datos);
  }

  buscarPorId(id: string) {
    return this.usuarioModel.findById(id);
  }

  listar() {
    return this.usuarioModel.find().sort({ createdAt: -1 });
  }

  async crearDesdeAdmin(datos: AdminCrearUsuarioDto): Promise<UsuarioDocument> {
    if (await this.existe('correo', datos.correo)) {
      throw new ConflictException('El correo ya está registrado');
    }
    if (await this.existe('nombreUsuario', datos.nombreUsuario)) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }
    return this.usuarioModel.create({
      ...datos,
      correo: datos.correo.toLowerCase().trim(),
      nombreUsuario: datos.nombreUsuario.toLowerCase().trim(),
      fechaNacimiento: new Date(datos.fechaNacimiento),
      password: await bcrypt.hash(datos.password, 10),
      activo: true,
    });
  }

  async cambiarActivo(id: string, activo: boolean) {
    const usuario = await this.usuarioModel.findByIdAndUpdate(
      id,
      { activo },
      { new: true },
    );
    if (!usuario) throw new NotFoundException('El usuario no existe');
    return usuario;
  }

  existe(campo: 'correo' | 'nombreUsuario', valor: string) {
    return this.usuarioModel.exists({ [campo]: valor.toLowerCase().trim() });
  }

  /** Busca por correo o nombre de usuario e incluye el hash de la contraseña. */
  buscarParaLogin(usuarioOCorreo: string) {
    const valor = usuarioOCorreo.toLowerCase().trim();
    return this.usuarioModel
      .findOne({ $or: [{ correo: valor }, { nombreUsuario: valor }] })
      .select('+password');
  }
}
