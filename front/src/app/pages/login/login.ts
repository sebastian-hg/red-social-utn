import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajesDeError } from '../../core/errores';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { PASSWORD_REGEX } from '../../core/validadores';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);

  protected readonly enviando = signal(false);
  protected readonly verPassword = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    usuario: ['', Validators.required],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_REGEX)]],
  });

  protected invalido(campo: 'usuario' | 'password'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  protected ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    const { usuario, password } = this.form.getRawValue();
    this.auth.login(usuario, password).subscribe({
      next: async ({ usuario }) => {
        this.enviando.set(false);
        await this.modal.abrir({
          tipo: 'exito',
          titulo: `¡Hola de nuevo, ${usuario.nombre}!`,
          mensaje: 'Iniciaste sesión correctamente. Vamos a ver qué está pasando en la cancha.',
          textoAceptar: 'Ir a publicaciones',
        });
        this.router.navigate(['/publicaciones']);
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No pudimos iniciar sesión',
          mensaje: 'Revisá los datos ingresados.',
          detalles: mensajesDeError(error),
        });
      },
    });
  }
}
