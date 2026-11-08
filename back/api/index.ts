import type { VercelRequest, VercelResponse } from '@vercel/node';
import { crearAplicacion } from '../src/create-app.js';

let aplicacion: Awaited<ReturnType<typeof crearAplicacion>> | undefined;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!aplicacion) {
    aplicacion = await crearAplicacion();
    await aplicacion.init();
  }

  const express = aplicacion.getHttpAdapter().getInstance();
  return express(req, res);
}
