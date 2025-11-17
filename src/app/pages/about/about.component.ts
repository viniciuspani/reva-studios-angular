import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { LanguageService } from '../../services/language.service';

/**
 * Componente da página Sobre
 * Exibe informações sobre a empresa, visão, missão e valores
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, CardModule, NavbarComponent, FooterComponent],
  templateUrl: 'about.component.html',
  styleUrls: ['about.component.scss']
})
export class AboutComponent {
  public languageService = inject(LanguageService);

  // Cards informativos sobre a empresa
  infoCards = [
    {
      icon: 'pi-camera',
      titleKey: 'about.vision.title',
      descKey: 'about.vision.description'
    },
    {
      icon: 'pi-users',
      titleKey: 'about.mission.title',
      descKey: 'about.mission.description'
    },
    {
      icon: 'pi-bolt',
      titleKey: 'about.innovation.title',
      descKey: 'about.innovation.description'
    },
    {
      icon: 'pi-shield',
      titleKey: 'about.quality.title',
      descKey: 'about.quality.description'
    }
  ];
}