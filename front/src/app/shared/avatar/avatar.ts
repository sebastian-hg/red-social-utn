import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Foto de perfil con anillo degradado; si no hay imagen muestra las iniciales. */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="anillo" [style.width.px]="tamano()" [style.height.px]="tamano()">
      @if (imagen(); as src) {
        <img [src]="src" [alt]="'Foto de ' + nombre()" />
      } @else {
        <span [style.font-size.px]="tamano() * 0.38">{{ iniciales() }}</span>
      }
    </div>
  `,
  styles: `
    .anillo {
      border-radius: 50%;
      padding: 2.5px;
      background: var(--gradient);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    img,
    span {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2.5px solid var(--bg);
      object-fit: cover;
      background: var(--surface-2);
    }
    span {
      display: grid;
      place-items: center;
      font-weight: 800;
      color: var(--lime);
    }
  `,
})
export class Avatar {
  readonly imagen = input<string | null>(null);
  readonly nombre = input('');
  readonly tamano = input(40);

  protected readonly iniciales = computed(() =>
    this.nombre()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join('') || '?',
  );
}
