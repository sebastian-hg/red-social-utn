import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { NOMBRE_COOKIE_AUTH } from '../payload-jwt.js';
import { PayloadJwtVerificado } from '../payload-jwt.js';
import { UsuariosService } from '../../usuarios/usuarios.service.js';

export type RequestConUsuario = Request & { usuario: PayloadJwtVerificado };

/** Valida el JWT enviado en la cookie o, por compatibilidad, en Bearer. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Optional() private readonly usuariosService?: UsuariosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const [tipo, tokenBearer] = request.headers.authorization?.split(' ') ?? [];
    const token = tipo === 'Bearer' && tokenBearer
      ? tokenBearer
      : request.cookies?.[NOMBRE_COOKIE_AUTH];

    if (!token) {
      throw new UnauthorizedException('Falta el token de autenticación');
    }
    try {
      const { sub, correo, nombreUsuario, perfil, iat, exp } =
        await this.jwtService.verifyAsync<PayloadJwtVerificado>(token);
      if (typeof iat !== 'number' || typeof exp !== 'number') {
        throw new UnauthorizedException('El token no contiene sus fechas de emisión y vencimiento');
      }
      request.usuario = { sub, correo, nombreUsuario, perfil, iat, exp };
      if (this.usuariosService) {
        const usuario = await this.usuariosService.buscarPorId(sub);
        if (!usuario || !usuario.activo) {
          throw new UnauthorizedException('Tu usuario está deshabilitado');
        }
      }
    } catch {
      throw new UnauthorizedException('El token es inválido o está vencido');
    }
    return true;
  }
}
