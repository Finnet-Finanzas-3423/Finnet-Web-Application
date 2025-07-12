import { Routes } from '@angular/router';

export const routes: Routes = [
  { path:'', redirectTo: 'auth/sign-in', pathMatch: 'full' },
  { path: 'auth/sign-in', loadComponent: () => import('./auth/pages/sign-in/sign-in.component').then(m => m.SignInComponent) },
  { path: 'auth/sign-up', loadComponent: () => import('./auth/pages/sign-up/sign-up.component').then(m => m.SignUpComponent) },
  { path: 'home', loadComponent: () => import('./shared/components/home-page/home-page.component').then(m => m.HomePageComponent), canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]},
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]},
  {
    path: 'bonos/nuevo',
    loadComponent: () => import('./components/form-bono/form-bono.component').then(m => m.FormBonoComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
  },
  {
    path: 'bonos/:id',
    loadComponent: () => import('./components/bono-detail/bono-detail.component').then(m => m.BonoDetailComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
  },
  {
    path: 'bonos/:id/editar',
    loadComponent: () => import('./components/edit-bono/edit-bono.component').then(m => m.EditBonoComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
  }
];
