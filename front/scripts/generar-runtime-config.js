const fs = require('node:fs');
const path = require('node:path');

const apiUrl = (process.env.ARENA_API_URL || '').trim().replace(/\/$/, '');
const destino = path.join(__dirname, '..', 'public', 'runtime-config.js');

fs.writeFileSync(
  destino,
  `window.ARENA_CONFIG = ${JSON.stringify({ apiUrl: apiUrl ? `${apiUrl}/api` : '' })};\n`,
);
