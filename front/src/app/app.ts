import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SesionService } from './core/services/sesion.service';
import { Cargando } from './shared/cargando/cargando';
import { Modal } from './shared/modal/modal';

@Component({
  imports: [RouterOutlet, Modal, Cargando],
  selector: 'app-root',
  template: `
    @if (!sesion.lista()) {
      <app-cargando />
    }
    <router-outlet />
    <app-modal />
  `,
})
export class App {
  protected readonly sesion = inject(SesionService);
}
