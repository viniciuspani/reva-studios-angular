import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { StorageService } from '../../services/storage.service';
import { LanguageService } from '../../services/language.service';
import { StoragePlan, PlanType, PaymentMethod } from '../../models/user.model';

/**
 * Componente de autenticação
 * Gerencia login, recuperação de senha e criação de conta
 */
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    SelectModule,
    DividerModule,
    NavbarComponent
  ],
  providers: [MessageService],
  templateUrl: 'auth.component.html',
  styleUrls: ['auth.component.scss']
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private storageService = inject(StorageService);
  private messageService = inject(MessageService);
  public languageService = inject(LanguageService);

  // Signals para controle de dialogs
  showRecoveryDialog = signal(false);
  showSignupDialog = signal(false);
  isLoading = signal(false);

  // Formulários
  loginForm: FormGroup;
  recoveryForm: FormGroup;
  signupForm: FormGroup;

  // Opções para dropdowns (getter para suportar tradução dinâmica)
  get planOptions() {
    return [
      { label: this.languageService.t('auth.signup.planOptions.essencial'), value: 'essencial' as StoragePlan },
      { label: this.languageService.t('auth.signup.planOptions.pro'), value: 'pro' as StoragePlan },
      { label: this.languageService.t('auth.signup.planOptions.studio'), value: 'studio' as StoragePlan }
    ];
  }

  get planTypeOptions() {
    return [
      { label: this.languageService.t('auth.signup.planTypeOptions.monthly'), value: 'mensal' as PlanType },
      { label: this.languageService.t('auth.signup.planTypeOptions.semester'), value: 'semestral' as PlanType },
      { label: this.languageService.t('auth.signup.planTypeOptions.annual'), value: 'anual' as PlanType }
    ];
  }

  get paymentOptions() {
    return [
      { label: this.languageService.t('auth.signup.paymentOptions.boleto'), value: 'boleto' as PaymentMethod },
      { label: this.languageService.t('auth.signup.paymentOptions.card'), value: 'cartao' as PaymentMethod },
      { label: this.languageService.t('auth.signup.paymentOptions.pix'), value: 'pix' as PaymentMethod }
    ];
  }

  constructor() {
    // Inicializa formulário de login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Inicializa formulário de recuperação
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Inicializa formulário de cadastro
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      cpf: [''],
      cnpj: [''],
      rg: [''],
      endereco: ['', Validators.required],
      telefone: ['', Validators.required],
      plan: ['essencial', Validators.required],
      planType: ['mensal', Validators.required],
      paymentMethod: ['pix', Validators.required]
    });
  }

  /**
   * Processa login do usuário
   */
  handleLogin(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;
    
    const users = this.storageService.getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      this.showError('Erro no login', 'Email ou senha incorretos');
      this.isLoading.set(false);
      return;
    }

    // Verifica senha temporária
    if (user.temporaryPassword && user.temporaryPasswordExpiry) {
      const expiryDate = new Date(user.temporaryPasswordExpiry);
      const now = new Date();

      if (now > expiryDate) {
        this.storageService.updateUser(user.id, {
          temporaryPassword: undefined,
          temporaryPasswordExpiry: undefined
        });
        this.showError('Senha temporária expirada', 'Solicite uma nova senha');
        this.isLoading.set(false);
        return;
      }

      if (user.temporaryPassword === password) {
        this.storageService.updateUser(user.id, { needsPasswordReset: true });
        this.storageService.setCurrentUser(user.id);
        this.showSuccess('Login com senha temporária', 'Você precisa definir uma nova senha');
        this.router.navigate(['/reset-password']);
        this.isLoading.set(false);
        return;
      }
    }

    // Verifica senha normal
    if (user.password === password) {
      this.storageService.setCurrentUser(user.id);
      this.showSuccess('Login realizado!', `Bem-vindo de volta, ${user.name}!`);
      this.router.navigate([user.role === 'admin' ? '/admin' : '/dashboard']);
    } else {
      this.showError('Erro no login', 'Email ou senha incorretos');
    }

    this.isLoading.set(false);
  }

  /**
   * Processa recuperação de senha
   */
  handlePasswordRecovery(): void {
    if (this.recoveryForm.invalid) return;

    const email = this.recoveryForm.value.email;
    const result = this.storageService.setTemporaryPassword(email);

    if (!result.success) {
      this.showError('Email não encontrado', 'Não encontramos uma conta com este email');
      return;
    }

    const { tempPassword, user } = result;

    // Simula envio via WhatsApp
    const whatsappMessage = `Olá ${user?.name}!\n\nSua senha temporária é: ${tempPassword}\n\nVálida por 10 minutos.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');

    this.showSuccess('✅ Senha temporária gerada!', `WhatsApp: Link aberto para envio`);
    this.showRecoveryDialog.set(false);
    this.recoveryForm.reset();
  }

  /**
   * Processa criação de nova conta
   */
  handleSignup(): void {
    if (this.signupForm.invalid) return;

    const { cpf, cnpj } = this.signupForm.value;
    
    // Valida CPF ou CNPJ
    if (!cpf && !cnpj) {
      this.showError('Erro no cadastro', 'É obrigatório preencher CPF ou CNPJ');
      return;
    }

    this.isLoading.set(true);
    const formData = this.signupForm.value;

    // Verifica se email já existe
    const users = this.storageService.getUsers();
    if (users.some(u => u.email === formData.email)) {
      this.showError('Erro no cadastro', 'Este email já está cadastrado');
      this.isLoading.set(false);
      return;
    }

    // Cria novo usuário
    const newUser = this.storageService.createUser({
      ...formData,
      role: 'user',
      accountStatus: 'ativo',
      planHistory: [{
        id: crypto.randomUUID(),
        planType: formData.plan,
        billingCycle: formData.planType,
        paymentMethod: formData.paymentMethod,
        startDate: new Date().toISOString(),
        status: 'ativo'
      }]
    });

    this.storageService.setCurrentUser(newUser.id);
    this.showSuccess('Cadastro realizado!', 'Sua conta foi criada com sucesso');
    this.showSignupDialog.set(false);
    this.router.navigate(['/dashboard']);
    this.isLoading.set(false);
  }

  /**
   * Exibe mensagem de sucesso
   */
  private showSuccess(title: string, message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message
    });
  }

  /**
   * Exibe mensagem de erro
   */
  private showError(title: string, message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message
    });
  }

  /**
   * Redireciona para a página de funcionalidade em construção
   */
  goToEmConstrucao(): void {
    this.router.navigate(['/em-construcao']);
  }
}