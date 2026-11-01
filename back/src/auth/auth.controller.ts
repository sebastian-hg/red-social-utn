import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../common/imagenes.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { PayloadJwt } from './payload-jwt.js';
import { UsuarioActual } from './usuario-actual.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @UseInterceptors(FileInterceptor('imagenPerfil', opcionesImagen))
  async registro(
    @Body() dto: RegistroDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    const sesion = await this.authService.registro(dto, imagen);
    return { mensaje: 'Usuario registrado correctamente', ...sesion };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const sesion = await this.authService.login(dto);
    return { mensaje: 'Inicio de sesión exitoso', ...sesion };
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
  async refrescar(@UsuarioActual() payload: PayloadJwt) {
    const token = await this.authService.refrescar(payload);
    return { mensaje: 'Sesión extendida', token };
  }
}
