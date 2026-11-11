import { Controller, ForbiddenException, Get, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { PayloadJwt } from '../auth/payload-jwt.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { Perfil } from '../usuarios/schemas/usuario.schema.js';
import { Comentario } from './schemas/comentario.schema.js';
import { Publicacion } from './schemas/publicacion.schema.js';

@Controller('estadisticas')
@UseGuards(JwtAuthGuard)
export class EstadisticasController {
  constructor(
    @InjectModel(Publicacion.name) private readonly publicaciones: Model<Publicacion>,
    @InjectModel(Comentario.name) private readonly comentarios: Model<Comentario>,
  ) {}

  private validar(usuario: PayloadJwt) {
    if (usuario.perfil !== Perfil.Administrador) {
      throw new ForbiddenException('Se requiere perfil administrador');
    }
  }

  private rango(desde?: string, hasta?: string) {
    const inicio = desde ? new Date(`${desde}T00:00:00.000Z`) : new Date(0);
    const fin = hasta ? new Date(`${hasta}T23:59:59.999Z`) : new Date();
    return { $gte: inicio, $lte: fin };
  }

  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query('desde') desde: string, @Query('hasta') hasta: string, @UsuarioActual() usuario: PayloadJwt) {
    this.validar(usuario);
    return this.publicaciones.aggregate([
      { $match: { createdAt: this.rango(desde, hasta), activa: { $ne: false } } },
      { $group: { _id: '$autor', cantidad: { $sum: 1 } } },
      { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'usuario' } },
      { $unwind: '$usuario' },
      { $project: { _id: 0, usuarioId: '$_id', nombre: { $concat: ['$usuario.nombre', ' ', '$usuario.apellido'] }, cantidad: 1 } },
      { $sort: { cantidad: -1 } },
    ]);
  }

  @Get('comentarios-por-dia')
  comentariosPorDia(@Query('desde') desde: string, @Query('hasta') hasta: string, @UsuarioActual() usuario: PayloadJwt) {
    this.validar(usuario);
    return this.comentarios.aggregate([
      { $match: { createdAt: this.rango(desde, hasta), activa: { $ne: false } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'UTC',
            },
          },
          cantidad: { $sum: 1 },
        },
      },
      { $project: { _id: 0, fecha: '$_id', cantidad: 1 } },
      { $sort: { fecha: 1 } },
    ]);
  }

  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query('desde') desde: string, @Query('hasta') hasta: string, @UsuarioActual() usuario: PayloadJwt) {
    this.validar(usuario);
    return this.comentarios.aggregate([
      { $match: { createdAt: this.rango(desde, hasta), activa: { $ne: false } } },
      { $group: { _id: '$publicacion', cantidad: { $sum: 1 } } },
      { $lookup: { from: 'publicaciones', localField: '_id', foreignField: '_id', as: 'publicacion' } },
      { $unwind: '$publicacion' },
      { $project: { _id: 0, titulo: '$publicacion.titulo', cantidad: 1 } },
      { $sort: { cantidad: -1 } },
    ]);
  }
}
