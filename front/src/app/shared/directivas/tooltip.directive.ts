import { Directive, HostBinding, Input } from '@angular/core';

@Directive({ selector: '[appTooltip]' })
export class TooltipDirective {
  @Input({ required: true }) appTooltip = '';
  @HostBinding('attr.title') titulo = '';
  ngOnChanges() { this.titulo = this.appTooltip; }
}
