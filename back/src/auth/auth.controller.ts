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
import type { PayloadJwt } from './payload-jwt.js';
import { UsuarioActual } from './usuario-actual.decorator.js';
import { DURACION_TOKEN_MS } from './payload-jwt.js';

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
    return { mensaje: 'Usuario registrado correctamente', usuario: sesion.usuario };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sesion = await this.authService.login(dto);
    this.establecerCookie(response, sesion.token);
    return { mensaje: 'Inicio de sesión exitoso', usuario: sesion.usuario };
  }

  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async autorizar(@UsuarioActual() payload: PayloadJwt) {
    const usuario = await this.authService.autorizar(payload);
    return { mensaje: 'Token válido', usuario };
  }

  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async refrescar(
    @UsuarioActual() payload: PayloadJwt,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = await this.authService.refrescar(payload);
    this.establecerCookie(response, token);
    return { mensaje: 'Sesión extendida' };
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
      maxAge: DURACION_TOKEN_MS,
    });
  }

  private opcionesCookie(): CookieOptions {
    return {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    };
  }
}
