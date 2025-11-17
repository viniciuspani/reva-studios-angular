import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { StorageService } from '../services/storage.service';

/**
 * Guard de administrador
 * Protege rotas que requerem permissões de admin
 */
export const AdminGuard: CanActivateFn = () => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  
  const currentUser = storageService.getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'admin') {
    router.navigate(['/']);
    return false;
  }
  
  return true;
};