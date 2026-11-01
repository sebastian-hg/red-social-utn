import { formatDate } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

/** "ahora", "hace 5 min", "hace 3 h", "hace 2 d" o la fecha si es más vieja. */
@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(fecha: string): string {
    const segundos = (Date.now() - new Date(fecha).getTime()) / 1000;
    if (segundos < 60) return 'ahora';
    if (segundos < 3600) return `hace ${Math.floor(segundos / 60)} min`;
    if (segundos < 86400) return `hace ${Math.floor(segundos / 3600)} h`;
    if (segundos < 7 * 86400) return `hace ${Math.floor(segundos / 86400)} d`;
    return formatDate(fecha, 'd MMM y', this.locale);
  }
}
