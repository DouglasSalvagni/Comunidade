import appConfig from '../../app.json'

const BASE_URL: string = (appConfig as any)?.expo?.extra?.apiBaseUrl || ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      const msg = json?.message || json?.details?.message || json?.error || `HTTP ${res.status}`
      const normalized = Array.isArray(msg) ? msg.join(', ') : String(msg)
      throw new Error(normalized)
    } catch {
      throw new Error(text || `HTTP ${res.status}`)
    }
  }
  return res.json()
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