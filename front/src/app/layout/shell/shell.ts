import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icon } from '../../shared/icon/icon';

/** Estructura común de las pantallas internas: barra superior, menú lateral y contenido. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Avatar, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);
  protected readonly usuario = this.auth.usuario;

  protected readonly deportes = [
    { emoji: '⚽', nombre: 'Fútbol' },
    { emoji: '🏀', nombre: 'Básquet' },
    { emoji: '🎾', nombre: 'Tenis' },
    { emoji: '🏃', nombre: 'Running' },
    { emoji: '🏐', nombre: 'Vóley' },
    { emoji: '🏉', nombre: 'Rugby' },
    { emoji: '🚴', nombre: 'Ciclismo' },
    { emoji: '🏊', nombre: 'Natación' },
  ];

  protected async salir(): Promise<void> {
    const confirmado = await this.modal.abrir({
      tipo: 'confirmar',
      titulo: '¿Cerrar sesión?',
      mensaje: 'Vas a tener que volver a ingresar para seguir usando Arena.',
      textoAceptar: 'Cerrar sesión',
    });
    if (!confirmado) return;
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
