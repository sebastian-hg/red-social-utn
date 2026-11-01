import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

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

/** Guarda la imagen en uploads/<carpeta> y devuelve su URL pública. */
export async function guardarImagen(
  archivo: Express.Multer.File,
  carpeta: string,
  baseUrl: string,
): Promise<string> {
  const nombre = `${randomUUID()}.${EXTENSIONES[archivo.mimetype]}`;
  const directorio = join(process.cwd(), 'uploads', carpeta);
  await mkdir(directorio, { recursive: true });
  await writeFile(join(directorio, nombre), archivo.buffer);
  return `${baseUrl}/uploads/${carpeta}/${nombre}`;
}
