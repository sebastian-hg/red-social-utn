# Arena · La red social del deporte

| Carpeta    | Contenido                                                        |
| ---------- | ---------------------------------------------------------------- |
| `back/`    | API en NestJS + MongoDB (Mongoose)                               |
| `front/`   | Aplicación Angular                                               |
| `postman/` | Colección para probar los endpoints                              |
| `db/`      | Por sprint: colecciones, comandos de creación (JSON) y datos de ejemplo |

## Cómo levantarlo

### Back

```bash
cd back
cp env.example .env   # completar MONGO_URI con el string de conexión de Atlas
npm install
npm run start:dev     # http://localhost:3000/api
```

Variables de `.env`:

- `MONGO_URI`: string de conexión. La base es `MONGO_DB` (por defecto `UTN`).
- `JWT_SECRET`: clave para firmar los tokens (texto largo y aleatorio). Sin ella el back no arranca.
- `BASE_URL`: URL pública del back, se usa para armar la URL de las imágenes subidas.
- `CORS_ORIGIN`: orígenes permitidos (la URL del front), separados por coma.

Las imágenes se guardan en `back/uploads/perfiles` y `back/uploads/publicaciones` y se sirven en `/uploads/...`.

Tests e2e (usar una base de prueba, no `UTN`): `MONGO_DB=UTN_test npm run test:e2e`.

### Front

```bash
cd front
npm install
npm start             # http://localhost:4200
```

La URL de la API se configura en `src/environments/environment.ts`.
Al abrir Angular desde `localhost`, usa el backend local. Desde cualquier dominio desplegado,
usa la URL pública configurada para Render.

## Endpoints

Todos menos registro y login requieren el header `Authorization: Bearer <token>` (401 si falta, es inválido o venció).
El token vence a los 15 minutos y contiene `sub` (id), `correo`, `nombreUsuario` y `perfil`.

| Método | Ruta | Descripción | Respuestas |
| ------ | ---- | ----------- | ---------- |
| POST | `/api/auth/registro` | `multipart/form-data`, `imagenPerfil` opcional. Devuelve usuario y token | 201, 400, 409 |
| POST | `/api/auth/login` | `{ usuario, password }`; `usuario` = correo o nombre de usuario. Devuelve usuario y token | 200, 400, 401 |
| POST | `/api/auth/autorizar` | Valida el token y devuelve los datos del usuario | 200, 401 |
| POST | `/api/auth/refrescar` | Devuelve un token nuevo con el mismo payload y 15 minutos más | 200, 401 |
| GET | `/api/publicaciones` | Query: `orden` (`fecha` \| `meGusta`), `usuario` (id), `offset`, `limit` (1–50) | 200, 400 |
| GET | `/api/publicaciones/:id` | Una publicación | 200, 400, 404 |
| POST | `/api/publicaciones` | `multipart/form-data`: `titulo`, `mensaje`, `imagen` opcional | 201, 400 |
| DELETE | `/api/publicaciones/:id` | Baja lógica; solo el autor o un administrador | 200, 403, 404 |
| POST | `/api/publicaciones/:id/me-gusta` | Da me gusta (uno por usuario) | 201, 404, 409 |
| DELETE | `/api/publicaciones/:id/me-gusta` | Quita el me gusta propio | 200, 404, 409 |
| GET | `/api/publicaciones/:id/comentarios` | Query: `offset`, `limit`. Más recientes primero | 200, 400, 404 |
| POST | `/api/publicaciones/:id/comentarios` | `{ mensaje }` | 201, 400, 404 |
| PUT | `/api/publicaciones/:id/comentarios/:comentarioId` | `{ mensaje }`; solo el autor; marca `modificado: true` | 200, 400, 403, 404 |

La colección de `postman/` se ejecuta en orden: el login guarda el token y los demás requests lo usan.

## Sesión en el front

- Al abrir la app se muestra una pantalla de carga mientras se valida el token contra `/auth/autorizar`:
  si es válido sigue a publicaciones (o a la página pedida); si no, va al login.
- A los 10 minutos de recibir el token aparece un modal avisando que quedan 5 minutos y ofreciendo extender
  la sesión (`/auth/refrescar`). Si no se extiende, al vencer se cierra la sesión.
- Cualquier respuesta 401 cierra la sesión y redirige al login.

## Deploy

- **Back** (Render, Railway, etc.): build `npm install && npm run build`, start `npm run start:prod`,
  cargar las variables de `.env` en el panel del hosting y poner en `CORS_ORIGIN` la URL del front.
- **Front** (Vercel, Netlify, Firebase Hosting): poner la URL del back en `src/environments/environment.ts`,
  build `npm run build`, carpeta de salida `dist/front/browser`. Configurar el rewrite de SPA
  (todas las rutas → `index.html`) para que funcione la navegación al recargar.

## Usuario administrador

Los usuarios se registran con perfil `usuario`. Para tener un administrador (puede eliminar publicaciones
de cualquiera), importar `db/sprint-1/usuarios.seed.json` (usuario `admin`, contraseña `Admin1234`) o
cambiar el campo `perfil` a `administrador` desde la base. El rol viaja en el token, así que el cambio
aplica en el siguiente login.
