import appConfig from '../../app.json'

const BASE_URL: string = (appConfig as any)?.expo?.extra?.apiBaseUrl || ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    try { console.log('[API ERROR]', options.method || 'GET', path, res.status, text) } catch { }
    try {
      const json = JSON.parse(text)
      const rawMsg = json?.message || json?.details?.message || json?.error || `HTTP ${res.status}`
      const normalized = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg)
      throw new Error(normalized)
    } catch {
      // Texto pode vir como JSON ou string plana; se não parsear, retorne status amigável
      const friendly = text && text.startsWith('{') ? `HTTP ${res.status}` : (text || `HTTP ${res.status}`)
      throw new Error(friendly)
    }
  }
  const ct = res.headers.get('content-type') || ''
  if (res.status === 204) {
    return undefined as any
  }
  if (ct.includes('application/json')) {
    return res.json()
  }
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text as any }
}

export async function apiLogin(email: string, password: string) {
  return request<{ user: any; accessToken: string; refreshToken: string }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
  )
}

export async function apiRegister(name: string, email: string, password: string) {
  return request<{ user: any; accessToken: string; refreshToken: string }>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    },
  )
}

export async function apiRequestEmailVerification(email: string) {
  return request<{ ok: boolean }>(
    '/auth/email/verify/request',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
  )
}

export async function apiVerifyEmail(token: string) {
  return request<{ user: any; accessToken: string; refreshToken: string }>(
    '/auth/email/verify',
    {
      method: 'POST',
      body: JSON.stringify({ token }),
    },
  )
}

export async function apiForgotPassword(email: string) {
  return request<{ ok: boolean }>(
    '/auth/password/forgot',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
  )
}

export async function apiResetPassword(token: string, newPassword: string) {
  return request<{ ok: boolean }>(
    '/auth/password/reset',
    {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    },
  )
}

export async function apiProfile(accessToken: string) {
  return request<any>('/auth/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function apiGoogleOAuth(idToken: string) {
  return request<{ user: any; accessToken: string; refreshToken: string }>(
    '/auth/oauth/google',
    {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    },
  )
}

export async function apiGetProfiles(accessToken: string) {
  return request<any[]>('/profiles', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function apiCreateProfile(accessToken: string, data: { name: string; birthDate?: string; avatarUrl?: string; parentalPin?: string }) {
  return request<any>('/profiles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  })
}

export async function apiUpdateProfile(accessToken: string, id: string, data: Partial<{ name: string; birthDate: string; avatarUrl: string; parentalPin: string }>) {
  return request<any>(`/profiles/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  })
}

export async function apiDeleteProfile(accessToken: string, id: string) {
  return request<void>(`/profiles/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function apiUpdateMyProfile(accessToken: string, data: { name?: string }) {
  return request<any>('/auth/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  })
}

export async function apiChangeMyPassword(accessToken: string, data: { currentPassword: string; newPassword: string }) {
  return request<any>('/auth/profile/password', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  })
}

export async function apiGetWorks(accessToken: string, params?: {
  type?: 'music' | 'audiobook' | 'series'
  search?: string
  minMonths?: number
  maxMonths?: number
  tags?: string
  page?: number
  limit?: number
  profileId?: string
}): Promise<{ data: any[]; meta: any }> {
  const qs = new URLSearchParams()
  if (params?.type) qs.set('type', params.type)
  if (params?.search) qs.set('search', params.search)
  if (typeof params?.minMonths === 'number') qs.set('minMonths', String(params.minMonths))
  if (typeof params?.maxMonths === 'number') qs.set('maxMonths', String(params.maxMonths))
  if (params?.tags) qs.set('tags', params.tags)
  if (typeof params?.page === 'number') qs.set('page', String(params.page))
  if (typeof params?.limit === 'number') qs.set('limit', String(params.limit))
  if (params?.profileId) qs.set('profileId', params.profileId)
  const path = `/works${qs.toString() ? `?${qs.toString()}` : ''}`
  return request<{ data: any[]; meta: any }>(path, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function apiGetFavorites(accessToken: string, params?: {
  page?: number
  limit?: number
  profileId?: string
}): Promise<{ data: any[]; meta: any }> {
  const qs = new URLSearchParams()
  if (typeof params?.page === 'number') qs.set('page', String(params.page))
  if (typeof params?.limit === 'number') qs.set('limit', String(params.limit))
  if (params?.profileId) qs.set('profileId', params.profileId)
  const path = `/works/favorites${qs.toString() ? `?${qs.toString()}` : ''}`
  return request<{ data: any[]; meta: any }>(path, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function apiGetStreamingUrl(accessToken: string, trackId: string) {
  return request<{ url: string; expiresAt?: string }>(`/playback/${trackId}/url`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function apiToggleFavorite(accessToken: string, workId: string, profileId?: string) {
  const qs = new URLSearchParams()
  if (profileId) qs.set('profileId', profileId)
  const path = `/works/${workId}/favorite${qs.toString() ? `?${qs.toString()}` : ''}`
  return request<{ isFavorite: boolean }>(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function apiGetWork(accessToken: string, id: string) {
  return request<any>(`/works/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}