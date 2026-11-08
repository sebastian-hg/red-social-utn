import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ComentarioDto } from './dto/comentario.dto.js';
import { PaginacionDto } from './dto/paginacion.dto.js';
import {
  CAMPOS_AUTOR,
  PublicacionesService,
} from './publicaciones.service.js';
import { Comentario } from './schemas/comentario.schema.js';

const AUTOR = { path: 'autor', select: CAMPOS_AUTOR };

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name)
    private readonly comentarioModel: Model<Comentario>,
    private readonly publicacionesService: PublicacionesService,
  ) {}

  /** Comentarios de una publicación, los más recientes primero. */
  async listar(publicacionId: Types.ObjectId, paginacion: PaginacionDto) {
    await this.publicacionesService.asegurarQueExiste(publicacionId);
    const filtro = { publicacion: publicacionId, activa: { $ne: false } };
    const [total, comentarios] = await Promise.all([
      this.comentarioModel.countDocuments(filtro),
      this.comentarioModel
        .find(filtro)
        .sort({ createdAt: -1, _id: -1 })
        .skip(paginacion.offset)
        .limit(paginacion.limit)
        .populate(AUTOR),
    ]);
    return {
      total,
      offset: paginacion.offset,
      limit: paginacion.limit,
      comentarios,
    };
  }

  async crear(
    publicacionId: Types.ObjectId,
    dto: ComentarioDto,
    autorId: string,
  ) {
    await this.publicacionesService.asegurarQueExiste(publicacionId);
    const comentario = await this.comentarioModel.create({
      publicacion: publicacionId,
      autor: new Types.ObjectId(autorId),
      mensaje: dto.mensaje,
      activa: true,
    });
    return comentario.populate(AUTOR);
  }

  /** Solo el autor puede editar; el comentario queda marcado como modificado. */
  async editar(
    publicacionId: Types.ObjectId,
    comentarioId: Types.ObjectId,
    dto: ComentarioDto,
    usuarioId: string,
  ) {
    await this.publicacionesService.asegurarQueExiste(publicacionId);
    const comentario = await this.comentarioModel.findOne({
      _id: comentarioId,
      publicacion: publicacionId,
      activa: { $ne: false },
    });
    if (!comentario) throw new NotFoundException('El comentario no existe');
    if (!comentario.autor.equals(usuarioId)) {
      throw new ForbiddenException('Solo el autor puede editar su comentario');
    }
    comentario.mensaje = dto.mensaje;
    comentario.modificado = true;
    await comentario.save();
    return comentario.populate(AUTOR);
  }
}
