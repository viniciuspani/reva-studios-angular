import { Injectable, signal } from '@angular/core';

/**
 * Tipo de idiomas suportados
 */
export type Language = 'pt-BR' | 'en-US';

/**
 * Serviço de internacionalização
 * Gerencia o idioma atual e fornece traduções
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  
  // Signal reativo para o idioma atual
  language = signal<Language>('pt-BR');

  constructor() {
    // Carrega idioma salvo do localStorage
    const saved = localStorage.getItem('language') as Language;
    if (saved === 'en-US' || saved === 'pt-BR') {
      this.language.set(saved);
    }
  }

  /**
   * Altera o idioma e salva no localStorage
   */
  setLanguage(lang: Language): void {
    this.language.set(lang);
    localStorage.setItem('language', lang);
  }

  /**
   * Obtém tradução baseada na chave
   */
  t(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations[this.language()];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }

  /**
   * Dicionário de traduções
   */
  private translations = {
    'pt-BR': {
      nav: {
        home: 'Home',
        about: 'Sobre',
        plans: 'Planos',
        contact: 'Contato',
        login: 'Entrar',
        dashboard: 'Dashboard',
        logout: 'Sair'
      },
      home: {
        mainHero: {
          title: 'Organize, compartilhe e encante',
          subtitle: 'Tudo em um só lugar.',
          description: 'Uma plataforma inteligente que simplifica o dia a dia dos fotógrafos: armazenamento seguro, entrega de fotos e gestão completa de clientes.',
          tryFree: 'Testar Gratuitamente',
          learnMore: 'Saiba Como Funciona'
        },
        hero: {
          title: 'O tempo passa, as memórias ficam.',
          description: 'Em um mundo que se move em alta velocidade, precisamos desacelerar e buscar refúgio no que nos conecta. As fotos entrelaçam memórias e emoções, guiando-nos até nossos corações.'
        },
        professional: {
          title: 'Para Fotógrafos Profissionais',
          description: 'Gerencie projetos, clientes e entregas em um só lugar. Organize sessões, compartilhe galerias privadas e receba feedbacks em tempo real.',
          security: 'Segurança Premium',
          securityDesc: 'Dados protegidos e criptografados',
          delivery: 'Entrega Ágil',
          deliveryDesc: 'Galeria pronta em minutos'
        },
        studioControl: {
          title: 'Controle total do seu estúdio',
          subtitle: 'A tecnologia que profissionais confiam.',
          description: 'Automatize seu fluxo de trabalho, acompanhe projetos e mantenha sua reputação impecável. Menos tempo administrando, mais tempo criando.',
          clientPortal: 'Portal do Cliente',
          clientPortalDesc: 'Experiência personalizada',
          storage: 'Armazenamento Ilimitado',
          storageDesc: 'Plano Studio sem limites'
        },
        hobby: {
          title: 'Sua paixão, nosso suporte',
          subtitle: 'Fotografia com liberdade e leveza.',
          description: 'Capture momentos especiais sem se preocupar com armazenamento. Organize suas aventuras, viagens e memórias em um só lugar, de forma simples e acessível.',
          easyUse: 'Fácil de Usar',
          easyUseDesc: 'Interface intuitiva e amigável',
          secureShare: 'Compartilhe com Segurança',
          secureShareDesc: 'Suas fotos, seu controle'
        },
        finalCta: {
          title: 'Pronto para transformar seu fluxo de trabalho?',
          description: 'Comece hoje mesmo e veja a diferença que o Reva Studio pode fazer.',
          button: 'Conheça Nossos Planos'
        },
        footer: {
          text: '© 2025 Reva Studios – Onde o clique encontra o propósito.'
        }
      },
      auth: {
        title: 'Bem-vindo de volta',
        subtitle: 'Entre na sua conta para continuar',
        forgotPassword: 'Esqueceu sua senha? Recupere aqui',
        noAccount: 'Ainda não tem uma conta?',
        signupFree: 'Cadastre-se gratuitamente!',
        createNewAccount: 'Criar nova conta',
        demoAccounts: 'Contas Demo:',
        demoAdmin: 'Admin: admin@revastudio.com / admin123',
        form: {
          name: 'Nome',
          email: 'E-mail',
          password: 'Senha',
          loginButton: 'Entrar',
          registerButton: 'Criar Conta'
        },
        recovery: {
          title: 'Recuperar Senha',
          description: 'Informe seu email para receber uma senha temporária válida por 10 minutos.',
          sendButton: 'Enviar Senha Temporária'
        },
        signup: {
          title: 'Criar Nova Conta',
          personalData: 'Dados Pessoais',
          namePlaceholder: 'Nome completo',
          emailPlaceholder: 'email@exemplo.com',
          cpf: 'CPF',
          cpfPlaceholder: '000.000.000-00',
          cnpj: 'CNPJ',
          cnpjPlaceholder: '00.000.000/0000-00',
          cpfCnpjNote: '* Preencha CPF ou CNPJ (obrigatório)',
          rg: 'RG',
          rgPlaceholder: '00.000.000-0',
          address: 'Endereço',
          addressPlaceholder: 'Rua, número, bairro, cidade - UF',
          phone: 'Telefone',
          phonePlaceholder: '(00) 00000-0000',
          planData: 'Dados do Plano',
          passwordPlaceholder: 'Mínimo 6 caracteres',
          plan: 'Plano de Armazenamento',
          planPlaceholder: 'Selecione um plano',
          planType: 'Tipo do Plano',
          planTypePlaceholder: 'Selecione o ciclo',
          paymentMethod: 'Método de Pagamento',
          paymentPlaceholder: 'Selecione o pagamento',
          createButton: 'Criar conta',
          cancelButton: 'Cancelar',
          planOptions: {
            essencial: 'Essencial (100 GB)',
            pro: 'Pro (300 GB)',
            studio: 'Studio (Ilimitado)'
          },
          planTypeOptions: {
            monthly: 'Mensal',
            semester: 'Semestral',
            annual: 'Anual'
          },
          paymentOptions: {
            boleto: 'Boleto',
            card: 'Cartão',
            pix: 'PIX'
          }
        }
      },
      dashboard: {
        admin: {
          title: 'Painel Administrativo'
        },
        user: {
          title: 'Meu Dashboard'
        }
      },
      about: {
        title: 'Sobre Nós',
        subtitle: 'Conheça nossa história e propósito',
        description: 'O Reva Studios nasceu da paixão por fotografia e tecnologia. Nossa missão é simplificar a vida dos fotógrafos, oferecendo uma plataforma completa para armazenamento, organização e compartilhamento de fotos.',
        vision: {
          title: 'Nossa Visão',
          description: 'Ser a plataforma preferida dos fotógrafos para gerenciamento de suas obras e clientes.'
        },
        mission: {
          title: 'Nossa Missão',
          description: 'Simplificar o dia a dia dos fotógrafos com tecnologia intuitiva e confiável.'
        },
        innovation: {
          title: 'Inovação',
          description: 'Sempre buscando as melhores soluções tecnológicas para nossos usuários.'
        },
        quality: {
          title: 'Qualidade',
          description: 'Compromisso com excelência em cada detalhe da plataforma.'
        },
        cta: {
          title: 'Feito por fotógrafos, para fotógrafos',
          subtitle: 'Pronto para começar?',
          description: 'Participe da comunidade que está moldando o futuro da fotografia digital.'
        }
      },
      contact: {
        title: 'Entre em Contato',
        subtitle: 'Estamos aqui para ajudar você',
        form: {
          title: 'Envie sua Mensagem',
          description: 'Preencha o formulário abaixo e entraremos em contato em breve',
          name: 'Nome',
          namePlaceholder: 'Seu nome completo',
          email: 'E-mail',
          emailPlaceholder: 'seu@email.com',
          subject: 'Assunto',
          subjectPlaceholder: 'Sobre o que você quer falar?',
          message: 'Mensagem',
          messagePlaceholder: 'Escreva sua mensagem aqui...',
          button: 'Enviar Mensagem',
          successTitle: 'Mensagem Enviada!',
          successDescription: 'Recebemos sua mensagem e responderemos em breve.'
        },
        info: {
          emailTitle: 'E-mail',
          phoneTitle: 'Telefone',
          locationTitle: 'Localização',
          hoursTitle: 'Horário de Atendimento',
          hoursDescription: 'Segunda a Sexta: 9h às 18h'
        }
      },
      plans: {
        title: 'Escolha Seu Plano',
        subtitle: 'Planos flexíveis para todas as necessidades',
        popular: 'Mais Popular',
        button: 'Começar Agora',
        essencial: {
          name: 'Essencial',
          storage: '100 GB',
          price: 'R$ 29,90',
          period: '/mês',
          features: [
            '100 GB de armazenamento',
            'Upload ilimitado de fotos',
            'Galeria privada',
            'Compartilhamento seguro',
            'Suporte por email'
          ]
        },
        pro: {
          name: 'Pro',
          storage: '300 GB',
          price: 'R$ 79,90',
          period: '/mês',
          features: [
            '300 GB de armazenamento',
            'Upload ilimitado de fotos',
            'Galeria privada personalizada',
            'Compartilhamento seguro',
            'Portal do cliente',
            'Suporte prioritário',
            'Marca d\'água personalizada'
          ]
        },
        studio: {
          name: 'Studio',
          storage: 'Ilimitado',
          price: 'R$ 149,90',
          period: '/mês',
          features: [
            'Armazenamento ilimitado',
            'Upload ilimitado de fotos',
            'Galeria privada personalizada',
            'Compartilhamento seguro',
            'Portal do cliente premium',
            'Suporte 24/7',
            'Marca d\'água personalizada',
            'Domínio personalizado',
            'Gestão de equipe'
          ]
        }
      },
      resetPassword: 'Redefinir Senha',
      resetPasswordDescription: 'Digite seu e-mail para receber o código de verificação',
      email: 'E-mail',
      enterEmail: 'Digite seu e-mail',
      invalidEmail: 'E-mail inválido',
      sendCode: 'Enviar Código',
      backToLogin: 'Voltar ao Login',
      enterCodeSent: 'Digite o código enviado para',
      verificationCode: 'Código de Verificação',
      enterCode: 'Digite o código',
      codeRequired: 'Código obrigatório',
      verifyCode: 'Verificar Código',
      back: 'Voltar',
      enterNewPassword: 'Digite sua nova senha',
      newPassword: 'Nova Senha',
      enterPassword: 'Digite a senha',
      passwordMinLength: 'A senha deve ter pelo menos 6 caracteres',
      confirmPassword: 'Confirmar Senha',
      passwordsDoNotMatch: 'As senhas não coincidem',
      success: 'Sucesso',
      error: 'Erro',
      codeSent: 'Código enviado para seu e-mail',
      emailNotFound: 'E-mail não encontrado',
      codeVerified: 'Código verificado com sucesso',
      invalidCode: 'Código inválido',
      passwordReset: 'Senha redefinida com sucesso'
    },
    'en-US': {
      nav: {
        home: 'Home',
        about: 'About',
        plans: 'Plans',
        contact: 'Contact',
        login: 'Login',
        dashboard: 'Dashboard',
        logout: 'Logout'
      },
      home: {
        mainHero: {
          title: 'Organize, share and delight',
          subtitle: 'Everything in one place.',
          description: 'An intelligent platform that simplifies photographers\' daily work: secure storage, photo delivery and complete client management.',
          tryFree: 'Try it Free',
          learnMore: 'Learn How it Works'
        },
        hero: {
          title: 'Time passes, memories remain.',
          description: 'In a world that moves at high speed, we need to slow down and seek refuge in what connects us. Photos intertwine memories and emotions, guiding us to our hearts.'
        },
        professional: {
          title: 'For Professional Photographers',
          description: 'Manage projects, clients and deliveries in one place. Organize sessions, share private galleries and receive real-time feedback.',
          security: 'Premium Security',
          securityDesc: 'Protected and encrypted data',
          delivery: 'Fast Delivery',
          deliveryDesc: 'Gallery ready in minutes'
        },
        studioControl: {
          title: 'Complete control of your studio',
          subtitle: 'The technology that professionals trust.',
          description: 'Automate your workflow, track projects and maintain your impeccable reputation. Less time managing, more time creating.',
          clientPortal: 'Client Portal',
          clientPortalDesc: 'Personalized experience',
          storage: 'Unlimited Storage',
          storageDesc: 'Studio plan without limits'
        },
        hobby: {
          title: 'Your passion, our support',
          subtitle: 'Photography with freedom and lightness.',
          description: 'Capture special moments without worrying about storage. Organize your adventures, travels and memories in one place, simply and affordably.',
          easyUse: 'Easy to Use',
          easyUseDesc: 'Intuitive and friendly interface',
          secureShare: 'Share Securely',
          secureShareDesc: 'Your photos, your control'
        },
        finalCta: {
          title: 'Ready to transform your workflow?',
          description: 'Start today and see the difference Reva Studio can make.',
          button: 'Explore Our Plans'
        },
        footer: {
          text: '© 2025 Reva Studios – Where the click meets purpose.'
        }
      },
      auth: {
        title: 'Welcome back',
        subtitle: 'Log in to your account to continue',
        forgotPassword: 'Forgot your password? Recover here',
        noAccount: 'Don\'t have an account yet?',
        signupFree: 'Sign up for free!',
        createNewAccount: 'Create new account',
        demoAccounts: 'Demo Accounts:',
        demoAdmin: 'Admin: admin@revastudio.com / admin123',
        form: {
          name: 'Name',
          email: 'Email',
          password: 'Password',
          loginButton: 'Login',
          registerButton: 'Create Account'
        },
        recovery: {
          title: 'Recover Password',
          description: 'Enter your email to receive a temporary password valid for 10 minutes.',
          sendButton: 'Send Temporary Password'
        },
        signup: {
          title: 'Create New Account',
          personalData: 'Personal Information',
          namePlaceholder: 'Full name',
          emailPlaceholder: 'email@example.com',
          cpf: 'CPF',
          cpfPlaceholder: '000.000.000-00',
          cnpj: 'CNPJ',
          cnpjPlaceholder: '00.000.000/0000-00',
          cpfCnpjNote: '* Fill in CPF or CNPJ (required)',
          rg: 'ID',
          rgPlaceholder: '00.000.000-0',
          address: 'Address',
          addressPlaceholder: 'Street, number, district, city - State',
          phone: 'Phone',
          phonePlaceholder: '(00) 00000-0000',
          planData: 'Plan Information',
          passwordPlaceholder: 'Minimum 6 characters',
          plan: 'Storage Plan',
          planPlaceholder: 'Select a plan',
          planType: 'Plan Type',
          planTypePlaceholder: 'Select the cycle',
          paymentMethod: 'Payment Method',
          paymentPlaceholder: 'Select payment',
          createButton: 'Create account',
          cancelButton: 'Cancel',
          planOptions: {
            essencial: 'Essential (100 GB)',
            pro: 'Pro (300 GB)',
            studio: 'Studio (Unlimited)'
          },
          planTypeOptions: {
            monthly: 'Monthly',
            semester: 'Semester',
            annual: 'Annual'
          },
          paymentOptions: {
            boleto: 'Bank Slip',
            card: 'Card',
            pix: 'PIX'
          }
        }
      },
      dashboard: {
        admin: {
          title: 'Administrative Panel'
        },
        user: {
          title: 'My Dashboard'
        }
      },
      about: {
        title: 'About Us',
        subtitle: 'Know our history and purpose',
        description: 'Reva Studios was born from a passion for photography and technology. Our mission is to simplify photographers\' lives by offering a complete platform for photo storage, organization and sharing.',
        vision: {
          title: 'Our Vision',
          description: 'To be the preferred platform for photographers to manage their work and clients.'
        },
        mission: {
          title: 'Our Mission',
          description: 'Simplify photographers\' daily lives with intuitive and reliable technology.'
        },
        innovation: {
          title: 'Innovation',
          description: 'Always seeking the best technological solutions for our users.'
        },
        quality: {
          title: 'Quality',
          description: 'Commitment to excellence in every detail of the platform.'
        },
        cta: {
          title: 'Made by photographers, for photographers',
          subtitle: 'Ready to get started?',
          description: 'Join the community that is shaping the future of digital photography.'
        }
      },
      contact: {
        title: 'Get in Touch',
        subtitle: 'We are here to help you',
        form: {
          title: 'Send Your Message',
          description: 'Fill out the form below and we will get back to you soon',
          name: 'Name',
          namePlaceholder: 'Your full name',
          email: 'Email',
          emailPlaceholder: 'your@email.com',
          subject: 'Subject',
          subjectPlaceholder: 'What do you want to talk about?',
          message: 'Message',
          messagePlaceholder: 'Write your message here...',
          button: 'Send Message',
          successTitle: 'Message Sent!',
          successDescription: 'We received your message and will respond soon.'
        },
        info: {
          emailTitle: 'Email',
          phoneTitle: 'Phone',
          locationTitle: 'Location',
          hoursTitle: 'Business Hours',
          hoursDescription: 'Monday to Friday: 9am to 6pm'
        }
      },
      plans: {
        title: 'Choose Your Plan',
        subtitle: 'Flexible plans for all needs',
        popular: 'Most Popular',
        button: 'Get Started',
        essencial: {
          name: 'Essential',
          storage: '100 GB',
          price: '$9.90',
          period: '/month',
          features: [
            '100 GB of storage',
            'Unlimited photo uploads',
            'Private gallery',
            'Secure sharing',
            'Email support'
          ]
        },
        pro: {
          name: 'Pro',
          storage: '300 GB',
          price: '$24.90',
          period: '/month',
          features: [
            '300 GB of storage',
            'Unlimited photo uploads',
            'Custom private gallery',
            'Secure sharing',
            'Client portal',
            'Priority support',
            'Custom watermark'
          ]
        },
        studio: {
          name: 'Studio',
          storage: 'Unlimited',
          price: '$49.90',
          period: '/month',
          features: [
            'Unlimited storage',
            'Unlimited photo uploads',
            'Custom private gallery',
            'Secure sharing',
            'Premium client portal',
            '24/7 support',
            'Custom watermark',
            'Custom domain',
            'Team management'
          ]
        }
      },
      resetPassword: 'Reset Password',
      resetPasswordDescription: 'Enter your email to receive the verification code',
      email: 'Email',
      enterEmail: 'Enter your email',
      invalidEmail: 'Invalid email',
      sendCode: 'Send Code',
      backToLogin: 'Back to Login',
      enterCodeSent: 'Enter the code sent to',
      verificationCode: 'Verification Code',
      enterCode: 'Enter the code',
      codeRequired: 'Code required',
      verifyCode: 'Verify Code',
      back: 'Back',
      enterNewPassword: 'Enter your new password',
      newPassword: 'New Password',
      enterPassword: 'Enter password',
      passwordMinLength: 'Password must be at least 6 characters',
      confirmPassword: 'Confirm Password',
      passwordsDoNotMatch: 'Passwords do not match',
      success: 'Success',
      error: 'Error',
      codeSent: 'Code sent to your email',
      emailNotFound: 'Email not found',
      codeVerified: 'Code verified successfully',
      invalidCode: 'Invalid code',
      passwordReset: 'Password reset successfully'
    }
  };
}