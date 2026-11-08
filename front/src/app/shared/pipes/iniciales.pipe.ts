import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'iniciales' })
export class InicialesPipe implements PipeTransform {
  transform(nombre: string = '', apellido: string = ''): string {
    return `${nombre.trim()[0] ?? ''}${apellido.trim()[0] ?? ''}`.toUpperCase();
  }
}
