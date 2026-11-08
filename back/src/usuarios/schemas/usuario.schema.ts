import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum Perfil {
  Usuario = 'usuario',
  Administrador = 'administrador',
}

@Schema({
  collection: 'usuarios',
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.password;
      return ret;
    },
  },
})
export class Usuario {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, trim: true })
  apellido: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  correo: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  nombreUsuario: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true })
  fechaNacimiento: Date;

  @Prop({ default: '', trim: true })
  descripcion: string;

  @Prop({ type: String, default: null })
  imagenPerfil: string | null;

  @Prop({ type: String, enum: Perfil, default: Perfil.Usuario })
  perfil: Perfil;

  @Prop({ default: true })
  activo: boolean;
}

export type UsuarioDocument = HydratedDocument<Usuario>;
export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
