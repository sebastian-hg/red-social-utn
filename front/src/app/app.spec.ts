import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { ModalService } from './core/services/modal.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el modal global y lo cierra resolviendo la respuesta', async () => {
    const fixture = TestBed.createComponent(App);
    const modal = TestBed.inject(ModalService);
    const respuesta = modal.abrir({ tipo: 'error', titulo: 'Ups', mensaje: 'Algo falló' });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="dialog"] h2')?.textContent).toContain('Ups');

    compiled.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    expect(await respuesta).toBe(true);
  });
});
