import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    estado: 'ok',
    servicio: 'arena-back',
    fecha: new Date().toISOString(),
  });
}
