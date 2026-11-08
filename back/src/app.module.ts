import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { MONGO_DB, MONGO_URI } from './configuracion.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

const MONGO_URI_ACTUAL = process.env.MONGO_URI || MONGO_URI;

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URI_ACTUAL, {
      dbName: MONGO_DB,
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
    }),
    UsuariosModule,
    AuthModule,
    PublicacionesModule,
  ],
})
export class AppModule {}
