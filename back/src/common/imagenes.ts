import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { map, Observable } from 'rxjs';

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

export function normalizarUrlImagen(url: string | null | undefined, baseUrl: string): string | null {
  if (!url) return url ?? null;
  const indice = url.indexOf('/uploads/');
  if (indice === -1) return url;

  return `${baseUrl.replace(/\/$/, '')}${url.slice(indice)}`;
}

function normalizarUrls(value: unknown, baseUrl: string): unknown {
  if (typeof value === 'string') {
    return value.includes('/uploads/') ? normalizarUrlImagen(value, baseUrl) : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizarUrls(item, baseUrl));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([clave, item]) => [
        clave,
        normalizarUrls(item, baseUrl),
      ]),
    );
  }
  return value;
}

@Injectable()
export class NormalizadorImagenesInterceptor implements NestInterceptor {
  constructor(private readonly baseUrl: string) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      protocol?: string;
    }>();
    const protocolo = request.headers['x-forwarded-proto']?.toString()
      || request.protocol
      || 'http';
    const host = request.headers['x-forwarded-host']?.toString()
      || request.headers.host?.toString()
      || '';
    const baseUrl = host && !host.includes('localhost')
      ? `${protocolo}://${host}`
      : this.baseUrl;

    return next.handle().pipe(
      map((respuesta) => normalizarUrls(respuesta, baseUrl)),
    );
  }
}
