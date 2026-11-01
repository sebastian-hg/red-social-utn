import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModalService, TipoModal } from '../../core/services/modal.service';
import { Icon, NombreIcono } from '../icon/icon';

const ICONO_POR_TIPO: Record<TipoModal, NombreIcono> = {
  exito: 'check',
  error: 'alerta',
  info: 'info',
  confirmar: 'info',
};

@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'modalService.cerrar(false)' },
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  protected readonly modalService = inject(ModalService);
  protected readonly modal = this.modalService.actual;
  protected readonly icono = computed(() => {
    const modal = this.modal();
    return modal ? ICONO_POR_TIPO[modal.tipo] : 'info';
  });
}
