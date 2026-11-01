import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensajesDeError } from '../../core/errores';
import { Comentario } from '../../core/models/publicacion';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { Avatar } from '../avatar/avatar';
import { Icon } from '../icon/icon';
import { TiempoRelativoPipe } from '../tiempo-relativo.pipe';

/** Comentarios de una publicación: los más recientes primero, con "cargar más". */
@Component({
  selector: 'app-comentarios',
  imports: [ReactiveFormsModule, Avatar, Icon, TiempoRelativoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.scss',
})
export class Comentarios implements OnInit {
  private readonly modal = inject(ModalService);
  private readonly publicacionesService = inject(PublicacionesService);
  protected readonly usuario = inject(AuthService).usuario;

  readonly publicacionId = input.required<string>();
  readonly tamanoPagina = input(5);
  readonly comentado = output<void>();

  protected readonly comentarios = signal<Comentario[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(false);
  protected readonly error = signal(false);
  protected readonly enviando = signal(false);
  protected readonly hayMas = computed(() => this.comentarios().length < this.total());

  protected readonly editandoId = signal<string | null>(null);
  protected readonly guardando = signal(false);

  protected readonly nuevo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500)],
  });
  protected readonly edicion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500)],
  });

  ngOnInit(): void {
    this.cargarMas();
  }

  protected cargarMas(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.publicacionesService
      .comentarios(this.publicacionId(), this.comentarios().length, this.tamanoPagina())
      .subscribe({
        next: ({ total, comentarios }) => {
          // Evita duplicados si llegaron comentarios nuevos entre página y página.
          const ids = new Set(this.comentarios().map((c) => c._id));
          this.comentarios.update((actuales) => [
            ...actuales,
            ...comentarios.filter((c) => !ids.has(c._id)),
          ]);
          this.total.set(total);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set(true);
        },
      });
  }

  protected comentar(): void {
    const mensaje = this.nuevo.value.trim();
    if (!mensaje) {
      this.nuevo.markAsTouched();
      return;
    }
    this.enviando.set(true);
    this.publicacionesService.comentar(this.publicacionId(), mensaje).subscribe({
      next: (comentario) => {
        this.comentarios.update((actuales) => [comentario, ...actuales]);
        this.total.update((total) => total + 1);
        this.nuevo.reset();
        this.enviando.set(false);
        this.comentado.emit();
      },
      error: (error) => {
        this.enviando.set(false);
        this.mostrarError('No pudimos publicar tu comentario', error);
      },
    });
  }

  protected editar(comentario: Comentario): void {
    this.edicion.setValue(comentario.mensaje);
    this.editandoId.set(comentario._id);
  }

  protected guardarEdicion(comentario: Comentario): void {
    const mensaje = this.edicion.value.trim();
    if (!mensaje) return;
    if (mensaje === comentario.mensaje) {
      this.editandoId.set(null);
      return;
    }
    this.guardando.set(true);
    this.publicacionesService.editarComentario(this.publicacionId(), comentario._id, mensaje).subscribe({
      next: (editado) => {
        this.comentarios.update((actuales) => actuales.map((c) => (c._id === editado._id ? editado : c)));
        this.guardando.set(false);
        this.editandoId.set(null);
      },
      error: (error) => {
        this.guardando.set(false);
        this.mostrarError('No pudimos editar tu comentario', error);
      },
    });
  }

  private mostrarError(titulo: string, error: unknown): void {
    this.modal.abrir({ tipo: 'error', titulo, mensaje: mensajesDeError(error).join(' ') });
  }
}
