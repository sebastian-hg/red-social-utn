import type { VercelRequest, VercelResponse } from '@vercel/node';
import { crearAplicacion } from '../src/create-app.js';

let aplicacion: Awaited<ReturnType<typeof crearAplicacion>> | undefined;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origen = req.headers.origin;
  const origenesPermitidos = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((valor) => valor.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (typeof origen === 'string') {
    const permitido = origenesPermitidos.includes('*')
      || origenesPermitidos.includes(origen.replace(/\/$/, ''));

    if (permitido) {
      res.setHeader('Access-Control-Allow-Origin', origen);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] || 'Content-Type, Authorization',
    );
    res.status(204).end();
    return;
  }

  if (!aplicacion) {
    aplicacion = await crearAplicacion();
    await aplicacion.init();
  }

  const express = aplicacion.getHttpAdapter().getInstance();
  return express(req, res);
}
