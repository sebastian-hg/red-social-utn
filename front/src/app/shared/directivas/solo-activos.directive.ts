import { Directive, HostBinding, Input } from '@angular/core';

@Directive({ selector: '[appSoloActivos]' })
export class SoloActivosDirective {
  @Input({ required: true }) appSoloActivos = true;
  @HostBinding('style.opacity') get opacidad() { return this.appSoloActivos ? '1' : '.55'; }
  @HostBinding('attr.aria-disabled') get deshabilitado() { return this.appSoloActivos ? null : 'true'; }
}
