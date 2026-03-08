import api from './api'

export interface Business {
  id: string
  name: string
  description?: string
  category: string
  phoneNumber: string
  email?: string
  whatsappNumber?: string
  address?: string
  logoUrl?: string
  isActive: boolean
  createdAt: string
}

export interface BusinessStats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  totalConversations: number
  activeConversations: number
}

export const businessService = {
  async getMyBusinesses(): Promise<Business[]> {
    const response = await api.get<{ success: boolean; data: Business[] }>('/businesses/my')
    return response.data.data
  },

  async getBusiness(id: string): Promise<Business> {
    const response = await api.get<{ success: boolean; data: Business }>(`/businesses/${id}`)
    return response.data.data
  },

  async createBusiness(data: Partial<Business>): Promise<Business> {
    const response = await api.post<{ success: boolean; data: Business }>('/businesses', data)
    return response.data.data
  },

  async updateBusiness(id: string, data: Partial<Business>): Promise<Business> {
    const response = await api.put<{ success: boolean; data: Business }>(`/businesses/${id}`, data)
    return response.data.data
  },

  async getBusinessStats(businessId: string): Promise<BusinessStats> {
    const response = await api.get<{ success: boolean; data: BusinessStats }>(
      `/businesses/${businessId}/stats`
    )
    return response.data.data
  },
}

export default businessService
