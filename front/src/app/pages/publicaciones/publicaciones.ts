import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Orden, Publicacion } from '../../core/models/publicacion';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { Icon } from '../../shared/icon/icon';
import { NuevaPublicacion } from '../../shared/nueva-publicacion/nueva-publicacion';
import { PublicacionCard } from '../../shared/publicacion-card/publicacion-card';

const POR_PAGINA = 5;

@Component({
  selector: 'app-publicaciones',
  imports: [RouterLink, Icon, NuevaPublicacion, PublicacionCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.scss',
})
export class Publicaciones {
  private readonly publicacionesService = inject(PublicacionesService);
  private readonly router = inject(Router);
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });

  // El orden y la página viven en la URL (?orden=meGusta&pagina=2) para poder volver atrás.
  protected readonly orden = computed<Orden>(() =>
    this.params().get('orden') === 'meGusta' ? 'meGusta' : 'fecha',
  );
  protected readonly pagina = computed(() => Math.max(1, Math.floor(Number(this.params().get('pagina'))) || 1));

  protected readonly publicaciones = signal<Publicacion[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  private readonly version = signal(0);

  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / POR_PAGINA)));
  protected readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const desde = Math.max(1, Math.min(this.pagina() - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => desde + i);
  });

  constructor() {
    effect(() => {
      const orden = this.orden();
      const pagina = this.pagina();
      this.version();
      untracked(() => this.cargar(orden, pagina));
    });
  }

  protected irA(cambios: { orden?: Orden; pagina?: number }): void {
    this.router.navigate([], {
      queryParams: { orden: this.orden(), pagina: this.pagina(), ...cambios },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected recargar(): void {
    this.version.update((v) => v + 1);
  }

  protected alCrear(): void {
    if (this.orden() === 'fecha' && this.pagina() === 1) this.recargar();
    else this.irA({ orden: 'fecha', pagina: 1 });
  }

  private cargar(orden: Orden, pagina: number): void {
    this.cargando.set(true);
    this.error.set(false);
    this.publicacionesService
      .listar({ orden, offset: (pagina - 1) * POR_PAGINA, limit: POR_PAGINA })
      .subscribe({
        next: ({ total, publicaciones }) => {
          this.total.set(total);
          this.publicaciones.set(publicaciones);
          this.cargando.set(false);
          // Si se borró lo último de la página, volver a la anterior.
          if (!publicaciones.length && pagina > 1) this.irA({ pagina: this.totalPaginas() });
        },
        error: () => {
          this.cargando.set(false);
          this.error.set(true);
        },
      });
  }
}
