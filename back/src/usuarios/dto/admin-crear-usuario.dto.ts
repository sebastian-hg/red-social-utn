import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Perfil } from '../schemas/usuario.schema.js';

export class AdminCrearUsuarioDto {
  @IsString() @MaxLength(50) nombre: string;
  @IsString() @MaxLength(50) apellido: string;
  @IsEmail() correo: string;
  @Matches(/^[a-zA-Z0-9_.]{3,20}$/) nombreUsuario: string;
  @IsString() password: string;
  @IsDateString() fechaNacimiento: string;
  @IsOptional() @IsString() @MaxLength(200) descripcion?: string;
  @IsEnum(Perfil) perfil: Perfil;
}
