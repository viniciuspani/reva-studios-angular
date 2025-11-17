import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { LanguageService } from '../../services/language.service';

/**
 * Componente da página inicial
 * Exibe hero section, carrossel de features e CTA final
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    ButtonModule, 
    CarouselModule,
    NavbarComponent, 
    FooterComponent
  ],
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss']
})
export class HomeComponent {
  public languageService = inject(LanguageService);

  // Configuração do carrossel
  carouselResponsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '768px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  // Slides do carrossel
  carouselSlides = [
    {
      id: 1,
      image: 'assets/carousel-memories.jpg',
      titleKey: 'home.hero.title',
      descriptionKey: 'home.hero.description'
    },
    {
      id: 2,
      image: 'assets/carousel-professional-1.jpg',
      titleKey: 'home.professional.title',
      descriptionKey: 'home.professional.description',
      features: [
        { icon: 'pi-shield', titleKey: 'home.professional.security', descKey: 'home.professional.securityDesc' },
        { icon: 'pi-camera', titleKey: 'home.professional.delivery', descKey: 'home.professional.deliveryDesc' }
      ]
    },
    {
      id: 3,
      image: 'assets/carousel-professional-2.jpg',
      titleKey: 'home.studioControl.title',
      subtitleKey: 'home.studioControl.subtitle',
      descriptionKey: 'home.studioControl.description',
      features: [
        { icon: 'pi-users', titleKey: 'home.studioControl.clientPortal', descKey: 'home.studioControl.clientPortalDesc' },
        { icon: 'pi-cloud', titleKey: 'home.studioControl.storage', descKey: 'home.studioControl.storageDesc' }
      ]
    },
    {
      id: 4,
      image: 'assets/carousel-hobby.jpg',
      titleKey: 'home.hobby.title',
      subtitleKey: 'home.hobby.subtitle',
      descriptionKey: 'home.hobby.description',
      features: [
        { icon: 'pi-camera', titleKey: 'home.hobby.easyUse', descKey: 'home.hobby.easyUseDesc' },
        { icon: 'pi-shield', titleKey: 'home.hobby.secureShare', descKey: 'home.hobby.secureShareDesc' }
      ]
    }
  ];
}