import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario';

export interface DatoGrafico {
  nombre?: string;
  titulo?: string;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  usuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.api}/usuarios`);
  }

  crear(datos: Record<string, string>): Observable<{ usuario: Usuario }> {
    return this.http.post<{ usuario: Usuario }>(`${this.api}/usuarios`, datos);
  }

  deshabilitar(id: string): Observable<unknown> {
    return this.http.delete(`${this.api}/usuarios/${id}`);
  }

  rehabilitar(id: string): Observable<unknown> {
    return this.http.post(`${this.api}/usuarios/${id}/rehabilitar`, {});
  }

  publicacionesPorUsuario(desde: string, hasta: string): Observable<DatoGrafico[]> {
    return this.http.get<DatoGrafico[]>(`${this.api}/estadisticas/publicaciones-por-usuario`, { params: { desde, hasta } });
  }

  comentarios(desde: string, hasta: string): Observable<DatoGrafico[]> {
    return this.http.get<DatoGrafico[]>(`${this.api}/estadisticas/comentarios`, { params: { desde, hasta } });
  }

  comentariosPorPublicacion(desde: string, hasta: string): Observable<DatoGrafico[]> {
    return this.http.get<DatoGrafico[]>(`${this.api}/estadisticas/comentarios-por-publicacion`, { params: { desde, hasta } });
  }
}
