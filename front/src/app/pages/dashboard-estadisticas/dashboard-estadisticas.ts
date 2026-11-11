import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, DatoGrafico } from '../../core/services/admin.service';
import { TruncarPipe } from '../../shared/pipes/truncar.pipe';

interface PuntoLinea {
  fecha: string;
  etiqueta: string;
  cantidad: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-dashboard-estadisticas',
  imports: [FormsModule, DecimalPipe, TruncarPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-estadisticas.html',
  styleUrl: './dashboard-estadisticas.scss',
})
export class DashboardEstadisticas {
  private readonly admin = inject(AdminService);
  protected desde = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  protected hasta = new Date().toISOString().slice(0, 10);
  protected publicaciones = signal<DatoGrafico[]>([]);
  protected comentariosPorDia = signal<DatoGrafico[]>([]);
  protected comentariosPublicacion = signal<DatoGrafico[]>([]);
  protected readonly error = signal(false);
  protected readonly colores = ['#f97316', '#2563eb', '#16a34a', '#9333ea', '#eab308', '#db2777', '#0891b2'];
  protected readonly tabActiva = signal<'publicaciones' | 'comentarios-por-dia' | 'por-publicacion'>('publicaciones');
  protected readonly totalComentariosPorDia = computed(() =>
    this.comentariosPorDia().reduce((total, dato) => total + dato.cantidad, 0),
  );
  protected readonly diasComentarios = computed(() => {
    const datos = this.comentariosPorDia();
    if (!datos.length) return [];

    const cantidades = new Map(datos.map(({ fecha, cantidad }) => [fecha, cantidad]));
    const inicio = new Date(`${this.desde}T00:00:00.000Z`);
    const fin = new Date(`${this.hasta}T00:00:00.000Z`);
    const dias: { fecha: string; etiqueta: string; cantidad: number }[] = [];

    for (const cursor = inicio; cursor <= fin; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const fecha = cursor.toISOString().slice(0, 10);
      dias.push({
        fecha,
        etiqueta: new Intl.DateTimeFormat('es-AR', {
          day: '2-digit',
          month: '2-digit',
          timeZone: 'UTC',
        }).format(cursor),
        cantidad: cantidades.get(fecha) ?? 0,
      });
    }

    return dias;
  });
  protected readonly puntosComentarios = computed<PuntoLinea[]>(() => {
    const dias = this.diasComentarios();
    const maximo = Math.max(...dias.map(({ cantidad }) => cantidad), 1);
    return dias.map((dia, indice) => ({
      ...dia,
      x: dias.length === 1 ? 50 : 5 + (indice * 90) / (dias.length - 1),
      y: 45 - (dia.cantidad / maximo) * 38,
    }));
  });
  protected readonly puntosLinea = computed(() =>
    this.puntosComentarios().map(({ x, y }) => `${x},${y}`).join(' '),
  );
  protected readonly segmentosTorta = computed(() => {
    const datos = this.comentariosPublicacion();
    const total = datos.reduce((suma, dato) => suma + dato.cantidad, 0);
    let acumulado = 0;
    const segmentos = datos.map((dato, indice) => {
      const porcentaje = total ? (dato.cantidad / total) * 100 : 0;
      const segmento = {
        titulo: dato.titulo ?? 'Publicación',
        cantidad: dato.cantidad,
        porcentaje,
        color: this.colores[indice % this.colores.length],
        inicio: acumulado,
      };
      acumulado += porcentaje;
      return segmento;
    });
    return segmentos;
  });
  protected readonly gradienteTorta = computed(() => {
    const segmentos = this.segmentosTorta();
    if (!segmentos.length) return 'conic-gradient(#e2e8f0 0% 100%)';
    return `conic-gradient(${segmentos
      .map(({ color, inicio, porcentaje }) => `${color} ${inicio}% ${inicio + porcentaje}%`)
      .join(', ')})`;
  });

  constructor() { this.cargar(); }

  protected cargar(): void {
    this.error.set(false);
    this.publicaciones.set([]);
    this.comentariosPorDia.set([]);
    this.comentariosPublicacion.set([]);
    this.admin.publicacionesPorUsuario(this.desde, this.hasta).subscribe({
      next: (datos) => this.publicaciones.set(datos),
      error: () => this.error.set(true),
    });
    this.admin.comentariosPorDia(this.desde, this.hasta).subscribe({
      next: (datos) => this.comentariosPorDia.set(datos),
      error: () => this.error.set(true),
    });
    this.admin.comentariosPorPublicacion(this.desde, this.hasta).subscribe({
      next: (datos) => this.comentariosPublicacion.set(datos),
      error: () => this.error.set(true),
    });
  }

  protected maximo(datos: DatoGrafico[]): number {
    return Math.max(...datos.map((dato) => dato.cantidad), 1);
  }

  protected seleccionar(tab: 'publicaciones' | 'comentarios-por-dia' | 'por-publicacion'): void {
    this.tabActiva.set(tab);
  }

  protected formatoInput(fechaIso: string): string {
    const [anio, mes, dia] = fechaIso.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  protected setDesde(evento: Event): void {
    this.desde = this.isoDesdeTexto((evento.target as HTMLInputElement).value, this.desde);
  }

  protected setHasta(evento: Event): void {
    this.hasta = this.isoDesdeTexto((evento.target as HTMLInputElement).value, this.hasta);
  }

  private isoDesdeTexto(texto: string, actual: string): string {
    const partes = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!partes) return actual;
    const iso = `${partes[3]}-${partes[2]}-${partes[1]}`;
    return Number.isNaN(new Date(`${iso}T00:00:00`).getTime()) ? actual : iso;
  }
}
