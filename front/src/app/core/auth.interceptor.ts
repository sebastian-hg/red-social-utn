import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { SesionService } from './services/sesion.service';

// En estas rutas un 401 no significa sesión vencida (credenciales incorrectas o
// validación inicial, que maneja SesionService).
const SIN_REDIRECCION = ['/auth/login', '/auth/registro', '/auth/autorizar'];

/** Agrega el token a cada petición y ante un 401 manda al login. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  // SesionService se resuelve recién ante un 401: él mismo hace peticiones al construirse.
  const injector = inject(Injector);
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !SIN_REDIRECCION.some((ruta) => req.url.endsWith(ruta))
      ) {
        injector.get(SesionService).expirar();
      }
      return throwError(() => error);
    }),
  );
};
