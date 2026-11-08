import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const origen = typeof req.headers.origin === 'string'
    ? req.headers.origin
    : '';
  const origenesPermitidos = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((valor) => valor.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const permitido = origenesPermitidos.includes('*')
    || origenesPermitidos.includes(origen.replace(/\/$/, ''));

  if (permitido && origen) {
    res.setHeader('Access-Control-Allow-Origin', origen);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    typeof req.headers['access-control-request-headers'] === 'string'
      ? req.headers['access-control-request-headers']
      : 'Content-Type, Authorization',
  );
  res.status(204).end();
}
