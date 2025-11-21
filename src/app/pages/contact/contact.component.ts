import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { LanguageService } from '../../services/language.service';

/**
 * Componente da página de Contato
 * Exibe formulário de contato e informações da empresa
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ToastModule,
    NavbarComponent,
    FooterComponent
  ],
  providers: [MessageService],
  templateUrl: 'contact.component.html',
  styleUrls: ['contact.component.scss'] 
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  public languageService = inject(LanguageService);

  // Formulário de contato
  contactForm: FormGroup;

  // Informações de contato
  contactInfo = [
    {
      icon: 'pi-envelope',
      titleKey: 'contact.info.emailTitle',
      items: ['contato@revastudio.com', 'suporte@revastudio.com']
    },
    {
      icon: 'pi-phone',
      titleKey: 'contact.info.phoneTitle',
      items: ['+55 (11) 9 9999-9999', 'Seg - Sex: 9h às 18h']
    },
    {
      icon: 'pi-map-marker',
      titleKey: 'contact.info.locationTitle',
      items: ['São Paulo, SP', 'Brasil']
    }
  ];

  constructor() {
    // Inicializa formulário de contato
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  /**
   * Processa envio do formulário de contato
   */
  handleSubmit(): void {
    if (this.contactForm.invalid) return;

    this.messageService.add({
      severity: 'success',
      summary: this.languageService.t('contact.form.successTitle'),
      detail: this.languageService.t('contact.form.successDescription')
    });

    this.contactForm.reset();
  }
}