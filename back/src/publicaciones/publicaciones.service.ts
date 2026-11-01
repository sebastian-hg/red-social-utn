import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { PayloadJwt } from '../auth/payload-jwt.js';
import { guardarImagen } from '../common/imagenes.js';
import { BASE_URL } from '../configuracion.js';
import { Perfil } from '../usuarios/schemas/usuario.schema.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { Publicacion } from './schemas/publicacion.schema.js';

export const CAMPOS_AUTOR = {
  nombre: 1,
  apellido: 1,
  nombreUsuario: 1,
  imagenPerfil: 1,
  perfil: 1,
};

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<Publicacion>,
  ) {}

  async listar(filtro: ListarPublicacionesDto, usuarioId: string) {
    const match: Record<string, unknown> = { activa: true };
    if (filtro.usuario) match.autor = new Types.ObjectId(filtro.usuario);
    const orden: Record<string, 1 | -1> =
      filtro.orden === 'meGusta'
        ? { cantidadMeGusta: -1, createdAt: -1, _id: -1 }
        : { createdAt: -1, _id: -1 };

    const [resultado] = await this.publicacionModel.aggregate<{
      total: { n: number }[];
      publicaciones: unknown[];
    }>([
      { $match: match },
      { $addFields: { cantidadMeGusta: { $size: '$meGusta' } } },
      {
        $facet: {
          total: [{ $count: 'n' }],
          publicaciones: [
            { $sort: orden },
            { $skip: filtro.offset },
            { $limit: filtro.limit },
            ...this.vista(usuarioId),
          ],
        },
      },
    ]);

    return {
      total: resultado.total[0]?.n ?? 0,
      offset: filtro.offset,
      limit: filtro.limit,
      publicaciones: resultado.publicaciones,
    };
  }

  async obtener(id: Types.ObjectId, usuarioId: string) {
    const [publicacion] = await this.publicacionModel.aggregate([
      { $match: { _id: id, activa: true } },
      ...this.vista(usuarioId),
    ]);
    if (!publicacion) throw new NotFoundException('La publicación no existe');
    return publicacion as unknown;
  }

  async crear(
    dto: CrearPublicacionDto,
    autorId: string,
    imagen?: Express.Multer.File,
  ) {
    const url = imagen
      ? await guardarImagen(
          imagen,
          'publicaciones',
          BASE_URL,
        )
      : null;
    const publicacion = await this.publicacionModel.create({
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      imagen: url,
      autor: new Types.ObjectId(autorId),
    });
    return this.obtener(publicacion._id, autorId);
  }

  /** Baja lógica: solo el autor o un administrador. */
  async eliminar(id: Types.ObjectId, usuario: PayloadJwt) {
    const publicacion = await this.publicacionModel.findOne({
      _id: id,
      activa: true,
    });
    if (!publicacion) throw new NotFoundException('La publicación no existe');
    const esAutor = publicacion.autor.equals(usuario.sub);
    if (!esAutor && usuario.perfil !== Perfil.Administrador) {
      throw new ForbiddenException(
        'Solo el autor o un administrador pueden eliminar esta publicación',
      );
    }
    publicacion.activa = false;
    await publicacion.save();
  }

  async darMeGusta(id: Types.ObjectId, usuarioId: string) {
    const uid = new Types.ObjectId(usuarioId);
    const { modifiedCount } = await this.publicacionModel.updateOne(
      { _id: id, activa: true, meGusta: { $ne: uid } },
      { $push: { meGusta: uid } },
    );
    if (!modifiedCount) {
      await this.asegurarQueExiste(id);
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }
    return this.estadoMeGusta(id, true);
  }

  async quitarMeGusta(id: Types.ObjectId, usuarioId: string) {
    const uid = new Types.ObjectId(usuarioId);
    const { modifiedCount } = await this.publicacionModel.updateOne(
      { _id: id, activa: true, meGusta: uid },
      { $pull: { meGusta: uid } },
    );
    if (!modifiedCount) {
      await this.asegurarQueExiste(id);
      throw new ConflictException(
        'No le habías dado me gusta a esta publicación',
      );
    }
    return this.estadoMeGusta(id, false);
  }

  async asegurarQueExiste(id: Types.ObjectId) {
    if (!(await this.publicacionModel.exists({ _id: id, activa: true }))) {
      throw new NotFoundException('La publicación no existe');
    }
  }

  private async estadoMeGusta(id: Types.ObjectId, meGustaYo: boolean) {
    const publicacion = await this.publicacionModel
      .findById(id)
      .select('meGusta');
    return { cantidadMeGusta: publicacion?.meGusta.length ?? 0, meGustaYo };
  }

  /** Etapas que dan forma a una publicación para la respuesta de la API. */
  private vista(usuarioId: string): PipelineStage.FacetPipelineStage[] {
    return [
      {
        $lookup: {
          from: 'usuarios',
          localField: 'autor',
          foreignField: '_id',
          as: 'autor',
          pipeline: [{ $project: CAMPOS_AUTOR }],
        },
      },
      { $unwind: '$autor' },
      {
        $lookup: {
          from: 'comentarios',
          localField: '_id',
          foreignField: 'publicacion',
          as: 'comentarios',
          pipeline: [{ $count: 'n' }],
        },
      },
      {
        $addFields: {
          cantidadMeGusta: { $size: '$meGusta' },
          meGustaYo: { $in: [new Types.ObjectId(usuarioId), '$meGusta'] },
          cantidadComentarios: {
            $ifNull: [{ $first: '$comentarios.n' }, 0],
          },
        },
      },
      { $project: { meGusta: 0, activa: 0, comentarios: 0 } },
    ];
  }
}
