import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';

// Interface para respostas da API
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  statusCode?: number;
}

// Interface para erro da API
interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Interface para usu├írio
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  authProvider?: 'local' | 'google' | 'apple';
  acceptedLegal?: boolean;
  currentSubscription?: Subscription | null;
  createdAt: string;
  updatedAt: string;
}

// Interface para login/register response
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Interface para documentos legais
export interface LegalDocument {
  id: string;
  type: 'PRIVACY_POLICY' | 'TERMS_OF_USE';
  content: string;
  isActive: boolean;
  createdAt: string;
}

export interface ActiveLegal {
  privacy: LegalDocument | null;
  terms: LegalDocument | null;
}

export interface AntiAbuseSnapshot {
  now: number;
  counters: Array<{ key: string; count: number; expiresAt: number; remainingMs: number }>;
  cooldowns: Array<{ key: string; until: number; remainingMs: number }>;
  distinct: Array<{ key: string; size: number }>;
  totals: { counters: number; cooldowns: number; distinctKeys: number };
}

// Interface para plano
export interface Plan {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  priceCents: number;
  billingPeriod: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'yearly';
  features: string[];
  isActive?: boolean;
  courtesyDurationMonths?: number | null;
  createdAt?: string;
  canSelect?: boolean;
}


// Interface para assinatura
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: Plan;
  status: 'active' | 'expiring' | 'canceled' | 'past_due' | 'unpaid';
  periodStart?: string;
  periodEnd?: string;
  provider?: string;
  providerSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  provider: string;
  providerId: string;
  dueDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED';
  invoiceUrl?: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  walletId: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Partnership {
  id: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  discountType: 'PERCENT' | 'FIXED';
  discountValue: string;
  startsAt?: string;
  endsAt?: string;
  maxRedemptions?: number;
  createdAt: string;
  affiliates?: Array<{
    affiliate: Affiliate;
    splitType: 'PERCENT' | 'FIXED';
    splitValue: string;
  }>;
}

export interface ActiveCoupon {
  id: string;
  partnership: Partnership;
  status: 'ACTIVE' | 'PENDING_CHECKOUT' | 'USED' | 'CANCELLED' | 'EXPIRED';
  activatedAt: string;
  expiresAt?: string;
}

// ===== INTERFACES DE CURSOS =====

export interface CourseListItem {
  id: string;
  titulo: string;
  descricao: string;
  thumbnailUrl: string;
  totalModulos: number;
  totalAulas: number;
  aulasCompletas: number;
  progresso: number;
}

export interface LessonSummary {
  id: string;
  titulo: string;
  duracaoSegundos: number;
  ordem: number;
  status: string;
  concluida: boolean;
  tempoAssistido: number;
}

export interface CourseModuleDetail {
  id: string;
  titulo: string;
  ordem: number;
  aulas: LessonSummary[];
}

export interface CourseDetail {
  id: string;
  titulo: string;
  descricao: string;
  thumbnailUrl: string;
  totalAulas: number;
  aulasCompletas: number;
  progresso: number;
  modulos: CourseModuleDetail[];
}

export interface LessonAttachment {
  id: string;
  nome: string;
  fileName: string;
  contentType: string;
  tamanhoBytes: number;
  downloadUrl: string;
}

export interface LessonDetail {
  id: string;
  titulo: string;
  conteudoTexto: string;
  duracaoSegundos: number;
  videoUrl: string | null;
  status: string;
  concluida: boolean;
  tempoAssistido: number;
  cursoId: string;
  cursoTitulo: string;
  moduloId: string;
  moduloTitulo: string;
  anexos: LessonAttachment[];
  aulaAnterior: { id: string; titulo: string; ordem: number } | null;
  proximaAula: { id: string; titulo: string; ordem: number } | null;
}

export interface AdminCourse {
  id: string;
  titulo: string;
  descricao: string;
  thumbnailUrl: string;
  status: 'rascunho' | 'publicado';
  criadorId: string;
  createdAt: string;
  updatedAt: string;
  modulos?: any[];
  planAccess?: Array<{ id: string; planId: string; plan: Plan }>;
}

export interface AdminCourseDetail extends AdminCourse {
  modulos: Array<{
    id: string;
    titulo: string;
    ordem: number;
    aulas: Array<{
      id: string;
      titulo: string;
      conteudoTexto: string;
      videoKey: string;
      duracaoSegundos: number;
      ordem: number;
      status: string;
    }>;
  }>;
}

// Classe principal da API
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => config,
      (error) => Promise.reject(error)
    );

    // Interceptor de resposta para tratamento de erros
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const hasDataWrapper = response && response.data && typeof response.data === 'object' && 'data' in response.data;
        if (!hasDataWrapper) {
          response.data = { data: response.data } as any;
        }
        return response;
      },
      async (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          const path = window.location.pathname || '';
          const url: string = error?.response?.config?.url || '';
          const inAuth = path.startsWith('/auth/login') || path.startsWith('/auth/callback') || path.startsWith('/admin/login');
          const isAccountPassword = url.includes('/auth/profile/password') || path.startsWith('/dashboard/account');
          if (!inAuth && !isAccountPassword) {
            const msg = error?.response?.data?.message || '';
            if (msg.includes('E-mail n├úo verificado')) {
              window.location.href = '/auth/pending';
            } else {
              const search = window.location.search || '';
              const next = path.startsWith('/dashboard') ? `${path}${search}` : '';
              window.location.href = next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login';
            }
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): ApiError {
    if (error.response?.data) {
      return {
        message: error.response.data.message || 'Erro na requisi├º├úo',
        statusCode: error.response.status,
        error: error.response.data.error,
      };
    }

    return {
      message: error.message || 'Erro de conex├úo',
      statusCode: 500,
    };
  }

  // M├®todos de autentica├º├úo

  // M├®todos de API

  // ===== AUTENTICA├ç├âO =====
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });

    if (response.data.data?.accessToken) {
      try {
        await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: response.data.data.accessToken, acceptedLegal: !!(response.data.data?.user as any)?.acceptedLegal }),
        });
      } catch { }
    }

    return response.data.data;
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/oauth/google', { idToken });
    if (response.data.data?.accessToken) {
      try {
        await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: response.data.data.accessToken, acceptedLegal: !!(response.data.data?.user as any)?.acceptedLegal }),
        });
      } catch { }
    }
    return response.data.data;
  }

  async loginWithApple(identityToken: string, appleUserId: string): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/oauth/apple', { identityToken, appleUserId });
    if (response.data.data?.accessToken) {
      try {
        await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: response.data.data.accessToken, acceptedLegal: !!(response.data.data?.user as any)?.acceptedLegal }),
        });
      } catch { }
    }
    return response.data.data;
  }

  async register(name: string, email: string, password: string, acceptedLegal: boolean): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', {
      name,
      email,
      password,
      acceptedLegal,
    });

    if (response.data.data?.accessToken) {
      try {
        await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: response.data.data.accessToken, acceptedLegal: !!(response.data.data?.user as any)?.acceptedLegal }),
        });
      } catch { }
    }

    return response.data.data;
  }

  async getActiveLegal(): Promise<ActiveLegal> {
    const response = await this.client.get<ApiResponse<ActiveLegal>>('/legal/active');
    return response.data.data;
  }

  async adminListLegalDocuments(type?: 'PRIVACY_POLICY' | 'TERMS_OF_USE'): Promise<LegalDocument[]> {
    const response = await this.client.get<ApiResponse<LegalDocument[]>>('/admin/legal/documents', { params: { type } });
    return response.data.data;
  }

  async adminCreateLegalDocument(data: { type: 'PRIVACY_POLICY' | 'TERMS_OF_USE'; content: string; isActive?: boolean }): Promise<LegalDocument> {
    const response = await this.client.post<ApiResponse<LegalDocument>>('/admin/legal/documents', data);
    return response.data.data;
  }

  async adminActivateLegalDocument(id: string): Promise<LegalDocument> {
    const response = await this.client.patch<ApiResponse<LegalDocument>>(`/admin/legal/documents/${id}/activate`);
    return response.data.data;
  }

  async adminGetAntiAbuseSnapshot(): Promise<AntiAbuseSnapshot> {
    const response = await this.client.get<ApiResponse<AntiAbuseSnapshot>>('/admin/anti-abuse/snapshot');
    return response.data.data;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await this.client.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken,
    });

    if (response.data.data?.accessToken) {
      try {
        await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: response.data.data.accessToken }),
        });
      } catch { }
    }

    return response.data.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/auth/profile');
    return response.data.data;
  }

  async acceptLegal(): Promise<{ ok: boolean }> {
    const response = await this.client.post<ApiResponse<{ ok: boolean }>>('/legal/accept', {});
    try {
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptedLegal: true }),
      });
    } catch { }
    return response.data.data;
  }

  async updateMyProfile(data: { name?: string }): Promise<User> {
    const response = await this.client.patch<ApiResponse<User>>('/auth/profile', data);
    return response.data.data;
  }

  async changeMyPassword(params: { currentPassword: string; newPassword: string }): Promise<User> {
    const response = await this.client.patch<ApiResponse<User>>('/auth/profile/password', params);
    return response.data.data;
  }

  async deleteMyAccount(): Promise<void> {
    await this.client.delete('/auth/profile');
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout', {});
    try {
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: '' }),
      });
    } catch { }
  }

  async clearToken(): Promise<void> {
    try {
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: '' }),
      });
    } catch { }
  }

  async requestPasswordReset(email: string): Promise<{ ok: boolean }> {
    const response = await this.client.post<ApiResponse<{ ok: boolean }>>('/auth/password/forgot', { email });
    return response.data.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ ok: boolean }> {
    const response = await this.client.post<ApiResponse<{ ok: boolean }>>('/auth/password/reset', { token, newPassword });
    return response.data.data;
  }

  async requestEmailVerification(email: string): Promise<{ ok: boolean }> {
    const response = await this.client.post<ApiResponse<{ ok: boolean }>>('/auth/email/verify/request', { email });
    return response.data.data;
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/email/verify', { token });
    if (response.data.data?.accessToken) {
      try {
        await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: response.data.data.accessToken, acceptedLegal: !!(response.data.data?.user as any)?.acceptedLegal }),
        });
      } catch { }
    }
    return response.data.data;
  }

  // ===== ASSINATURAS =====
  async getPlans(): Promise<Plan[]> {
    const response = await this.client.get<ApiResponse<{ plans: Plan[] }>>('/subscriptions/plans');
    return response.data.data.plans;
  }

  async getCurrentSubscription(): Promise<Subscription | null> {
    const response = await this.client.get<ApiResponse<{ subscription: Subscription | null }>>('/subscriptions/current');
    return response.data.data.subscription;
  }

  async changePlan(planId: string): Promise<Subscription> {
    const response = await this.client.post<ApiResponse<Subscription>>('/subscriptions/change-plan', {
      planId,
    });
    return response.data.data;
  }

  async cancelSubscription(): Promise<Subscription> {
    const response = await this.client.post<ApiResponse<{ subscription: Subscription }>>('/subscriptions/cancel');
    return response.data.data.subscription;
  }

  async createCheckoutSession(planId: string, cpf?: string): Promise<{ checkoutUrl: string }> {
    const response = await this.client.post<ApiResponse<{ checkoutUrl: string }>>('/subscriptions/checkout', {
      planId,
      cpf,
    });
    return response.data.data;
  }

  async getInvoices(): Promise<Invoice[]> {
    const response = await this.client.get('/invoices');
    // Backend retorna array diretamente, interceptor encapsula em { data: [...] }
    const invoices = response.data?.data || response.data;
    return Array.isArray(invoices) ? invoices : [];
  }

  async adminGetUsers(params?: any): Promise<{ data: User[]; meta: any }> {
    const response = await this.client.get<{ data: User[]; meta: any }>('/users', {
      params,
    });
    return response.data;
  }

  async adminToggleUserStatus(id: string): Promise<User> {
    const response = await this.client.patch<ApiResponse<User>>(`/users/${id}/toggle-status`);
    return response.data.data;
  }

  async adminUpdateUser(id: string, data: Partial<Pick<User, 'name' | 'email' | 'role' | 'isActive'>>): Promise<User> {
    const response = await this.client.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  }

  async adminDeleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  async adminGetCourtesyAutoGrant(): Promise<{ enabled: boolean }> {
    const response = await this.client.get<ApiResponse<{ enabled: boolean }>>('/subscriptions/admin/courtesy-auto-grant');
    return response.data.data;
  }

  async adminUpdateCourtesyAutoGrant(enabled: boolean): Promise<{ enabled: boolean }> {
    const response = await this.client.patch<ApiResponse<{ enabled: boolean }>>('/subscriptions/admin/courtesy-auto-grant', {
      enabled,
    });
    return response.data.data;
  }

  async adminGrantCourtesy(userId: string): Promise<Subscription> {
    const response = await this.client.post<ApiResponse<{ subscription: Subscription }>>('/subscriptions/admin/courtesy/grant', {
      userId,
    });
    return response.data.data.subscription;
  }

  async adminRevokeCourtesy(userId: string): Promise<Subscription> {
    const response = await this.client.post<ApiResponse<{ subscription: Subscription }>>('/subscriptions/admin/courtesy/revoke', {
      userId,
    });
    return response.data.data.subscription;
  }

  async adminGetPlans(): Promise<Plan[]> {
    const response = await this.client.get<ApiResponse<Plan[]>>('/admin/plans');
    return response.data.data;
  }

  async adminCreatePlan(data: {
    name: string;
    slug?: string;
    description?: string;
    priceCents: number;
    billingPeriod: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'yearly';
    features?: string[];
    isActive?: boolean;
    isCourtesy?: boolean;
    courtesyDurationMonths?: number | null;
  }): Promise<Plan> {
    const response = await this.client.post<ApiResponse<Plan>>('/admin/plans', data);
    return response.data.data;
  }

  async adminUpdatePlan(id: string, data: Partial<{
    name: string;
    slug: string;
    description?: string;
    priceCents: number;
    billingPeriod: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'yearly';
    features?: string[];
    isActive?: boolean;
    isCourtesy?: boolean;
    courtesyDurationMonths?: number | null;
  }>): Promise<Plan> {
    const response = await this.client.patch<ApiResponse<Plan>>(`/admin/plans/${id}`, data);
    return response.data.data;
  }

  async adminDeletePlan(id: string): Promise<void> {
    await this.client.delete(`/admin/plans/${id}`);
  }

  // Exportar inst├óncia ├║nica da API
  // ===== CUPONS E PARCERIAS =====
  async activateCoupon(code: string): Promise<ActiveCoupon> {
    const response = await this.client.post<ApiResponse<ActiveCoupon>>('/subscriptions/coupons/activate', { code });
    return response.data.data;
  }

  async getActiveCoupon(): Promise<ActiveCoupon | null> {
    try {
      const response = await this.client.get<ApiResponse<ActiveCoupon>>('/subscriptions/coupons/active');
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async cancelActiveCoupon(): Promise<void> {
    await this.client.post('/subscriptions/coupons/cancel');
  }

  async checkoutFailed(): Promise<void> {
    await this.client.post('/subscriptions/coupons/checkout-failed');
  }

  // ===== ADMIN PARCERIAS =====
  async adminGetAffiliates(): Promise<Affiliate[]> {
    const response = await this.client.get<ApiResponse<Affiliate[]>>('/admin/affiliates');
    return response.data.data;
  }

  async adminCreateAffiliate(data: { name: string; email: string; walletId: string }): Promise<Affiliate> {
    const response = await this.client.post<ApiResponse<Affiliate>>('/admin/affiliates', data);
    return response.data.data;
  }

  async adminUpdateAffiliate(id: string, data: Partial<Affiliate>): Promise<Affiliate> {
    const response = await this.client.patch<ApiResponse<Affiliate>>(`/admin/affiliates/${id}`, data);
    return response.data.data;
  }

  async adminGetPartnerships(): Promise<Partnership[]> {
    const response = await this.client.get<ApiResponse<Partnership[]>>('/admin/partnerships');
    return response.data.data;
  }

  async adminGetPartnership(id: string): Promise<{ partnership: Partnership; affiliates: any[] }> {
    const response = await this.client.get<ApiResponse<{ partnership: Partnership; affiliates: any[] }>>(`/admin/partnerships/${id}`);
    return response.data.data;
  }

  async adminCreatePartnership(data: any): Promise<Partnership> {
    const response = await this.client.post<ApiResponse<Partnership>>('/admin/partnerships', data);
    return response.data.data;
  }

  async adminUpdatePartnership(id: string, data: any): Promise<Partnership> {
    const response = await this.client.patch<ApiResponse<Partnership>>(`/admin/partnerships/${id}`, data);
    return response.data.data;
  }

  async adminAddAffiliateToPartnership(partnershipId: string, data: { affiliateId: string; splitType: 'PERCENT' | 'FIXED'; splitValue: number }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/admin/partnerships/${partnershipId}/affiliates`, data);
    return response.data.data;
  }

  async adminRemoveAffiliateFromPartnership(partnershipId: string, affiliateId: string): Promise<void> {
    await this.client.delete(`/admin/partnerships/${partnershipId}/affiliates/${affiliateId}`);
  }


  // ===== ADMIN SETTINGS (WHITE LABEL) =====
  async adminListSettings(): Promise<Array<{ id: string; key: string; value: string | null }>> {
    const response = await this.client.get<ApiResponse<Array<{ id: string; key: string; value: string | null }>>>('/admin/settings');
    return response.data.data;
  }

  async adminUpsertSetting(key: string, value: string | null): Promise<{ key: string; value: string | null }> {
    const response = await this.client.put<ApiResponse<{ key: string; value: string | null }>>(`/admin/settings/${key}`, { value });
    return response.data.data;
  }

  // ===== CURSOS ÔÇö ADMIN =====

  async adminGetCourses(): Promise<AdminCourse[]> {
    const response = await this.client.get<ApiResponse<AdminCourse[]>>('/admin/courses');
    return response.data.data;
  }

  async adminGetCourse(id: string): Promise<AdminCourseDetail> {
    const response = await this.client.get<ApiResponse<AdminCourseDetail>>(`/admin/courses/${id}`);
    return response.data.data;
  }

  async adminCreateCourse(data: { titulo: string; descricao?: string; thumbnailUrl?: string; status?: 'rascunho' | 'publicado' }): Promise<AdminCourse> {
    const response = await this.client.post<ApiResponse<AdminCourse>>('/admin/courses', data);
    return response.data.data;
  }

  async adminUpdateCourse(id: string, data: Partial<{ titulo: string; descricao: string; thumbnailUrl: string; status: 'rascunho' | 'publicado' }>): Promise<AdminCourse> {
    const response = await this.client.patch<ApiResponse<AdminCourse>>(`/admin/courses/${id}`, data);
    return response.data.data;
  }

  async adminDeleteCourse(id: string): Promise<void> {
    await this.client.delete(`/admin/courses/${id}`);
  }

  async adminCreateModule(courseId: string, data: { titulo: string; ordem?: number }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/admin/courses/${courseId}/modules`, data);
    return response.data.data;
  }

  async adminUpdateModule(courseId: string, moduleId: string, data: Partial<{ titulo: string; ordem: number }>): Promise<any> {
    const response = await this.client.patch<ApiResponse<any>>(`/admin/courses/${courseId}/modules/${moduleId}`, data);
    return response.data.data;
  }

  async adminDeleteModule(courseId: string, moduleId: string): Promise<void> {
    await this.client.delete(`/admin/courses/${courseId}/modules/${moduleId}`);
  }

  async adminReorderModules(courseId: string, orderedIds: string[]): Promise<void> {
    await this.client.patch(`/admin/courses/${courseId}/modules/reorder`, { orderedIds });
  }

  async adminCreateLesson(courseId: string, moduleId: string, data: { titulo: string; conteudoTexto?: string; videoKey?: string; duracaoSegundos?: number }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/admin/courses/${courseId}/modules/${moduleId}/lessons`, data);
    return response.data.data;
  }

  async adminUpdateLesson(courseId: string, moduleId: string, lessonId: string, data: Partial<{ titulo: string; conteudoTexto: string; videoKey: string; duracaoSegundos: number; status: string }>): Promise<any> {
    const response = await this.client.patch<ApiResponse<any>>(`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data);
    return response.data.data;
  }

  async adminDeleteLesson(courseId: string, moduleId: string, lessonId: string): Promise<void> {
    await this.client.delete(`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  }

  async adminReorderLessons(courseId: string, moduleId: string, orderedIds: string[]): Promise<void> {
    await this.client.patch(`/admin/courses/${courseId}/modules/${moduleId}/lessons/reorder`, { orderedIds });
  }

  async adminGetUploadUrl(courseId: string, fileName: string): Promise<{ uploadUrl: string; key: string }> {
    const response = await this.client.post<ApiResponse<{ uploadUrl: string; key: string }>>(`/admin/courses/${courseId}/upload-url`, { fileName });
    return response.data.data;
  }

  async adminGetAttachmentUploadUrl(
    courseId: string,
    moduleId: string,
    lessonId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const response = await this.client.post<ApiResponse<{ uploadUrl: string; key: string }>>(
      `/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/attachments/upload-url`,
      { fileName, contentType },
    );
    return response.data.data;
  }

  async adminCreateAttachment(
    courseId: string,
    moduleId: string,
    lessonId: string,
    data: { nome: string; fileKey: string; fileName: string; contentType: string; tamanhoBytes: number },
  ): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(
      `/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/attachments`,
      data,
    );
    return response.data.data;
  }

  async adminListAttachments(
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<LessonAttachment[]> {
    const response = await this.client.get<ApiResponse<LessonAttachment[]>>(
      `/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/attachments`,
    );
    return response.data.data;
  }

  async adminDeleteAttachment(
    courseId: string,
    moduleId: string,
    lessonId: string,
    attachmentId: string,
  ): Promise<void> {
    await this.client.delete(
      `/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/attachments/${attachmentId}`,
    );
  }

  async adminGetCoursePlanAccess(courseId: string): Promise<Array<{ id: string; planId: string; plan: Plan }>> {
    const response = await this.client.get<ApiResponse<Array<{ id: string; planId: string; plan: Plan }>>>(`/admin/courses/${courseId}/plan-access`);
    return response.data.data;
  }

  async adminUpdateCoursePlanAccess(courseId: string, planIds: string[]): Promise<any> {
    const response = await this.client.patch<ApiResponse<any>>(`/admin/courses/${courseId}/plan-access`, { planIds });
    return response.data.data;
  }

  // ===== CURSOS ÔÇö USU├üRIO =====

  async getCourses(): Promise<CourseListItem[]> {
    const response = await this.client.get<ApiResponse<CourseListItem[]>>('/courses');
    return response.data.data;
  }

  async getCourseDetail(id: string): Promise<CourseDetail> {
    const response = await this.client.get<ApiResponse<CourseDetail>>(`/courses/${id}`);
    return response.data.data;
  }

  async getLessonDetail(lessonId: string): Promise<LessonDetail> {
    const response = await this.client.get<ApiResponse<LessonDetail>>(`/courses/lessons/${lessonId}`);
    return response.data.data;
  }

  async updateLessonProgress(lessonId: string, data: { concluida?: boolean; tempoAssistido?: number }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/courses/lessons/${lessonId}/progress`, data);
    return response.data.data;
  }
}

export const api = new ApiService();
