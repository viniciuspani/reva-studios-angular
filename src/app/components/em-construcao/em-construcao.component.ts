import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-em-construcao',
  imports: [ButtonModule],
  templateUrl: './em-construcao.component.html',
  styleUrl: './em-construcao.component.scss',
})
export class EmConstrucaoComponent {
  private router = inject(Router);
  public languageService = inject(LanguageService);

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
