import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// El archivo queda en memoria y solo se escribe a disco cuando el resto de la
// petición es válida, así no quedan imágenes huérfanas.
export const opcionesImagen: MulterOptions = {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (EXTENSIONES[file.mimetype]) return cb(null, true);
    cb(
      new BadRequestException('La imagen debe ser JPG, PNG, WEBP o GIF'),
      false,
    );
  },
};

/** Convierte la imagen a un data URI persistido directamente en MongoDB. */
export async function guardarImagen(
  archivo: Express.Multer.File,
  _carpeta: string,
  _baseUrl: string,
): Promise<string> {
  return `data:${archivo.mimetype};base64,${archivo.buffer.toString('base64')}`;
}
