import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensajesDeError } from '../../core/errores';
import { Publicacion } from '../../core/models/publicacion';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { Avatar } from '../avatar/avatar';
import { Icon } from '../icon/icon';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

/** Formulario para crear una publicación con título, mensaje e imagen opcional. */
@Component({
  selector: 'app-nueva-publicacion',
  imports: [ReactiveFormsModule, Avatar, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nueva-publicacion.html',
  styleUrl: './nueva-publicacion.scss',
})
export class NuevaPublicacion {
  private readonly modal = inject(ModalService);
  private readonly publicacionesService = inject(PublicacionesService);
  protected readonly usuario = inject(AuthService).usuario;

  readonly creada = output<Publicacion>();

  protected readonly abierto = signal(false);
  protected readonly enviando = signal(false);
  protected readonly imagen = signal<File | null>(null);
  protected readonly vistaPrevia = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    mensaje: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  protected invalido(campo: 'titulo' | 'mensaje'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  protected elegirImagen(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    if (!TIPOS_IMAGEN.includes(archivo.type) || archivo.size > TAMANO_MAXIMO) {
      this.modal.abrir({
        tipo: 'error',
        titulo: 'Imagen no válida',
        mensaje: 'La imagen debe ser JPG, PNG, WEBP o GIF y pesar menos de 5 MB.',
      });
      return;
    }
    this.imagen.set(archivo);
    this.reemplazarVistaPrevia(URL.createObjectURL(archivo));
  }

  protected quitarImagen(): void {
    this.imagen.set(null);
    this.reemplazarVistaPrevia(null);
  }

  protected cancelar(): void {
    this.form.reset();
    this.quitarImagen();
    this.abierto.set(false);
  }

  protected publicar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = new FormData();
    const { titulo, mensaje } = this.form.getRawValue();
    datos.append('titulo', titulo);
    datos.append('mensaje', mensaje);
    const imagen = this.imagen();
    if (imagen) datos.append('imagen', imagen);

    this.enviando.set(true);
    this.publicacionesService.crear(datos).subscribe({
      next: (publicacion) => {
        this.enviando.set(false);
        this.cancelar();
        this.modal.abrir({
          tipo: 'exito',
          titulo: '¡Publicado!',
          mensaje: 'Tu publicación ya está en el muro de Arena.',
        });
        this.creada.emit(publicacion);
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No pudimos publicar',
          mensaje: 'Revisá lo siguiente:',
          detalles: mensajesDeError(error),
        });
      },
    });
  }

  private reemplazarVistaPrevia(url: string | null): void {
    const anterior = this.vistaPrevia();
    if (anterior) URL.revokeObjectURL(anterior);
    this.vistaPrevia.set(url);
  }
}
