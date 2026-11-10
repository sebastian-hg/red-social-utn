import { Directive, HostBinding, Input } from '@angular/core';

@Directive({ selector: '[appSoloActivos]' })
export class SoloActivosDirective {
  @Input({ required: true }) appSoloActivos = true;
  @HostBinding('class.cuenta-inactiva') get cuentaInactiva() {
    return !this.appSoloActivos;
  }
}
