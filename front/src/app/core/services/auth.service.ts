import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaAuth, Usuario } from '../models/usuario';

const CLAVE_TOKEN = 'arena.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly _token = signal<string | null>(localStorage.getItem(CLAVE_TOKEN));
  private readonly _usuario = signal<Usuario | null>(null);
  /** Hora local en que llegó el token actual (null si vino de localStorage). */
  private recibido: number | null = null;
  readonly token = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly logueado = computed(() => this._usuario() !== null);
  readonly esAdmin = computed(() => this._usuario()?.perfil === 'administrador');

  registro(datos: FormData): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.url}/registro`, datos)
      .pipe(tap((respuesta) => this.iniciarSesion(respuesta)));
  }

  login(usuario: string, password: string): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.url}/login`, { usuario, password })
      .pipe(tap((respuesta) => this.iniciarSesion(respuesta)));
  }

  /** Valida el token guardado contra el back y carga los datos del usuario. */
  autorizar(): Observable<Usuario> {
    return this.http
      .post<{ usuario: Usuario }>(`${this.url}/autorizar`, {})
      .pipe(map(({ usuario }) => usuario), tap((usuario) => this._usuario.set(usuario)));
  }

  refrescar(): Observable<string> {
    return this.http
      .post<{ token: string }>(`${this.url}/refrescar`, {})
      .pipe(map(({ token }) => token), tap((token) => this.guardarToken(token)));
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    this.recibido = null;
    this._token.set(null);
    this._usuario.set(null);
  }

  /**
   * Momento (ms, reloj local) en que vence el token actual. Si el token llegó en
   * esta sesión se calcula desde que se recibió más su duración (exp - iat), así
   * una diferencia de hora entre el navegador y el servidor no adelanta el aviso.
   */
  vencimiento(): number | null {
    const token = this._token();
    if (!token) return null;
    try {
      const { iat, exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return this.recibido ? this.recibido + (exp - iat) * 1000 : exp * 1000;
    } catch {
      return null;
    }
  }

  private iniciarSesion({ usuario, token }: RespuestaAuth): void {
    this.guardarToken(token);
    this._usuario.set(usuario);
  }

  private guardarToken(token: string): void {
    this.recibido = Date.now();
    localStorage.setItem(CLAVE_TOKEN, token);
    this._token.set(token);
  }
}
