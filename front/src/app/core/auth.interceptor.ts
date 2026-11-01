import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SesionService } from './services/sesion.service';

const SIN_REDIRECCION = ['/auth/login', '/auth/registro', '/auth/autorizar', '/auth/logout'];

/** Adjunta la cookie de sesión y expira el estado ante respuestas 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const peticion = req.clone({ withCredentials: true });

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
