const esLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const URL_API_LOCAL = 'http://localhost:3000/api';
declare global {
  interface Window {
    ARENA_CONFIG?: {
      apiUrl?: string;
    };
  }
}

const URL_API_DESPLEGADA = window.ARENA_CONFIG?.apiUrl || '';

export const environment = {
  apiUrl: esLocal ? URL_API_LOCAL : URL_API_DESPLEGADA,
  minutosSesion: 2,
  minutosAvisoSesion: 1,
};
