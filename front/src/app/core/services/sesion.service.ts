import { Injectable, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ModalService } from './modal.service';

const AVISO_ANTES_DE_VENCER = 5 * 60 * 1000;
const DURACION_MINIMA_CARGA = 800;

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);

  private temporizadores: ReturnType<typeof setTimeout>[] = [];
  readonly lista = signal(false);
  readonly inicio = this.iniciar();

  constructor() {
    effect(() => {
      this.auth.vencimientoSesion();
      this.programar();
    });
  }

  expirar(mensaje = 'Por seguridad, volvé a iniciar sesión para continuar.'): void {
    if (!this.auth.logueado()) return;
    this.auth.logout().subscribe();
    this.router.navigate(['/login']);
    this.modal.abrir({ tipo: 'info', titulo: 'Tu sesión expiró', mensaje });
  }

  private async iniciar(): Promise<void> {
    const espera = new Promise((resolver) => setTimeout(resolver, DURACION_MINIMA_CARGA));
    try {
      await firstValueFrom(this.auth.autorizar());
    } catch {
      this.auth.logout().subscribe();
    }
    await espera;
    this.lista.set(true);
  }

  private programar(): void {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];
    const vence = this.auth.vencimiento();
    if (!vence || !this.auth.logueado()) return;

    const restante = vence - Date.now();
    this.temporizadores.push(
      setTimeout(() => this.ofrecerExtender(), Math.max(restante - AVISO_ANTES_DE_VENCER, 0)),
      setTimeout(() => this.expirar('Pasaron 15 minutos sin extender la sesión.'), restante),
    );
  }

  private async ofrecerExtender(): Promise<void> {
    if (!this.auth.logueado()) return;
    const extender = await this.modal.abrir({
      tipo: 'confirmar',
      titulo: 'Tu sesión está por vencer',
      mensaje: 'Quedan 5 minutos de sesión. ¿Querés extenderla para seguir conectado?',
      textoAceptar: 'Extender sesión',
      textoCancelar: 'Ahora no',
    });
    if (!extender || !this.auth.logueado()) return;
    this.auth.refrescar().subscribe(() =>
      this.modal.abrir({
        tipo: 'exito',
        titulo: 'Sesión extendida',
        mensaje: 'Tenés 15 minutos más. ¡A seguir jugando!',
      }),
    );
  }
}
