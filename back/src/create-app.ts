import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { NormalizadorImagenesInterceptor } from './common/imagenes.js';
import { BASE_URL, CORS_ORIGIN } from './configuracion.js';

export async function crearAplicacion(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalInterceptors(new NormalizadorImagenesInterceptor(BASE_URL));
  const origenesPermitidos = CORS_ORIGIN.split(',')
    .map((origen) => origen.trim().replace(/\/$/, ''))
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origenesPermitidos.includes('*')) {
        callback(null, origin || true);
        return;
      }

      callback(
        origenesPermitidos.includes(origin.replace(/\/$/, ''))
          ? null
          : new Error('Origen no permitido por CORS'),
        origin,
      );
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  return app;
}
