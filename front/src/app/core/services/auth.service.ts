import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaAuth, Usuario } from '../models/usuario';

const DURACION_SESION_MS = 15 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly _usuario = signal<Usuario | null>(null);
  private readonly _vencimiento = signal<number | null>(null);
  readonly usuario = this._usuario.asReadonly();
  readonly vencimientoSesion = this._vencimiento.asReadonly();
  readonly logueado = computed(() => this._usuario() !== null);
  readonly esAdmin = computed(() => this._usuario()?.perfil === 'administrador');

  registro(datos: FormData): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.url}/registro`, datos)
      .pipe(tap((respuesta) => this.iniciarSesion(respuesta.usuario)));
  }

  login(usuario: string, password: string): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.url}/login`, { usuario, password })
      .pipe(tap((respuesta) => this.iniciarSesion(respuesta.usuario)));
  }

  autorizar(): Observable<Usuario> {
    return this.http
      .post<{ usuario: Usuario }>(`${this.url}/autorizar`, {})
      .pipe(
        map(({ usuario }) => usuario),
        tap((usuario) => this.iniciarSesion(usuario)),
      );
  }

  refrescar(): Observable<void> {
    return this.http.post<void>(`${this.url}/refrescar`, {}).pipe(tap(() => this.programarSesion()));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.url}/logout`, {}).pipe(finalize(() => this.limpiarSesion()));
  }

  vencimiento(): number | null {
    return this._vencimiento();
  }

  private iniciarSesion(usuario: Usuario): void {
    this._usuario.set(usuario);
    this.programarSesion();
  }

  private programarSesion(): void {
    this._vencimiento.set(Date.now() + DURACION_SESION_MS);
  }

  private limpiarSesion(): void {
    this._vencimiento.set(null);
    this._usuario.set(null);
  }
}
