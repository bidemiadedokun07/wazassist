import api from './api'

export interface Product {
  id: string
  businessId: string
  name: string
  description?: string
  price: number
  currency: string
  sku?: string
  category?: string
  stock: number
  lowStockThreshold: number
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductData {
  name: string
  description?: string
  price: number
  currency?: string
  sku?: string
  category?: string
  stock?: number
  lowStockThreshold?: number
  imageUrl?: string
}

export const productService = {
  async getProducts(businessId: string): Promise<Product[]> {
    const response = await api.get<{ success: boolean; data: Product[] }>(
      `/products/business/${businessId}`
    )
    return response.data.data
  },

  async getProduct(productId: string, businessId: string): Promise<Product> {
    const response = await api.get<{ success: boolean; data: Product }>(
      `/products/${productId}/business/${businessId}`
    )
    return response.data.data
  },

  async createProduct(businessId: string, data: CreateProductData): Promise<Product> {
    const response = await api.post<{ success: boolean; data: Product }>('/products', {
      ...data,
      businessId,
    })
    return response.data.data
  },

  async updateProduct(
    productId: string,
    businessId: string,
    data: Partial<CreateProductData>
  ): Promise<Product> {
    const response = await api.put<{ success: boolean; data: Product }>(
      `/products/${productId}/business/${businessId}`,
      data
    )
    return response.data.data
  },

  async deleteProduct(productId: string, businessId: string): Promise<void> {
    await api.delete(`/products/${productId}/business/${businessId}`)
  },

  async updateStock(
    productId: string,
    businessId: string,
    operation: 'increment' | 'decrement' | 'set',
    quantity: number
  ): Promise<Product> {
    const response = await api.patch<{ success: boolean; data: Product }>(
      `/products/${productId}/business/${businessId}/stock`,
      { operation, quantity }
    )
    return response.data.data
  },

  async searchProducts(businessId: string, query: string): Promise<Product[]> {
    const response = await api.get<{ success: boolean; data: Product[] }>(
      `/products/business/${businessId}/search?q=${encodeURIComponent(query)}`
    )
    return response.data.data
  },
}

export default productService
