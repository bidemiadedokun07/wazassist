import api from './api'

export interface User {
  id: string
  name: string
  phoneNumber: string
  email?: string
  isActive: boolean
}

export interface LoginCredentials {
  phoneNumber: string
  password: string
}

export interface RegisterData {
  phoneNumber: string
  name: string
  email?: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      '/auth/login',
      credentials
    )
    return response.data.data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      data
    )
    return response.data.data
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken })
  },

  async getProfile(): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>('/auth/me')
    return response.data.data
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      oldPassword,
      newPassword,
    })
  },

  async forgotPassword(phoneNumber: string): Promise<{ message: string; resetCode?: string }> {
    const response = await api.post<{ success: boolean; message: string; resetCode?: string }>(
      '/auth/forgot-password',
      { phoneNumber }
    )
    return { message: response.data.message, resetCode: response.data.resetCode }
  },

  async resetPassword(phoneNumber: string, resetCode: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', {
      phoneNumber,
      resetCode,
      newPassword,
    })
  },
}

export default authService
