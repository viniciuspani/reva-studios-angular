import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';

/**
 * Componente de rodapé
 * Exibe informações de copyright e redes sociais
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.scss']
})
export class FooterComponent {
  public languageService = inject(LanguageService);
  private router = inject(Router);

  /**
   * Redireciona para a página de funcionalidade em construção
   */
  goToEmConstrucao(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/em-construcao']);
  }
}