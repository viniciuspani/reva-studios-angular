import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

/**
 * Configuração de rotas da aplicação
 * Define todas as rotas e seus respectivos guards de proteção
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'sobre',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'planos',
    loadComponent: () => import('./pages/plans/plans.component').then(m => m.PlansComponent)
  },
  {
    path: 'contato',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'em-construcao',
    loadComponent: () => import('./components/em-construcao/em-construcao.component').then(m => m.EmConstrucaoComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];