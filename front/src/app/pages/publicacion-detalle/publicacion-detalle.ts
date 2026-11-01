import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Publicacion } from '../../core/models/publicacion';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { Comentarios } from '../../shared/comentarios/comentarios';
import { Icon } from '../../shared/icon/icon';
import { PublicacionCard } from '../../shared/publicacion-card/publicacion-card';

@Component({
  selector: 'app-publicacion-detalle',
  imports: [RouterLink, Icon, PublicacionCard, Comentarios],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.scss',
})
export class PublicacionDetalle {
  private readonly publicacionesService = inject(PublicacionesService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** Viene del parámetro :id de la ruta. */
  readonly id = input.required<string>();

  protected readonly publicacion = signal<Publicacion | null>(null);
  protected readonly estado = signal<'cargando' | 'ok' | 'no-existe' | 'error'>('cargando');

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.cargar(id));
    });
  }

  protected volver(): void {
    if (history.length > 1) this.location.back();
    else this.router.navigate(['/publicaciones']);
  }

  protected sumarComentario(): void {
    this.publicacion.update((p) => p && { ...p, cantidadComentarios: p.cantidadComentarios + 1 });
  }

  protected alEliminar(): void {
    this.router.navigate(['/publicaciones']);
  }

  protected cargar(id: string): void {
    this.estado.set('cargando');
    this.publicacionesService.obtener(id).subscribe({
      next: (publicacion) => {
        this.publicacion.set(publicacion);
        this.estado.set('ok');
      },
      error: (error: HttpErrorResponse) => {
        this.estado.set(error.status === 404 || error.status === 400 ? 'no-existe' : 'error');
      },
    });
  }
}
