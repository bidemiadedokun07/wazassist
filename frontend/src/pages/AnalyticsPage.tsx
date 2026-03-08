import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  MessageCircle,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { useBusiness } from '../hooks/useBusiness'
import { businessService } from '../services/business'
import { orderService } from '../services/order'
import { productService } from '../services/product'

export default function AnalyticsPage() {
  const { currentBusiness } = useBusiness()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Fetch business stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['business-stats', currentBusiness?.id],
    queryFn: () => businessService.getBusinessStats(currentBusiness!.id),
    enabled: !!currentBusiness,
  })

  // Fetch orders for analytics
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', currentBusiness?.id],
    queryFn: () => orderService.getOrders(currentBusiness!.id),
    enabled: !!currentBusiness,
  })

  // Fetch products for analytics
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', currentBusiness?.id],
    queryFn: () => productService.getProducts(currentBusiness!.id),
    enabled: !!currentBusiness,
  })

  const isLoading = statsLoading || ordersLoading || productsLoading

  // Calculate analytics data
  const revenueData = orders
    ? Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dayOrders = orders.filter((order) => {
          const orderDate = new Date(order.createdAt)
          return orderDate.toDateString() === date.toDateString()
        })
        const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue,
          orders: dayOrders.length,
        }
      })
    : []

  // Order status distribution
  const statusData = orders
    ? [
        { name: 'Pending', value: orders.filter((o) => o.status === 'pending').length },
        { name: 'Confirmed', value: orders.filter((o) => o.status === 'confirmed').length },
        { name: 'Processing', value: orders.filter((o) => o.status === 'processing').length },
        { name: 'Shipped', value: orders.filter((o) => o.status === 'shipped').length },
        { name: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length },
        { name: 'Cancelled', value: orders.filter((o) => o.status === 'cancelled').length },
      ].filter((item) => item.value > 0)
    : []

  // Top products
  const topProducts = products
    ?.sort((a, b) => b.price * b.stock - a.price * a.stock)
    .slice(0, 5)
    .map((product) => ({
      name: product.name.length > 20 ? product.name.slice(0, 20) + '...' : product.name,
      value: product.price * product.stock,
      stock: product.stock,
    })) || []

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate growth rate (mock data for now)
  const revenueGrowth = 12.5
  const ordersGrowth = 8.3
  const productsGrowth = 5.2

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Business Found</h2>
          <p className="text-gray-600">Please create a business to view analytics.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Business performance insights and metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {revenueGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(revenueGrowth)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
          <p className="text-xs text-gray-500 mt-2">vs last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {ordersGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(ordersGrowth)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
          <p className="text-xs text-gray-500 mt-2">vs last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                productsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {productsGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(productsGrowth)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Products</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
          <p className="text-xs text-gray-500 mt-2">in inventory</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <MessageCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Conversations</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalConversations || 0}</p>
          <p className="text-xs text-gray-500 mt-2">
            {stats?.activeConversations || 0} active chats
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue & Orders Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend (7 Days)</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Revenue"
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No order data available
            </div>
          )}
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Value */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Products by Inventory Value</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar dataKey="value" fill="#8b5cf6" name="Inventory Value" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No product data available
            </div>
          )}
        </div>

        {/* Daily Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Orders (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="orders" fill="#10b981" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Alert */}
      {products && products.some((p) => p.stock <= p.lowStockThreshold) && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Low Stock Alert</h3>
              <p className="text-sm text-yellow-800 mb-3">
                The following products are running low on stock:
              </p>
              <div className="space-y-2">
                {products
                  .filter((p) => p.stock <= p.lowStockThreshold)
                  .map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between bg-white p-3 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Current stock: {product.stock} units (Threshold: {product.lowStockThreshold})
                        </p>
                      </div>
                      <a
                        href="/products"
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Restock
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
