const esLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const URL_API_LOCAL = 'http://localhost:3000/api';
const URL_API_DESPLEGADA = 'https://arena-back.onrender.com/api';

export const environment = {
  apiUrl: esLocal ? URL_API_LOCAL : URL_API_DESPLEGADA,
  minutosSesion: 2,
  minutosAvisoSesion: 1,
};
