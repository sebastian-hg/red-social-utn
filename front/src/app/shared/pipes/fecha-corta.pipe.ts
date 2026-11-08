import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fechaCorta' })
export class FechaCortaPipe implements PipeTransform {
  transform(fecha: string | Date): string {
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime()) ? '' : valor.toLocaleDateString('es-AR');
  }
}
