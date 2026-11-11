import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ModalService } from './modal.service';

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
      this.auth.inicioSesionToken();
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
        if (error.error?.message === 'Falta el token de autenticación') {
          this.auth.limpiarSesionLocal();
        } else {
          this.expirar('Tu sesión venció. Volvé a iniciar sesión para continuar.');
        }
      }
    }
    await espera;
    this.lista.set(true);
  }

  private programar(): void {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];
    const inicio = this.auth.inicioSesionToken();
    const vence = this.auth.vencimiento();
    if (inicio === null || vence === null || !this.auth.logueado()) return;
    this.ofertaAbierta = false;

    const aviso = inicio + (vence - inicio) / 2;
    this.temporizadores.push(
      setTimeout(() => this.ofrecerExtender(), Math.max(aviso - Date.now(), 0)),
    );
  }

  private async ofrecerExtender(): Promise<void> {
    if (!this.auth.logueado() || this.ofertaAbierta) return;
    this.ofertaAbierta = true;
    const extender = await this.modal.abrir({
      tipo: 'confirmar',
      titulo: 'Tu sesión está por vencer',
      mensaje: '¿Querés extenderla para seguir conectado?',
      textoAceptar: 'Extender sesión',
      textoCancelar: 'Ahora no',
    });
    if (!extender || !this.auth.logueado()) return;
    this.auth.refrescar().subscribe(() =>
      this.modal.abrir({
        tipo: 'exito',
        titulo: 'Sesión extendida',
        mensaje: 'Tu sesión fue extendida. ¡A seguir jugando!',
      }),
    );
  }
}
