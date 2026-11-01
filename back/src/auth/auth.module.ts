import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { DURACION_TOKEN } from './payload-jwt.js';

@Module({
  imports: [
    UsuariosModule,
    // Global para que JwtAuthGuard pueda usarse en cualquier módulo.
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'arena-jwt-secret-desarrollo-2026',
        signOptions: { expiresIn: DURACION_TOKEN },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
