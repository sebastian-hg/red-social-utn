import { Injectable, signal } from '@angular/core';

export type TipoModal = 'exito' | 'error' | 'info' | 'confirmar';

export interface OpcionesModal {
  tipo: TipoModal;
  titulo: string;
  mensaje: string;
  detalles?: string[];
  textoAceptar?: string;
  textoCancelar?: string;
}

interface ModalAbierto extends OpcionesModal {
  resolver: (aceptado: boolean) => void;
}

/** Reemplaza a alert()/confirm(): abre el modal global y resuelve al cerrarse. */
@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly actual = signal<ModalAbierto | null>(null);

  abrir(opciones: OpcionesModal): Promise<boolean> {
    this.actual()?.resolver(false);
    return new Promise((resolver) => this.actual.set({ ...opciones, resolver }));
  }

  cerrar(aceptado: boolean): void {
    const modal = this.actual();
    if (!modal) return;
    this.actual.set(null);
    modal.resolver(aceptado);
  }
}
