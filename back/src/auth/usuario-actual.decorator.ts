import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestConUsuario } from './guards/jwt-auth.guard.js';

/** Inyecta el payload del token del usuario autenticado (requiere JwtAuthGuard). */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<RequestConUsuario>().usuario,
);
