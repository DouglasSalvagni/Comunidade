import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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

// Interface para usuário
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para login/register response
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Interface para perfil infantil
export interface Profile {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  birthDate?: string;
  parentalPin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para plano
export interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  createdAt: string;
}

// Interface para obra
export interface Work {
  id: string;
  title: string;
  description?: string;
  type: 'music' | 'audiobook' | 'series';
  recommendedMinMonths?: number;
  recommendedMaxMonths?: number;
  recommendedAgeLabel?: string;
  coverUrl?: string;
  duration?: number;
  isActive: boolean;
  isFavorite?: boolean;
  tags?: Tag[];
  tracks?: Track[];
  createdAt: string;
  updatedAt: string;
}

// Interface para faixa/álbum
export interface Track {
  id: string;
  workId: string;
  title: string;
  audioUrl?: string;
  storageKey?: string;
  duration?: number;
  orderIndex: number;
  createdAt: string;
}

// Interface para tag
export interface Tag {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

// Interface para favorito
export interface Favorite {
  id: string;
  userId: string;
  workId: string;
  work: Work;
  createdAt: string;
}

// Interface para assinatura
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: Plan;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodEnd?: string;
  provider?: string;
  providerSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
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
          const inAuth = path.startsWith('/auth/login') || path.startsWith('/auth/callback') || path.startsWith('/admin/login');
          if (!inAuth) {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): ApiError {
    if (error.response?.data) {
      return {
        message: error.response.data.message || 'Erro na requisição',
        statusCode: error.response.status,
        error: error.response.data.error,
      };
    }
    
    return {
      message: error.message || 'Erro de conexão',
      statusCode: 500,
    };
  }

  // Métodos de autenticação

  // Métodos de API

  // ===== AUTENTICAÇÃO =====
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
          body: JSON.stringify({ accessToken: response.data.data.accessToken }),
        });
      } catch {}
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
          body: JSON.stringify({ accessToken: response.data.data.accessToken }),
        });
      } catch {}
    }
    return response.data.data;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', {
      name,
      email,
      password,
    });
    
    if (response.data.data?.accessToken) {
      try {
        await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: response.data.data.accessToken }),
        });
      } catch {}
    }
    
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
      } catch {}
    }
    
    return response.data.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/auth/profile');
    return response.data.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout', {});
    try {
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: '' }),
      });
    } catch {}
  }

  async clearToken(): Promise<void> {
    try {
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: '' }),
      });
    } catch {}
  }

  // ===== PERFIS =====
  async getProfiles(): Promise<Profile[]> {
    const response = await this.client.get<ApiResponse<Profile[]>>('/profiles');
    return response.data.data;
  }

  async createProfile(data: {
    name: string;
    birthDate?: string;
    avatarUrl?: string;
    parentalPin?: string;
  }): Promise<Profile> {
    const response = await this.client.post<ApiResponse<Profile>>('/profiles', data);
    return response.data.data;
  }

  async updateProfile(id: string, data: Partial<Profile>): Promise<Profile> {
    const response = await this.client.patch<ApiResponse<Profile>>(`/profiles/${id}`, data);
    return response.data.data;
  }

  async deleteProfile(id: string): Promise<void> {
    await this.client.delete(`/profiles/${id}`);
  }

  // ===== CATÁLOGO =====
  async getWorks(params?: {
    type?: 'music' | 'audiobook' | 'series';
    age?: string;
    tags?: string;
    search?: string;
    page?: number;
    limit?: number;
    profileId?: string;
  }): Promise<{ data: Work[]; meta: any }> {
    const response = await this.client.get<ApiResponse<{ data: Work[]; meta: any }>>('/works', {
      params,
    });
    return response.data.data;
  }

  async getSuggestedWorks(params?: { profileId?: string; page?: number; limit?: number }): Promise<{ data: Work[]; meta: any }> {
    const response = await this.client.get<ApiResponse<{ data: Work[]; meta: any }>>('/works/suggested', { params });
    return response.data.data;
  }

  async getWork(id: string): Promise<Work> {
    const response = await this.client.get<ApiResponse<Work>>(`/works/${id}`);
    return response.data.data;
  }

  async toggleFavorite(workId: string): Promise<{ isFavorite: boolean }> {
    const response = await this.client.post<ApiResponse<{ isFavorite: boolean }>>(`/works/${workId}/favorite`, undefined, {
      params: typeof window !== 'undefined' ? { profileId: (typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') || undefined : undefined) } : undefined,
    });
    return response.data.data;
  }

  async getFavorites(params?: { page?: number; limit?: number; profileId?: string }): Promise<{ data: Work[]; meta: any }> {
    const response = await this.client.get<ApiResponse<{ data: Work[]; meta: any }>>('/works/favorites', { params });
    return response.data.data;
  }

  // ===== PLAYBACK =====
  async getStreamingUrl(trackId: string): Promise<{ url: string; expiresAt: string }> {
    const response = await this.client.get<ApiResponse<{ url: string; expiresAt: string }>>(`/playback/${trackId}/url`);
    return response.data.data;
  }

  async recordPlaybackEvent(data: {
    trackId: string;
    eventType: 'play' | 'pause' | 'complete' | 'seek';
    positionSeconds?: number;
    profileId?: string;
  }): Promise<void> {
    await this.client.post('/playback/events', data);
  }

  // ===== PLAYLISTS =====
  async getPlaylists(params?: { profileId?: string }): Promise<Array<{ id: string; name: string; isDefault: boolean }>> {
    const response = await this.client.get<ApiResponse<Array<{ id: string; name: string; isDefault: boolean }>>>('/playlists', { params });
    return response.data.data;
  }

  async createPlaylist(data: { name: string; profileId?: string }): Promise<{ id: string; name: string; isDefault: boolean }> {
    const response = await this.client.post<ApiResponse<{ id: string; name: string; isDefault: boolean }>>('/playlists', data);
    return response.data.data;
  }

  async getPlaylistItems(playlistId: string): Promise<Array<{ id: string; track: Track; orderIndex: number }>> {
    const response = await this.client.get<ApiResponse<Array<{ id: string; track: Track; orderIndex: number }>>>(`/playlists/${playlistId}/items`);
    return response.data.data;
  }

  async addPlaylistItem(playlistId: string, trackId: string): Promise<{ id: string; trackId: string; orderIndex: number }>{
    const response = await this.client.post<ApiResponse<{ id: string; trackId: string; orderIndex: number }>>(`/playlists/${playlistId}/items`, { trackId });
    return response.data.data;
  }

  async removePlaylistItem(playlistId: string, itemId: string): Promise<void> {
    await this.client.delete(`/playlists/${playlistId}/items/${itemId}`);
  }

  async reorderPlaylistItems(playlistId: string, itemIdsInOrder: string[]): Promise<void> {
    await this.client.patch(`/playlists/${playlistId}/items/reorder`, { itemIdsInOrder });
  }

  // ===== ASSINATURAS =====
  async getPlans(): Promise<Plan[]> {
    const response = await this.client.get<ApiResponse<Plan[]>>('/subscriptions/plans');
    return response.data.data;
  }

  async getCurrentSubscription(): Promise<Subscription> {
    const response = await this.client.get<ApiResponse<Subscription>>('/subscriptions/current');
    return response.data.data;
  }

  async changePlan(planId: string): Promise<Subscription> {
    const response = await this.client.post<ApiResponse<Subscription>>('/subscriptions/change-plan', {
      planId,
    });
    return response.data.data;
  }

  // ===== ADMIN =====
  async adminGetWorks(params?: any): Promise<{ data: Work[]; meta: any }> {
    const response = await this.client.get<ApiResponse<{ data: Work[]; meta: any }>>('/admin/works', {
      params,
    });
    return response.data.data;
  }

  async adminCreateWork(data: any): Promise<Work> {
    const response = await this.client.post<ApiResponse<Work>>('/admin/works', data);
    return response.data.data;
  }

  async adminUpdateWork(id: string, data: Partial<Work>): Promise<Work> {
    const response = await this.client.patch<ApiResponse<Work>>(`/admin/works/${id}`, data);
    return response.data.data;
  }

  async adminToggleWorkStatus(id: string): Promise<Work> {
    const response = await this.client.patch<ApiResponse<Work>>(`/admin/works/${id}/toggle-status`);
    return response.data.data;
  }

  async adminDeleteWork(id: string): Promise<void> {
    await this.client.delete(`/admin/works/${id}`);
  }

  async adminCreateTrack(workId: string, data: { title: string; storageKey: string }): Promise<Track> {
    const response = await this.client.post<ApiResponse<Track>>(`/admin/works/${workId}/tracks`, data);
    return response.data.data;
  }

  async adminGetUsers(params?: any): Promise<{ data: User[]; meta: any }> {
    const response = await this.client.get<ApiResponse<{ data: User[]; meta: any }>>('/admin/users', {
      params,
    });
    return response.data.data;
  }

  async adminToggleUserStatus(id: string): Promise<User> {
    const response = await this.client.post<ApiResponse<User>>(`/admin/users/${id}/toggle-status`);
    return response.data.data;
  }

  async adminGetTags(): Promise<Tag[]> {
    const response = await this.client.get<ApiResponse<Tag[]>>('/admin/tags');
    return response.data.data;
  }

  async adminCreateTag(data: { name: string; color: string }): Promise<Tag> {
    const response = await this.client.post<ApiResponse<Tag>>('/admin/tags', data);
    return response.data.data;
  }

  async adminUpdateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const response = await this.client.patch<ApiResponse<Tag>>(`/admin/tags/${id}`, data);
    return response.data.data;
  }

  async adminDeleteTag(id: string): Promise<void> {
    await this.client.delete(`/admin/tags/${id}`);
  }

  async getUploadUrl(params: { fileName: string; fileType: string; fileSize: number }): Promise<{ uploadUrl: string; storageKey: string; expiresAt: string }>{
    const response = await this.client.post<ApiResponse<{ uploadUrl: string; storageKey: string; expiresAt: string }>>('/media/upload-url', params);
    return response.data.data;
  }

  async processMedia(params: { storageKey: string; type: 'audio' | 'image'; workId?: string }): Promise<{ processedUrl: string; metadata: any }>{
    const response = await this.client.post<ApiResponse<{ processedUrl: string; metadata: any }>>('/media/process', params);
    return response.data.data;
  }

  async getStreamingUrl(trackId: string): Promise<{ url: string }>{
    const response = await this.client.get<ApiResponse<{ url: string }>>(`/playback/${trackId}/url`);
    return response.data.data;
  }
}

// Exportar instância única da API
export const api = new ApiService();

// Exportar tipos
export type {
  User,
  Profile,
  Plan,
  Work,
  Track,
  Tag,
  Favorite,
  Subscription,
  AuthResponse,
  ApiResponse,
  ApiError,
};
