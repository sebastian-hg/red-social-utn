import { Directive, HostBinding, Input } from '@angular/core';

@Directive({ selector: '[appResaltar]' })
export class ResaltarDirective {
  @Input() appResaltar = '#fff7ed';
  @HostBinding('style.backgroundColor') get fondo() { return this.appResaltar; }
}
