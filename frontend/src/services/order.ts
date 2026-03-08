import api from './api'

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  productImageUrl?: string
}

export interface Order {
  id: string
  businessId: string
  customerId: string
  customerName: string
  customerPhone: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: number
  currency: string
  items: OrderItem[]
  notes?: string
  shippingAddress?: string
  paymentMethod?: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
}

export interface CreateOrderData {
  customerId: string
  items: {
    productId: string
    quantity: number
  }[]
  notes?: string
  shippingAddress?: string
  paymentMethod?: string
}

export interface UpdateOrderData {
  status?: Order['status']
  paymentStatus?: Order['paymentStatus']
  notes?: string
  shippingAddress?: string
}

export const orderService = {
  async getOrders(businessId: string): Promise<Order[]> {
    const response = await api.get<{ success: boolean; data: Order[] }>(
      `/orders/business/${businessId}`
    )
    return response.data.data
  },

  async getOrder(orderId: string, businessId: string): Promise<Order> {
    const response = await api.get<{ success: boolean; data: Order }>(
      `/orders/${orderId}/business/${businessId}`
    )
    return response.data.data
  },

  async createOrder(businessId: string, data: CreateOrderData): Promise<Order> {
    const response = await api.post<{ success: boolean; data: Order }>('/orders', {
      ...data,
      businessId,
    })
    return response.data.data
  },

  async updateOrder(
    orderId: string,
    businessId: string,
    data: UpdateOrderData
  ): Promise<Order> {
    const response = await api.put<{ success: boolean; data: Order }>(
      `/orders/${orderId}/business/${businessId}`,
      data
    )
    return response.data.data
  },

  async updateOrderStatus(
    orderId: string,
    businessId: string,
    status: Order['status']
  ): Promise<Order> {
    const response = await api.patch<{ success: boolean; data: Order }>(
      `/orders/${orderId}/business/${businessId}/status`,
      { status }
    )
    return response.data.data
  },

  async cancelOrder(orderId: string, businessId: string): Promise<Order> {
    const response = await api.post<{ success: boolean; data: Order }>(
      `/orders/${orderId}/business/${businessId}/cancel`
    )
    return response.data.data
  },

  async searchOrders(businessId: string, query: string): Promise<Order[]> {
    const response = await api.get<{ success: boolean; data: Order[] }>(
      `/orders/business/${businessId}/search?q=${encodeURIComponent(query)}`
    )
    return response.data.data
  },

  async getOrdersByStatus(
    businessId: string,
    status: Order['status']
  ): Promise<Order[]> {
    const response = await api.get<{ success: boolean; data: Order[] }>(
      `/orders/business/${businessId}?status=${status}`
    )
    return response.data.data
  },
}

export default orderService
