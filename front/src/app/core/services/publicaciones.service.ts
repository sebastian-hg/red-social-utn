import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Comentario,
  EstadoMeGusta,
  Orden,
  PaginaComentarios,
  PaginaPublicaciones,
  Publicacion,
} from '../models/publicacion';

export interface FiltroPublicaciones {
  orden?: Orden;
  usuario?: string;
  offset?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/publicaciones`;

  listar(filtro: FiltroPublicaciones): Observable<PaginaPublicaciones> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtro)) {
      if (valor !== undefined) params = params.set(clave, valor);
    }
    return this.http.get<PaginaPublicaciones>(this.url, { params });
  }

  obtener(id: string): Observable<Publicacion> {
    return this.http.get<Publicacion>(`${this.url}/${id}`);
  }

  crear(datos: FormData): Observable<Publicacion> {
    return this.http
      .post<{ publicacion: Publicacion }>(this.url, datos)
      .pipe(map(({ publicacion }) => publicacion));
  }

  eliminar(id: string): Observable<unknown> {
    return this.http.delete(`${this.url}/${id}`);
  }

  darMeGusta(id: string): Observable<EstadoMeGusta> {
    return this.http.post<EstadoMeGusta>(`${this.url}/${id}/me-gusta`, {});
  }

  quitarMeGusta(id: string): Observable<EstadoMeGusta> {
    return this.http.delete<EstadoMeGusta>(`${this.url}/${id}/me-gusta`);
  }

  comentarios(id: string, offset: number, limit: number): Observable<PaginaComentarios> {
    return this.http.get<PaginaComentarios>(`${this.url}/${id}/comentarios`, {
      params: { offset, limit },
    });
  }

  comentar(id: string, mensaje: string): Observable<Comentario> {
    return this.http
      .post<{ comentario: Comentario }>(`${this.url}/${id}/comentarios`, { mensaje })
      .pipe(map(({ comentario }) => comentario));
  }

  editarComentario(id: string, comentarioId: string, mensaje: string): Observable<Comentario> {
    return this.http
      .put<{ comentario: Comentario }>(`${this.url}/${id}/comentarios/${comentarioId}`, { mensaje })
      .pipe(map(({ comentario }) => comentario));
  }
}
