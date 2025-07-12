import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { hasBondosGuard } from './core/guards/has-bonos.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/sign-in', pathMatch: 'full' },

  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'sign-in', loadComponent: () => import('./auth/pages/sign-in/sign-in.component').then(m => m.SignInComponent) },
      { path: 'sign-up', loadComponent: () => import('./auth/pages/sign-up/sign-up.component').then(m => m.SignUpComponent) }
    ]
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./shared/components/home-page/home-page.component').then(m => m.HomePageComponent),
        canActivate: [() => import('./core/guards/has-bonos.guard').then(m => m.hasBondosGuard)]
      },
      { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'bonos/nuevo', loadComponent: () => import('./components/form-bono/form-bono.component').then(m => m.FormBonoComponent) },
      { path: 'bonos/:id', loadComponent: () => import('./components/bono-detail/bono-detail.component').then(m => m.BonoDetailComponent) },
      { path: 'bonos/:id/editar', loadComponent: () => import('./components/edit-bono/edit-bono.component').then(m => m.EditBonoComponent) }
    ]
  },

  // Ruta de fallback
  { path: '**', redirectTo: 'auth/sign-in' }
];
