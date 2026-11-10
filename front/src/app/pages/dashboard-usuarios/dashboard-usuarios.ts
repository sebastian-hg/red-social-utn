import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensajesDeError } from '../../core/errores';
import { Usuario } from '../../core/models/usuario';
import { AdminService } from '../../core/services/admin.service';
import { ModalService } from '../../core/services/modal.service';
import { correoCom } from '../../core/validadores';
import { ResaltarDirective } from '../../shared/directivas/resaltar.directive';
import { InicialesPipe } from '../../shared/pipes/iniciales.pipe';
import { SoloActivosDirective } from '../../shared/directivas/solo-activos.directive';
import { TooltipDirective } from '../../shared/directivas/tooltip.directive';

@Component({
  selector: 'app-dashboard-usuarios',
  imports: [ReactiveFormsModule, InicialesPipe, SoloActivosDirective, ResaltarDirective, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-usuarios.html',
  styleUrl: './dashboard-usuarios.scss',
})
export class DashboardUsuarios {
  private readonly admin = inject(AdminService);
  private readonly modal = inject(ModalService);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly creando = signal(false);
  protected readonly hoy = new Date().toISOString().slice(0, 10);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    apellido: ['', [Validators.required, Validators.maxLength(50)]],
    correo: ['', [Validators.required, Validators.email, correoCom]],
    nombreUsuario: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.]{3,20}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)]],
    repetirPassword: ['', Validators.required],
    fechaNacimiento: ['', Validators.required],
    descripcion: ['', Validators.maxLength(200)],
    perfil: ['' as 'usuario' | 'administrador' | '', Validators.required],
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.admin.usuarios().subscribe((usuarios) => this.usuarios.set(usuarios));
  }

  protected crear(): void {
    if (this.form.invalid || this.form.value.password !== this.form.value.repetirPassword) {
      this.form.markAllAsTouched();
      return;
    }
    const { repetirPassword: _, ...datos } = this.form.getRawValue();
    this.creando.set(true);
    this.admin.crear(datos).subscribe({
      next: () => {
        this.creando.set(false);
        this.form.reset();
        this.cargar();
        this.modal.abrir({ tipo: 'exito', titulo: 'Usuario creado', mensaje: 'La cuenta quedó habilitada.' });
      },
      error: (error) => {
        this.creando.set(false);
        this.modal.abrir({ tipo: 'error', titulo: 'No se pudo crear el usuario', mensaje: 'Revisá los datos ingresados.', detalles: mensajesDeError(error) });
      },
    });
  }

  protected cambiarEstado(usuario: Usuario): void {
    const peticion = usuario.activo === false
      ? this.admin.rehabilitar(usuario._id)
      : this.admin.deshabilitar(usuario._id);
    peticion.subscribe({
      next: () => this.cargar(),
      error: (error) => this.modal.abrir({
        tipo: 'error',
        titulo: 'No se pudo cambiar el estado',
        mensaje: 'Intentá nuevamente.',
        detalles: mensajesDeError(error),
      }),
    });
  }
}
