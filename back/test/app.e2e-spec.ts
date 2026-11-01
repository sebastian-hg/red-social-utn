import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

const tokenDeRespuesta = (respuesta: { headers: Record<string, string | string[]> }): string => {
  const encabezados = respuesta.headers['set-cookie'];
  const cookies = Array.isArray(encabezados) ? encabezados : [encabezados];
  const arena = cookies.find((cookie) => cookie?.startsWith('arena_token='));
  return decodeURIComponent(arena?.split(';')[0].slice('arena_token='.length) ?? '');
};

// Requiere MONGO_URI apuntando a una base de pruebas (usar MONGO_DB distinto de UTN).
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const sufijo = Date.now().toString().slice(-6);
  const usuario = {
    nombre: 'Test',
    apellido: 'E2E',
    correo: `e2e${sufijo}@mail.com`,
    nombreUsuario: `e2e${sufijo}`,
    password: 'Prueba1234',
    fechaNacimiento: '1995-05-10',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('POST /api/auth/registro con datos inválidos devuelve 400', () => {
    return request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({ ...usuario, password: 'corta', extra: true })
      .expect(400);
  });

  it('POST /api/auth/registro crea el usuario (201) sin exponer la contraseña', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send(usuario)
      .expect(201);
    expect(res.body.usuario.perfil).toBe('usuario');
    expect(res.body.usuario.password).toBeUndefined();
  });

  it('POST /api/auth/registro con correo repetido devuelve 409', () => {
    return request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({ ...usuario, nombreUsuario: `otro${sufijo}` })
      .expect(409);
  });

  it('POST /api/auth/login con correo o usuario devuelve 200', async () => {
    for (const login of [usuario.correo, usuario.nombreUsuario]) {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ usuario: login, password: usuario.password })
        .expect(200);
      expect(res.body.usuario.correo).toBe(usuario.correo);
    }
  });

  it('POST /api/auth/login con contraseña incorrecta devuelve 401', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ usuario: usuario.correo, password: 'Incorrecta1' })
      .expect(401);
  });

  describe('con sesión', () => {
    let token: string;
    let otroToken: string;
    let publicacionId: string;
    const http = () => request(app.getHttpServer());

    beforeAll(async () => {
      const login = await http()
        .post('/api/auth/login')
        .send({ usuario: usuario.correo, password: usuario.password });
      token = tokenDeRespuesta(login);
      const otro = await http()
        .post('/api/auth/registro')
        .send({
          ...usuario,
          correo: `otro${sufijo}@mail.com`,
          nombreUsuario: `otro${sufijo}`,
        });
      otroToken = tokenDeRespuesta(otro);
    });

    it('autorizar: 401 sin token o con token inválido, 200 con token válido', async () => {
      await http().post('/api/auth/autorizar').expect(401);
      await http()
        .post('/api/auth/autorizar')
        .set('Authorization', 'Bearer x.y.z')
        .expect(401);
      const res = await http()
        .post('/api/auth/autorizar')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.usuario.correo).toBe(usuario.correo);
    });

    it('refrescar devuelve un token nuevo que vence a los 15 minutos', async () => {
      const res = await http()
        .post('/api/auth/refrescar')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const nuevoToken = tokenDeRespuesta(res);
      const payload = JSON.parse(
        Buffer.from(nuevoToken.split('.')[1], 'base64url').toString(),
      );
      expect(payload.exp - payload.iat).toBe(15 * 60);
      expect(payload.perfil).toBe('usuario');
    });

    it('publicaciones requieren token (401)', () => {
      return http().get('/api/publicaciones').expect(401);
    });

    it('crear (201), listar y filtrar por usuario', async () => {
      const creada = await http()
        .post('/api/publicaciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ titulo: 'Test e2e', mensaje: 'Hola' })
        .expect(201);
      publicacionId = creada.body.publicacion._id;

      const lista = await http()
        .get('/api/publicaciones')
        .query({ usuario: creada.body.publicacion.autor._id, limit: 1 })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(lista.body.publicaciones[0]._id).toBe(publicacionId);

      await http()
        .get('/api/publicaciones')
        .query({ orden: 'otro', limit: 500 })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('me gusta: 201, repetido 409, quitar 200, quitar de nuevo 409', async () => {
      const url = `/api/publicaciones/${publicacionId}/me-gusta`;
      const auth = `Bearer ${otroToken}`;
      const dar = await http().post(url).set('Authorization', auth).expect(201);
      expect(dar.body).toEqual({ cantidadMeGusta: 1, meGustaYo: true });
      await http().post(url).set('Authorization', auth).expect(409);
      await http().delete(url).set('Authorization', auth).expect(200);
      await http().delete(url).set('Authorization', auth).expect(409);
    });

    it('comentarios: crear, editar solo el autor y marcar modificado', async () => {
      const url = `/api/publicaciones/${publicacionId}/comentarios`;
      const creado = await http()
        .post(url)
        .set('Authorization', `Bearer ${otroToken}`)
        .send({ mensaje: 'Buenísimo' })
        .expect(201);
      const id = creado.body.comentario._id;

      await http()
        .put(`${url}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mensaje: 'Ajeno' })
        .expect(403);
      const editado = await http()
        .put(`${url}/${id}`)
        .set('Authorization', `Bearer ${otroToken}`)
        .send({ mensaje: 'Editado' })
        .expect(200);
      expect(editado.body.comentario.modificado).toBe(true);

      const lista = await http()
        .get(url)
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(lista.body.total).toBe(1);
      expect(lista.body.comentarios[0].mensaje).toBe('Editado');
    });

    it('eliminar: 403 si no es el autor, 200 baja lógica, luego 404', async () => {
      const url = `/api/publicaciones/${publicacionId}`;
      await http()
        .delete(url)
        .set('Authorization', `Bearer ${otroToken}`)
        .expect(403);
      await http().delete(url).set('Authorization', `Bearer ${token}`).expect(200);
      await http().get(url).set('Authorization', `Bearer ${token}`).expect(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
