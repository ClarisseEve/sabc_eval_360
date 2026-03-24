import { apiClient } from './client'

export interface LoginPayload { email: string; password: string }
export interface AuthUser {
  matricule: string
  email: string
  role: string
  nom?: string
  prenom?: string
  role_nom?: string
  est_actif?: boolean
  est_admin?: boolean
  photo_url?: string | null
}
export interface LoginResponse { access_token: string; user: AuthUser }

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login', payload).then((r) => r.data),

  me: () =>
    apiClient.get<AuthUser>('/auth/me').then((r) => r.data),

  logout: () => {
    localStorage.removeItem('access_token')
  },
}
