import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { StorageService } from '../../services/storage.service';
import { LanguageService } from '../../services/language.service';

/**
 * Componente de reset de senha
 * Permite usuário redefinir senha através de código de verificação
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private storageService = inject(StorageService);
  private messageService = inject(MessageService);
  languageService = inject(LanguageService);

  // Controle de etapas do processo de reset
  step = signal<'email' | 'code' | 'password'>('email');
  loading = signal(false);
  email = signal('');

  // Formulário para solicitar código
  emailForm: FormGroup;
  
  // Formulário para validar código
  codeForm: FormGroup;
  
  // Formulário para nova senha
  passwordForm: FormGroup;

  constructor() {
    // Inicializa formulário de email
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Inicializa formulário de código de verificação
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Inicializa formulário de nova senha com validação de confirmação
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Validador customizado para verificar se as senhas coincidem
   */
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Envia código de verificação para o email
   */
  sendCode() {
    if (this.emailForm.invalid) return;

    this.loading.set(true);
    const emailValue = this.emailForm.value.email;

    // Simula envio de código (em produção, chamar API)
    setTimeout(() => {
      const users = this.storageService.getUsers();
      const userExists = users.some(u => u.email === emailValue);

      if (userExists) {
        this.email.set(emailValue);
        this.step.set('code');
        this.messageService.add({
          severity: 'success',
          summary: this.languageService.t('success'),
          detail: this.languageService.t('codeSent')
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: this.languageService.t('error'),
          detail: this.languageService.t('emailNotFound')
        });
      }
      this.loading.set(false);
    }, 1000);
  }

  /**
   * Verifica o código de verificação
   */
  verifyCode() {
    if (this.codeForm.invalid) return;

    this.loading.set(true);

    // Simula verificação de código (em produção, validar com API)
    setTimeout(() => {
      const code = this.codeForm.value.code;
      
      // Código de exemplo para teste: 123456
      if (code === '123456') {
        this.step.set('password');
        this.messageService.add({
          severity: 'success',
          summary: this.languageService.t('success'),
          detail: this.languageService.t('codeVerified')
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: this.languageService.t('error'),
          detail: this.languageService.t('invalidCode')
        });
      }
      this.loading.set(false);
    }, 1000);
  }

  /**
   * Redefine a senha do usuário
   */
  resetPassword() {
    if (this.passwordForm.invalid) return;

    this.loading.set(true);

    setTimeout(() => {
      const users = this.storageService.getUsers();
      const userIndex = users.findIndex(u => u.email === this.email());

      if (userIndex !== -1) {
        // Atualiza a senha do usuário
        users[userIndex].password = this.passwordForm.value.password;
        this.storageService.saveUsers(users);

        this.messageService.add({
          severity: 'success',
          summary: this.languageService.t('success'),
          detail: this.languageService.t('passwordReset')
        });

        // Redireciona para login após 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      }
      this.loading.set(false);
    }, 1000);
  }

  /**
   * Volta para a tela de login
   */
  backToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Volta para a etapa anterior
   */
  goBack() {
    if (this.step() === 'code') {
      this.step.set('email');
    } else if (this.step() === 'password') {
      this.step.set('code');
    }
  }
}