import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      'mongodb+srv://sebastianhg479_db_user:IladbNpGBPEW318Z@sebastianutn.brcv7a1.mongodb.net/',
      { dbName: 'UTN' },
    ),
    UsuariosModule,
    AuthModule,
    PublicacionesModule,
  ],
})
export class AppModule {}
