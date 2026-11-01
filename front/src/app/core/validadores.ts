import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

/** Marca el control "repetir" con el error `noCoincide` si difiere del original. */
export function coincide(original: string, repetir: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const a = grupo.get(original)?.value;
    const control = grupo.get(repetir);
    if (!control) return null;
    const { noCoincide: _, ...otros } = control.errors ?? {};
    const errores = a && control.value && a !== control.value ? { ...otros, noCoincide: true } : otros;
    control.setErrors(Object.keys(errores).length ? errores : null);
    return null;
  };
}

export function fechaPasada(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return new Date(control.value) < new Date() ? null : { fechaFutura: true };
}
