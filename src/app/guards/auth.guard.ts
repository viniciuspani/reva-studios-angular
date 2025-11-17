import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { StorageService } from '../services/storage.service';

/**
 * Guard de autenticação
 * Protege rotas que requerem usuário logado
 */
export const AuthGuard: CanActivateFn = () => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  
  const currentUser = storageService.getCurrentUser();
  
  if (!currentUser) {
    router.navigate(['/auth']);
    return false;
  }
  
  return true;
};