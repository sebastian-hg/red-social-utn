import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Publicacion } from '../../core/models/publicacion';
import { AuthService } from '../../core/services/auth.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Comentarios } from '../../shared/comentarios/comentarios';
import { Icon } from '../../shared/icon/icon';
import { FechaCortaPipe } from '../../shared/pipes/fecha-corta.pipe';
import { PublicacionCard } from '../../shared/publicacion-card/publicacion-card';

@Component({
  selector: 'app-mi-perfil',
  imports: [RouterLink, Avatar, Icon, FechaCortaPipe, PublicacionCard, Comentarios],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.scss',
})
export class MiPerfil {
  private readonly publicacionesService = inject(PublicacionesService);
  protected readonly usuario = inject(AuthService).usuario;

  protected readonly publicaciones = signal<Publicacion[]>([]);
  protected readonly totalPublicaciones = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);

  protected readonly edad = computed(() => {
    const usuario = this.usuario();
    if (!usuario) return null;
    const nacimiento = new Date(usuario.fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
    const cumplioEsteAnio =
      hoy.getUTCMonth() > nacimiento.getUTCMonth() ||
      (hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() >= nacimiento.getUTCDate());
    if (!cumplioEsteAnio) edad--;
    return edad;
  });

  constructor() {
    effect(() => {
      const id = this.usuario()?._id;
      if (id) untracked(() => this.cargarPublicaciones(id));
    });
  }

  /** Mis últimas 3 publicaciones. */
  protected cargarPublicaciones(usuario = this.usuario()?._id): void {
    if (!usuario) return;
    this.cargando.set(true);
    this.error.set(false);
    this.publicacionesService.listar({ usuario, orden: 'fecha', limit: 3 }).subscribe({
      next: ({ total, publicaciones }) => {
        this.totalPublicaciones.set(total);
        this.publicaciones.set(publicaciones);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set(true);
      },
    });
  }
}
