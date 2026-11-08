import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB || 'utn';

if (!uri) {
  throw new Error('MONGO_URI no está configurada');
}

const tipos = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

await mongoose.connect(uri, { dbName });
const db = mongoose.connection.db;

for (const [coleccion, campo, carpeta] of [
  ['usuarios', 'imagenPerfil', 'perfiles'],
  ['publicaciones', 'imagen', 'publicaciones'],
]) {
  const documentos = await db.collection(coleccion).find({ [campo]: { $type: 'string' } }).toArray();

  for (const documento of documentos) {
    const valor = documento[campo];
    if (!valor || valor.startsWith('data:image/')) continue;

    const nombre = basename(String(valor).split('?')[0]);
    const extension = nombre.split('.').pop()?.toLowerCase();
    if (!extension || !(extension in tipos)) continue;

    try {
      const archivo = await readFile(join(process.cwd(), 'uploads', carpeta, nombre));
      const base64 = `data:${tipos[extension]};base64,${archivo.toString('base64')}`;
      await db.collection(coleccion).updateOne(
        { _id: documento._id },
        { $set: { [campo]: base64 } },
      );
      console.log(`Migrado ${coleccion}/${documento._id}`);
    } catch {
      console.warn(`No encontrado: ${nombre}`);
    }
  }
}

await mongoose.disconnect();
