import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ModalService } from './modal.service';
import { environment } from '../../../environments/environment';

const DURACION_SESION_MS = environment.minutosSesion * 60 * 1000;
const AVISO_EN_MS = environment.minutosAvisoSesion * 60 * 1000;
const DURACION_MINIMA_CARGA = 800;

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);

  private temporizadores: ReturnType<typeof setTimeout>[] = [];
  private ofertaAbierta = false;
  readonly lista = signal(false);
  readonly inicio = this.iniciar();

  constructor() {
    effect(() => {
      this.auth.vencimientoSesion();
      this.programar();
    });
  }

  expirar(mensaje = 'Por seguridad, volvé a iniciar sesión para continuar.'): void {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];
    this.ofertaAbierta = false;

    this.router.navigate(['/login']);
    this.auth.limpiarSesionLocal();
    this.auth.logout().subscribe({ error: () => undefined });
    void this.modal.abrir({ tipo: 'info', titulo: 'Tu sesión expiró', mensaje });
  }

  private async iniciar(): Promise<void> {
    const espera = new Promise((resolver) => setTimeout(resolver, DURACION_MINIMA_CARGA));
    try {
      await firstValueFrom(this.auth.autorizar());
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.expirar('Tu sesión venció. Volvé a iniciar sesión para continuar.');
      }
    }
    await espera;
    this.lista.set(true);
  }

  private programar(): void {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];
    const vence = this.auth.vencimiento();
    if (!vence || !this.auth.logueado()) return;
    this.ofertaAbierta = false;

    const restante = vence - Date.now();
    this.temporizadores.push(
      setTimeout(() => this.ofrecerExtender(), Math.max(DURACION_SESION_MS - AVISO_EN_MS, 0)),
      setTimeout(() => this.expirar(`Pasaron ${environment.minutosSesion} minutos sin extender la sesión.`), restante),
    );
  }

  private async ofrecerExtender(): Promise<void> {
    if (!this.auth.logueado() || this.ofertaAbierta) return;
    this.ofertaAbierta = true;
    const extender = await this.modal.abrir({
      tipo: 'confirmar',
      titulo: 'Tu sesión está por vencer',
      mensaje: `Quedan ${environment.minutosSesion - environment.minutosAvisoSesion} minutos de sesión. ¿Querés extenderla para seguir conectado?`,
      textoAceptar: 'Extender sesión',
      textoCancelar: 'Ahora no',
    });
    if (!extender || !this.auth.logueado()) return;
    this.auth.refrescar().subscribe(() =>
      this.modal.abrir({
        tipo: 'exito',
        titulo: 'Sesión extendida',
        mensaje: `Tenés ${environment.minutosSesion} minutos más. ¡A seguir jugando!`,
      }),
    );
  }
}
