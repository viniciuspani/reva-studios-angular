/**
 * Tipos de planos de armazenamento disponíveis
 */
export type StoragePlan = 'essencial' | 'pro' | 'studio';

/**
 * Tipos de ciclo de pagamento
 */
export type PlanType = 'mensal' | 'semestral' | 'anual';

/**
 * Métodos de pagamento aceitos
 */
export type PaymentMethod = 'boleto' | 'cartao' | 'pix';

/**
 * Status da conta do usuário
 */
export type AccountStatus = 'ativo' | 'inativo' | 'cancelado';

/**
 * Interface para histórico de planos do usuário
 */
export interface PlanHistory {
  id: string;
  planType: StoragePlan;
  billingCycle: PlanType;
  paymentMethod: PaymentMethod;
  startDate: string;
  endDate?: string;
  status: AccountStatus;
}

/**
 * Interface principal do modelo de usuário
 * Contém todas as informações necessárias para gerenciar um usuário
 */
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  plan: StoragePlan;
  storageUsed: number;
  createdAt: string;
  temporaryPassword?: string;
  temporaryPasswordExpiry?: string;
  needsPasswordReset?: boolean;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  endereco?: string;
  telefone?: string;
  planType?: PlanType;
  paymentMethod?: PaymentMethod;
  accountStatus?: AccountStatus;
  planHistory?: PlanHistory[];
}