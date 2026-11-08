const fs = require('node:fs');
const path = require('node:path');

const apiUrl = (process.env.ARENA_API_URL || '').trim().replace(/\/+$/, '');
const destino = path.join(__dirname, '..', 'public', 'runtime-config.js');

const apiUrlConfigurada = apiUrl || (process.env.npm_lifecycle_event === 'start' ? 'http://localhost:3000' : '');

if (!apiUrlConfigurada) {
  console.error('ARENA_API_URL no está configurada. Ejemplo: https://arena-back.onrender.com');
  process.exit(1);
}

const apiUrlCompleta = /\/api$/i.test(apiUrlConfigurada)
  ? apiUrlConfigurada
  : `${apiUrlConfigurada}/api`;

fs.writeFileSync(
  destino,
  `window.ARENA_CONFIG = ${JSON.stringify({ apiUrl: apiUrlCompleta })};\n`,
);
