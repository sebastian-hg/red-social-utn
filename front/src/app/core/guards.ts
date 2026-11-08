import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SesionService } from './services/sesion.service';

/** Solo deja pasar con sesión válida; si no, al login. */
export const autenticadoGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await inject(SesionService).inicio;
  return auth.logueado() || router.parseUrl('/login');
};

/** Login y registro: si ya hay sesión válida, directo a publicaciones. */
export const invitadoGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await inject(SesionService).inicio;
  return !auth.logueado() || router.parseUrl('/publicaciones');
};

export const administradorGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await inject(SesionService).inicio;
  return auth.esAdmin() || router.parseUrl('/publicaciones');
};
