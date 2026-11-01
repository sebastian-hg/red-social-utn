import { Routes } from '@angular/router';
import { autenticadoGuard, invitadoGuard } from './core/guards';
import { Shell } from './layout/shell/shell';
import { Login } from './pages/login/login';
import { MiPerfil } from './pages/mi-perfil/mi-perfil';
import { PublicacionDetalle } from './pages/publicacion-detalle/publicacion-detalle';
import { Publicaciones } from './pages/publicaciones/publicaciones';
import { Registro } from './pages/registro/registro';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [invitadoGuard], title: 'Iniciar sesión · Arena' },
  { path: 'registro', component: Registro, canActivate: [invitadoGuard], title: 'Crear cuenta · Arena' },
  {
    path: '',
    component: Shell,
    canActivate: [autenticadoGuard],
    children: [
      { path: 'publicaciones', component: Publicaciones, title: 'Publicaciones · Arena' },
      { path: 'publicaciones/:id', component: PublicacionDetalle, title: 'Publicación · Arena' },
      { path: 'mi-perfil', component: MiPerfil, title: 'Mi perfil · Arena' },
      { path: '', pathMatch: 'full', redirectTo: 'publicaciones' },
    ],
  },
  { path: '**', redirectTo: 'publicaciones' },
];
