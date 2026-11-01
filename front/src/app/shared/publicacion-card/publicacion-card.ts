import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajesDeError } from '../../core/errores';
import { Publicacion } from '../../core/models/publicacion';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { Avatar } from '../avatar/avatar';
import { Icon } from '../icon/icon';
import { TiempoRelativoPipe } from '../tiempo-relativo.pipe';

/** Una publicación: autor, contenido, me gusta y acceso a los comentarios. */
@Component({
  selector: 'app-publicacion-card',
  imports: [RouterLink, Avatar, Icon, TiempoRelativoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.scss',
})
export class PublicacionCard {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly publicacionesService = inject(PublicacionesService);

  readonly publicacion = input.required<Publicacion>();
  /** Vista ampliada de la página de detalle. */
  readonly detalle = input(false);
  readonly eliminada = output<void>();

  protected readonly meGustaYo = linkedSignal(() => this.publicacion().meGustaYo);
  protected readonly cantidadMeGusta = linkedSignal(() => this.publicacion().cantidadMeGusta);
  protected readonly procesandoMeGusta = signal(false);
  protected readonly eliminando = signal(false);

  protected readonly puedeEliminar = computed(
    () => this.auth.esAdmin() || this.auth.usuario()?._id === this.publicacion().autor._id,
  );
  protected readonly nombreAutor = computed(() => {
    const { nombre, apellido } = this.publicacion().autor;
    return `${nombre} ${apellido}`;
  });

  protected alternarMeGusta(): void {
    const id = this.publicacion()._id;
    const peticion = this.meGustaYo()
      ? this.publicacionesService.quitarMeGusta(id)
      : this.publicacionesService.darMeGusta(id);

    this.procesandoMeGusta.set(true);
    peticion.subscribe({
      next: ({ cantidadMeGusta, meGustaYo }) => {
        this.cantidadMeGusta.set(cantidadMeGusta);
        this.meGustaYo.set(meGustaYo);
        this.procesandoMeGusta.set(false);
      },
      error: (error) => {
        this.procesandoMeGusta.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No pudimos registrar tu me gusta',
          mensaje: mensajesDeError(error).join(' '),
        });
      },
    });
  }

  protected async eliminar(): Promise<void> {
    const confirmado = await this.modal.abrir({
      tipo: 'confirmar',
      titulo: '¿Eliminar publicación?',
      mensaje: `"${this.publicacion().titulo}" dejará de verse en Arena.`,
      textoAceptar: 'Eliminar',
    });
    if (!confirmado) return;

    this.eliminando.set(true);
    this.publicacionesService.eliminar(this.publicacion()._id).subscribe({
      next: () => {
        this.modal.abrir({
          tipo: 'exito',
          titulo: 'Publicación eliminada',
          mensaje: 'La publicación se eliminó correctamente.',
        });
        this.eliminada.emit();
      },
      error: (error) => {
        this.eliminando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No pudimos eliminar la publicación',
          mensaje: mensajesDeError(error).join(' '),
        });
      },
    });
  }
}
