import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { LanguageService } from '../../services/language.service';

/**
 * Componente da página de Planos
 * Exibe os planos disponíveis com preços e features
 */
@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    BadgeModule,
    NavbarComponent,
    FooterComponent
  ],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent {
  public languageService = inject(LanguageService);

  // Definição dos planos
  plans = [
    {
      key: 'essencial',
      featured: false
    },
    {
      key: 'pro',
      featured: true
    },
    {
      key: 'studio',
      featured: false
    }
  ];

  /**
   * Obtém features de um plano específico
   */
  getPlanFeatures(planKey: string): string[] {
    const featuresKey = `plans.${planKey}.features`;
    const features = this.languageService.t(featuresKey);
    return Array.isArray(features) ? features : [];
  }
}