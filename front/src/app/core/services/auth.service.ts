import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaAuth, Usuario } from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly _usuario = signal<Usuario | null>(null);
  private readonly _inicioSesionToken = signal<number | null>(null);
  private readonly _vencimiento = signal<number | null>(null);
  readonly usuario = this._usuario.asReadonly();
  readonly inicioSesionToken = this._inicioSesionToken.asReadonly();
  readonly vencimientoSesion = this._vencimiento.asReadonly();
  readonly logueado = computed(() => this._usuario() !== null);
  readonly esAdmin = computed(() => this._usuario()?.perfil === 'administrador');

  registro(datos: FormData): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.url}/registro`, datos)
      .pipe(tap(({ usuario, iat, exp }) => this.iniciarSesion(usuario, iat, exp)));
  }

  login(usuario: string, password: string): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.url}/login`, { usuario, password })
      .pipe(tap(({ usuario, iat, exp }) => this.iniciarSesion(usuario, iat, exp)));
  }

  autorizar(): Observable<Usuario> {
    return this.http
      .post<{ usuario: Usuario; iat: number; exp: number }>(`${this.url}/autorizar`, {})
      .pipe(
        tap(({ usuario, iat, exp }) => this.iniciarSesion(usuario, iat, exp)),
        map(({ usuario }) => usuario),
      );
  }

  refrescar(): Observable<{ iat: number; exp: number }> {
    return this.http
      .post<{ iat: number; exp: number }>(`${this.url}/refrescar`, {})
      .pipe(tap(({ iat, exp }) => this.programarSesion(iat, exp)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.url}/logout`, {}).pipe(finalize(() => this.limpiarSesion()));
  }

  limpiarSesionLocal(): void {
    this.limpiarSesion();
  }

  vencimiento(): number | null {
    return this._vencimiento();
  }

  private iniciarSesion(usuario: Usuario, iat: number, exp: number): void {
    this._usuario.set(usuario);
    this.programarSesion(iat, exp);
  }

  private programarSesion(iat: number, exp: number): void {
    this._inicioSesionToken.set(iat * 1000);
    this._vencimiento.set(exp * 1000);
  }

  private limpiarSesion(): void {
    this._inicioSesionToken.set(null);
    this._vencimiento.set(null);
    this._usuario.set(null);
  }
}
