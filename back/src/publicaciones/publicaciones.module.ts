import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosService } from './comentarios.service.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import {
  Comentario,
  ComentarioSchema,
} from './schemas/comentario.schema.js';
import {
  Publicacion,
  PublicacionSchema,
} from './schemas/publicacion.schema.js';

@Module({
  imports: [
    UsuariosModule,
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
  ],
  controllers: [PublicacionesController, ComentariosController, EstadisticasController],
  providers: [PublicacionesService, ComentariosService],
})
export class PublicacionesModule {}
