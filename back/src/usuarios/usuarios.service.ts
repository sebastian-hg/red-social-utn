import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';

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
