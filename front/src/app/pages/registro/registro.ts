import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajesDeError } from '../../core/errores';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { PASSWORD_REGEX, coincide, fechaPasada } from '../../core/validadores';
import { Avatar } from '../../shared/avatar/avatar';
import { Icon } from '../../shared/icon/icon';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

type Campo =
  | 'nombre'
  | 'apellido'
  | 'correo'
  | 'nombreUsuario'
  | 'password'
  | 'repetirPassword'
  | 'fechaNacimiento'
  | 'descripcion';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, Icon, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);

  protected readonly enviando = signal(false);
  protected readonly verPassword = signal(false);
  protected readonly imagen = signal<File | null>(null);
  protected readonly vistaPrevia = signal<string | null>(null);
  protected readonly errorImagen = signal<string | null>(null);
  protected readonly hoy = new Date().toISOString().slice(0, 10);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.maxLength(50)]],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.]{3,20}$/)]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_REGEX)]],
      repetirPassword: ['', Validators.required],
      fechaNacimiento: ['', [Validators.required, fechaPasada]],
      descripcion: ['', Validators.maxLength(200)],
    },
    { validators: coincide('password', 'repetirPassword') },
  );

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly nombreCompleto = computed(
    () => `${this.valores().nombre ?? ''} ${this.valores().apellido ?? ''}`,
  );
  protected readonly reglasPassword = computed(() => {
    const password = this.valores().password ?? '';
    return [
      { texto: 'Al menos 8 caracteres', ok: password.length >= 8 },
      { texto: 'Una mayúscula', ok: /[A-Z]/.test(password) },
      { texto: 'Un número', ok: /\d/.test(password) },
    ];
  });
  protected readonly largoDescripcion = computed(() => (this.valores().descripcion ?? '').length);

  protected invalido(campo: Campo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  protected error(campo: Campo, error: string): boolean {
    return this.form.controls[campo].hasError(error);
  }

  protected elegirImagen(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      this.errorImagen.set('La imagen debe ser JPG, PNG, WEBP o GIF.');
    } else if (archivo.size > TAMANO_MAXIMO) {
      this.errorImagen.set('La imagen no puede pesar más de 5 MB.');
    } else {
      this.errorImagen.set(null);
      this.imagen.set(archivo);
      this.reemplazarVistaPrevia(URL.createObjectURL(archivo));
      return;
    }
    input.value = '';
  }

  protected quitarImagen(input: HTMLInputElement): void {
    input.value = '';
    this.imagen.set(null);
    this.reemplazarVistaPrevia(null);
  }

  protected registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.modal.abrir({
        tipo: 'error',
        titulo: 'Faltan datos',
        mensaje: 'Revisá los campos marcados en rojo antes de continuar.',
      });
      return;
    }

    const { repetirPassword: _, ...datos } = this.form.getRawValue();
    const formData = new FormData();
    Object.entries(datos).forEach(([clave, valor]) => formData.append(clave, valor));
    const imagen = this.imagen();
    if (imagen) formData.append('imagenPerfil', imagen);

    this.enviando.set(true);
    this.auth.registro(formData).subscribe({
      next: async ({ usuario }) => {
        this.enviando.set(false);
        await this.modal.abrir({
          tipo: 'exito',
          titulo: `¡Bienvenido a Arena, ${usuario.nombre}!`,
          mensaje: 'Tu cuenta se creó correctamente. Ya sos parte del equipo.',
          textoAceptar: 'Empezar',
        });
        this.router.navigate(['/publicaciones']);
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No pudimos crear tu cuenta',
          mensaje: 'Corregí lo siguiente e intentá de nuevo:',
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
