import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { PayloadJwt } from '../auth/payload-jwt.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { Perfil } from './schemas/usuario.schema.js';
import { AdminCrearUsuarioDto } from './dto/admin-crear-usuario.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  listar(@UsuarioActual() usuario: PayloadJwt) {
    this.validarAdministrador(usuario);
    return this.usuariosService.listar();
  }

  @Post()
  async crear(
    @Body() datos: AdminCrearUsuarioDto,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    this.validarAdministrador(usuario);
    const creado = await this.usuariosService.crearDesdeAdmin(datos);
    return { mensaje: 'Usuario creado correctamente', usuario: creado };
  }

  @Delete(':id')
  async deshabilitar(
    @Param('id') id: string,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    this.validarAdministrador(usuario);
    const actualizado = await this.usuariosService.cambiarActivo(id, false);
    return { mensaje: 'Usuario deshabilitado', usuario: actualizado };
  }

  @Post(':id/rehabilitar')
  async rehabilitar(
    @Param('id') id: string,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    this.validarAdministrador(usuario);
    const actualizado = await this.usuariosService.cambiarActivo(id, true);
    return { mensaje: 'Usuario habilitado', usuario: actualizado };
  }

  private validarAdministrador(usuario: PayloadJwt): void {
    if (usuario.perfil !== Perfil.Administrador) {
      throw new ForbiddenException('Se requiere perfil administrador');
    }
  }
}
