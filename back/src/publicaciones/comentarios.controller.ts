import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { PayloadJwt } from '../auth/payload-jwt.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { ComentariosService } from './comentarios.service.js';
import { ComentarioDto } from './dto/comentario.dto.js';
import { PaginacionDto } from './dto/paginacion.dto.js';

@Controller('publicaciones/:publicacionId/comentarios')
@UseGuards(JwtAuthGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Get()
  listar(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: Types.ObjectId,
    @Query() paginacion: PaginacionDto,
  ) {
    return this.comentariosService.listar(publicacionId, paginacion);
  }

  @Post()
  async crear(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: Types.ObjectId,
    @Body() dto: ComentarioDto,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    const comentario = await this.comentariosService.crear(
      publicacionId,
      dto,
      usuario.sub,
    );
    return { mensaje: 'Comentario publicado', comentario };
  }

  @Put(':comentarioId')
  async editar(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: Types.ObjectId,
    @Param('comentarioId', ParseObjectIdPipe) comentarioId: Types.ObjectId,
    @Body() dto: ComentarioDto,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    const comentario = await this.comentariosService.editar(
      publicacionId,
      comentarioId,
      dto,
      usuario.sub,
    );
    return { mensaje: 'Comentario editado', comentario };
  }
}
