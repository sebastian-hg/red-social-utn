import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { MONGO_DB, MONGO_URI } from './configuracion.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URI, { dbName: MONGO_DB }),
    UsuariosModule,
    AuthModule,
    PublicacionesModule,
  ],
})
export class AppModule {}
