import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, DatoGrafico } from '../../core/services/admin.service';
import { TruncarPipe } from '../../shared/pipes/truncar.pipe';

@Component({
  selector: 'app-dashboard-estadisticas',
  imports: [FormsModule, TruncarPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-estadisticas.html',
  styleUrl: './dashboard-estadisticas.scss',
})
export class DashboardEstadisticas {
  private readonly admin = inject(AdminService);
  protected desde = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  protected hasta = new Date().toISOString().slice(0, 10);
  protected publicaciones = signal<DatoGrafico[]>([]);
  protected comentarios = signal<DatoGrafico[]>([]);
  protected comentariosPublicacion = signal<DatoGrafico[]>([]);
  protected readonly colores = ['#ff7a2f', '#22c55e', '#3b82f6', '#a855f7', '#eab308', '#ec4899'];
  protected tabActiva = signal<'publicaciones' | 'comentarios' | 'por-publicacion'>('publicaciones');

  constructor() { this.cargar(); }

  protected cargar(): void {
    this.admin.publicacionesPorUsuario(this.desde, this.hasta).subscribe((d) => this.publicaciones.set(d));
    this.admin.comentarios(this.desde, this.hasta).subscribe((d) => this.comentarios.set(d));
    this.admin.comentariosPorPublicacion(this.desde, this.hasta).subscribe((d) => this.comentariosPublicacion.set(d));
  }

  protected maximo(datos: DatoGrafico[]): number {
    return Math.max(...datos.map((dato) => dato.cantidad), 1);
  }

  protected seleccionar(tab: 'publicaciones' | 'comentarios' | 'por-publicacion'): void {
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
