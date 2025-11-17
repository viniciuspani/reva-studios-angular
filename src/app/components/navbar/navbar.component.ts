import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { StorageService } from '../../services/storage.service';
import { LanguageService } from '../../services/language.service';

/**
 * Componente de navegação principal
 * Renderiza menu com links e informações do usuário logado
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: 'navbar.component.html',
  styleUrls: ['navbar.component.scss']
})
export class NavbarComponent {
  private storageService = inject(StorageService);
  private router = inject(Router);
  public languageService = inject(LanguageService);

  // Obtém usuário atual do storage
  get currentUser() {
    return this.storageService.getCurrentUser();
  }

  /**
   * Realiza logout e redireciona para home
   */
  handleLogout(): void {
    this.storageService.logout();
    this.router.navigate(['/']);
  }

  /**
   * Alterna entre idiomas português e inglês
   */
  toggleLanguage(): void {
    const newLang = this.languageService.language() === 'pt-BR' ? 'en-US' : 'pt-BR';
    this.languageService.setLanguage(newLang);
  }

  /**
   * Obtém texto do botão de idioma
   */
  getLanguageButtonText(): string {
    return this.languageService.language() === 'pt-BR' ? 'EN' : 'PT';
  }
}