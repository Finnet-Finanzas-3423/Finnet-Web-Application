import { Routes } from '@angular/router';

export const routes: Routes = [
    { path:'', redirectTo: 'auth/sign-in', pathMatch: 'full' },
    { path: 'auth/sign-in', loadComponent: () => import('./auth/pages/sign-in/sign-in.component').then(m => m.SignInComponent) },
    { path: 'auth/sign-up', loadComponent: () => import('./auth/pages/sign-up/sign-up.component').then(m => m.SignUpComponent) },
    { path: 'home', loadComponent: () => import('./shared/components/home-page/home-page.component').then(m => m.HomePageComponent), canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]}
];
