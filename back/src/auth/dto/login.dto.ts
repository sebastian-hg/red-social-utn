import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { PASSWORD_MENSAJE, PASSWORD_REGEX } from './registro.dto.js';

export class LoginDto {
  /** Correo o nombre de usuario. */
  @IsString()
  @IsNotEmpty({ message: 'Ingresá tu correo o nombre de usuario' })
  usuario: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MENSAJE })
  password: string;
}
