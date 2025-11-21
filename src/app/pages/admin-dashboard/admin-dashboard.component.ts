import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { StorageService } from '../../services/storage.service';
import { LanguageService } from '../../services/language.service';
import { User, StoragePlan, PlanType, PaymentMethod, AccountStatus } from '../../models/user.model';

/**
 * Componente do painel administrativo
 * Gerencia CRUD completo de usuários com informações detalhadas
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ProgressBarModule,
    DividerModule,
    TooltipModule,
    NavbarComponent
  ],
  providers: [MessageService],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  protected storageService = inject(StorageService);
  private messageService = inject(MessageService);
  public languageService = inject(LanguageService);

  // Signals para controle de estado
  users = signal<User[]>([]);
  editingUser = signal<User | null>(null);
  viewingUser = signal<User | null>(null);
  showUserDialog = signal(false);
  showDetailsDialog = signal(false);

  // Formulário de usuário
  userForm: FormGroup;

  // Opções para dropdowns
  planOptions = [
    { label: 'Essencial (100 GB)', value: 'essencial' as StoragePlan },
    { label: 'Pro (300 GB)', value: 'pro' as StoragePlan },
    { label: 'Studio (Ilimitado)', value: 'studio' as StoragePlan }
  ];

  planTypeOptions = [
    { label: 'Mensal', value: 'mensal' as PlanType },
    { label: 'Semestral', value: 'semestral' as PlanType },
    { label: 'Anual', value: 'anual' as PlanType }
  ];

  paymentOptions = [
    { label: 'Boleto', value: 'boleto' as PaymentMethod },
    { label: 'Cartão', value: 'cartao' as PaymentMethod },
    { label: 'PIX', value: 'pix' as PaymentMethod }
  ];

  statusOptions = [
    { label: 'Ativo', value: 'ativo' as AccountStatus },
    { label: 'Inativo', value: 'inativo' as AccountStatus },
    { label: 'Cancelado', value: 'cancelado' as AccountStatus }
  ];

  constructor() {
    // Inicializa formulário de usuário
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      plan: ['essencial', Validators.required],
      cpf: [''],
      cnpj: [''],
      rg: [''],
      endereco: ['', Validators.required],
      telefone: ['', Validators.required],
      planType: ['mensal', Validators.required],
      paymentMethod: ['pix', Validators.required],
      accountStatus: ['ativo', Validators.required]
    });
  }

  ngOnInit(): void {
    // Verifica se usuário é admin
    const currentUser = this.storageService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/auth']);
      return;
    }
    this.loadUsers();
  }

  /**
   * Carrega lista de usuários do storage
   */
  loadUsers(): void {
    const allUsers = this.storageService.getUsers().filter(u => u.role === 'user');
    this.users.set(allUsers);
  }

  /**
   * Abre dialog para criar novo usuário
   */
  openCreateDialog(): void {
    this.editingUser.set(null);
    this.userForm.reset({
      plan: 'essencial',
      planType: 'mensal',
      paymentMethod: 'pix',
      accountStatus: 'ativo'
    });
    // Password obrigatório para novo usuário
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showUserDialog.set(true);
  }

  /**
   * Abre dialog para editar usuário existente
   */
  openEditDialog(user: User): void {
    this.editingUser.set(user);
    this.userForm.patchValue(user);
    // Password opcional para edição
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showUserDialog.set(true);
  }

  /**
   * Abre dialog com detalhes completos do usuário
   */
  openDetailsDialog(user: User): void {
    this.viewingUser.set(user);
    this.showDetailsDialog.set(true);
  }

  /**
   * Fecha dialog de usuário
   */
  closeUserDialog(): void {
    this.editingUser.set(null);
    this.showUserDialog.set(false);
    this.userForm.reset();
  }

  /**
   * Salva usuário (criar ou atualizar)
   */
  saveUser(): void {
    if (this.userForm.invalid) return;

    const formData = this.userForm.value;
    const { cpf, cnpj } = formData;

    // Valida CPF ou CNPJ
    if (!cpf && !cnpj) {
      this.showError('Erro', 'É obrigatório preencher CPF ou CNPJ');
      return;
    }

    const currentUser = this.editingUser();

    if (currentUser) {
      // Atualizar usuário existente
      const newPlan = formData.plan;
      const newPlanType = formData.planType;
      const planChanged = currentUser.plan !== newPlan || currentUser.planType !== newPlanType;

      let updatedPlanHistory = currentUser.planHistory || [];

      if (planChanged) {
        // Finaliza plano atual
        if (updatedPlanHistory.length > 0) {
          updatedPlanHistory[updatedPlanHistory.length - 1].endDate = new Date().toISOString();
          updatedPlanHistory[updatedPlanHistory.length - 1].status = 'inativo';
        }

        // Adiciona novo plano
        updatedPlanHistory = [...updatedPlanHistory, {
          id: crypto.randomUUID(),
          planType: newPlan,
          billingCycle: newPlanType,
          paymentMethod: formData.paymentMethod,
          startDate: new Date().toISOString(),
          status: 'ativo'
        }];
      }

      const updateData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        plan: newPlan,
        cpf,
        cnpj,
        rg: formData.rg,
        endereco: formData.endereco,
        telefone: formData.telefone,
        planType: newPlanType,
        paymentMethod: formData.paymentMethod,
        accountStatus: formData.accountStatus,
        planHistory: updatedPlanHistory
      };

      // Atualiza senha se fornecida
      if (formData.password) {
        updateData.password = formData.password;
      }

      this.storageService.updateUser(currentUser.id, updateData);
      this.showSuccess('Usuário atualizado!', 'As alterações foram salvas.');
    } else {
      // Criar novo usuário
      this.storageService.createUser({
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
      this.showSuccess('Usuário criado!', `${formData.name} foi adicionado ao sistema.`);
    }

    this.loadUsers();
    this.closeUserDialog();
  }

  /**
   * Deleta um usuário após confirmação
   */
  deleteUser(user: User): void {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      this.storageService.deleteUser(user.id);
      this.showSuccess('Usuário excluído', 'O usuário foi removido do sistema.');
      this.loadUsers();
    }
  }

  /**
   * Calcula porcentagem de storage usado
   */
  getStoragePercentage(user: User): number {
    const limit = this.storageService.getStorageLimit(user.plan);
    if (limit === Infinity) return 0;
    return (user.storageUsed / limit) * 100;
  }

  /**
   * Formata bytes em formato legível
   */
  formatBytes(bytes: number): string {
    return this.storageService.formatBytes(bytes);
  }

  /**
   * Formata data em formato brasileiro
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtém label do status traduzida
   */
  getStatusLabel(status: AccountStatus): string {
    const statusMap: Record<AccountStatus, string> = {
      'ativo': 'Ativo',
      'inativo': 'Inativo',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtém label do método de pagamento traduzida
   */
  getPaymentLabel(payment: PaymentMethod): string {
    const paymentMap: Record<PaymentMethod, string> = {
      'boleto': 'Boleto',
      'cartao': 'Cartão',
      'pix': 'PIX'
    };
    return paymentMap[payment] || payment;
  }

  /**
   * Obtém label do tipo de plano traduzida
   */
  getPlanTypeLabel(planType: PlanType): string {
    const planTypeMap: Record<PlanType, string> = {
      'mensal': 'Mensal',
      'semestral': 'Semestral',
      'anual': 'Anual'
    };
    return planTypeMap[planType] || planType;
  }

  /**
   * Obtém label do plano de armazenamento traduzida
   */
  getPlanLabel(plan: StoragePlan): string {
    const planMap: Record<StoragePlan, string> = {
      'essencial': 'Essencial',
      'pro': 'Pro',
      'studio': 'Studio'
    };
    return planMap[plan] || plan;
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
}