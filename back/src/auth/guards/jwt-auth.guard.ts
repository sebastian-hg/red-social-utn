import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PayloadJwt } from '../payload-jwt.js';

export type RequestConUsuario = Request & { usuario: PayloadJwt };

/** Exige un header "Authorization: Bearer <token>" válido y no vencido. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Falta el token de autenticación');
    }
    try {
      const { sub, correo, nombreUsuario, perfil } =
        await this.jwtService.verifyAsync<PayloadJwt>(token);
      request.usuario = { sub, correo, nombreUsuario, perfil };
    } catch {
      throw new UnauthorizedException('El token es inválido o está vencido');
    }
    return true;
  }
}
