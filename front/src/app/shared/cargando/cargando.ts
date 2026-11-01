import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pantalla de carga que se muestra mientras se valida la sesión al iniciar la app. */
@Component({
  selector: 'app-cargando',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pantalla" role="status" aria-live="polite">
      <span class="logo display">ARENA</span>
      <div class="anillo"></div>
      <p>Calentando motores...</p>
    </div>
  `,
  styles: `
    .pantalla {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      background:
        radial-gradient(circle at 30% 30%, rgb(255 107 44 / 0.18), transparent 50%),
        radial-gradient(circle at 70% 70%, rgb(198 244 50 / 0.12), transparent 50%),
        var(--bg);
    }
    .logo {
      font-size: 4rem;
      background: var(--gradient);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .anillo {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 4px solid var(--surface-2);
      border-top-color: var(--lime);
      border-right-color: var(--orange);
      animation: girar 0.8s linear infinite;
    }
    p {
      margin: 0;
      color: var(--muted);
      font-weight: 600;
    }
  `,
})
export class Cargando {}
