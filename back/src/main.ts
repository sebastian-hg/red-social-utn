import { PORT } from './configuracion.js';
import { crearAplicacion } from './create-app.js';

async function bootstrap() {
  const app = await crearAplicacion();
  await app.listen(PORT, '0.0.0.0');
}
await bootstrap();
