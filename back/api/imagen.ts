import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const TIPOS: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ruta = typeof req.query.ruta === 'string' ? req.query.ruta : '';
  const limpia = normalize(ruta).replace(/^(\.\.(\/|\\|$))+/, '');

  if (!/^(perfiles|publicaciones)[/\\][^/\\]+\.(gif|jpeg|jpg|png|webp)$/i.test(limpia)) {
    res.status(404).end();
    return;
  }

  try {
    const archivo = await readFile(join(process.cwd(), 'uploads', limpia));
    res.setHeader('Content-Type', TIPOS[extname(limpia).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(archivo);
  } catch {
    res.status(404).end();
  }
}
