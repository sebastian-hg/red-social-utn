import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import type { CookieOptions, Response } from 'express';
import { opcionesImagen } from '../common/imagenes.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { NOMBRE_COOKIE_AUTH } from './payload-jwt.js';
import type { PayloadJwtVerificado } from './payload-jwt.js';
import { UsuarioActual } from './usuario-actual.decorator.js';

const DURACION_COOKIE_AUTH_MS = 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @UseInterceptors(FileInterceptor('imagenPerfil', opcionesImagen))
  async registro(
    @Body() dto: RegistroDto,
    @UploadedFile() imagen: Express.Multer.File | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sesion = await this.authService.registro(dto, imagen);
    this.establecerCookie(response, sesion.token);
    return {
      mensaje: 'Usuario registrado correctamente',
      usuario: sesion.usuario,
      iat: sesion.iat,
      exp: sesion.exp,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sesion = await this.authService.login(dto);
    this.establecerCookie(response, sesion.token);
    return {
      mensaje: 'Inicio de sesión exitoso',
      usuario: sesion.usuario,
      iat: sesion.iat,
      exp: sesion.exp,
    };
  }

  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async autorizar(@UsuarioActual() payload: PayloadJwtVerificado) {
    const usuario = await this.authService.autorizar(payload);
    return { mensaje: 'Token válido', usuario, iat: payload.iat, exp: payload.exp };
  }

  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async refrescar(
    @UsuarioActual() payload: PayloadJwtVerificado,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sesion = await this.authService.refrescar(payload);
    this.establecerCookie(response, sesion.token);
    return { mensaje: 'Sesión extendida', iat: sesion.iat, exp: sesion.exp };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(NOMBRE_COOKIE_AUTH, {
      ...this.opcionesCookie(),
      expires: new Date(0),
    });
    return { mensaje: 'Sesión cerrada' };
  }

  private establecerCookie(response: Response, token: string): void {
    response.cookie(NOMBRE_COOKIE_AUTH, token, {
      ...this.opcionesCookie(),
      maxAge: DURACION_COOKIE_AUTH_MS,
    });
  }

  private opcionesCookie(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };
  }
}
