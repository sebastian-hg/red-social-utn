import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { PayloadJwt } from '../auth/payload-jwt.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { opcionesImagen } from '../common/imagenes.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

@Controller('publicaciones')
@UseGuards(JwtAuthGuard)
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Get()
  listar(
    @Query() filtro: ListarPublicacionesDto,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    return this.publicacionesService.listar(filtro, usuario.sub);
  }

  @Get(':id')
  obtener(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    return this.publicacionesService.obtener(id, usuario.sub);
  }

  @Post()
  @UseInterceptors(FileInterceptor('imagen', opcionesImagen))
  async crear(
    @Body() dto: CrearPublicacionDto,
    @UsuarioActual() usuario: PayloadJwt,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    const publicacion = await this.publicacionesService.crear(
      dto,
      usuario.sub,
      imagen,
    );
    return { mensaje: 'Publicación creada', publicacion };
  }

  @Delete(':id')
  async eliminar(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    await this.publicacionesService.eliminar(id, usuario);
    return { mensaje: 'Publicación eliminada' };
  }

  @Post(':id/me-gusta')
  darMeGusta(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    return this.publicacionesService.darMeGusta(id, usuario.sub);
  }

  @Delete(':id/me-gusta')
  quitarMeGusta(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    return this.publicacionesService.quitarMeGusta(id, usuario.sub);
  }
}
