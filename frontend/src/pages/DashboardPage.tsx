import { useQuery } from '@tanstack/react-query'
import { Package, ShoppingCart, DollarSign, MessageCircle, TrendingUp, AlertCircle } from 'lucide-react'
import { useBusiness } from '../hooks/useBusiness'
import { businessService } from '../services/business'

export default function DashboardPage() {
  const { currentBusiness } = useBusiness()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['business-stats', currentBusiness?.id],
    queryFn: () => businessService.getBusinessStats(currentBusiness!.id),
    enabled: !!currentBusiness,
  })

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Business Found</h2>
          <p className="text-gray-600">Please create a business to get started.</p>
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="transition-opacity duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{currentBusiness.name}</h1>
        <p className="text-gray-600 text-lg">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Products</p>
            <div className="p-3 bg-blue-100 rounded-xl shadow-sm">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{stats?.totalProducts || 0}</p>
          <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
            Active inventory items
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-50 to-white border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Orders</p>
            <div className="p-3 bg-green-100 rounded-xl shadow-sm">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{stats?.totalOrders || 0}</p>
          <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            All time orders
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Revenue</p>
            <div className="p-3 bg-purple-100 rounded-xl shadow-sm">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{formatCurrency(stats?.totalRevenue || 0)}</p>
          <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full"></span>
            Total earnings
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-gradient-to-br from-orange-50 to-white border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Conversations</p>
            <div className="p-3 bg-orange-100 rounded-xl shadow-sm">
              <MessageCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{stats?.totalConversations || 0}</p>
          <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            {stats?.activeConversations || 0} active chats
          </p>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-green-500 rounded-2xl shadow-2xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative flex items-center gap-4">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
            <TrendingUp className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">Your business is growing! 🚀</h2>
            <p className="text-green-100 text-lg">
              Keep engaging with your customers through WhatsApp to boost your sales.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <a
              href="/products"
              className="block p-4 rounded-xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-green-50 transition-all duration-300 border-2 border-transparent hover:border-primary-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary-100 rounded-lg group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-primary-600">Manage Products</p>
                  <p className="text-sm text-gray-600">Add or update your inventory</p>
                </div>
              </div>
            </a>
            <a
              href="/orders"
              className="block p-4 rounded-xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-green-50 transition-all duration-300 border-2 border-transparent hover:border-primary-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary-100 rounded-lg group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-primary-600">View Orders</p>
                  <p className="text-sm text-gray-600">Check recent customer orders</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Getting Started
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                1
              </div>
              <div>
                <p className="text-sm text-gray-900 font-semibold">Add your products</p>
                <p className="text-xs text-gray-600 mt-1">Build your product catalog</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                2
              </div>
              <div>
                <p className="text-sm text-gray-900 font-semibold">Connect WhatsApp</p>
                <p className="text-xs text-gray-600 mt-1">Setup your WhatsApp Business account</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold">Start selling</p>
                <p className="text-xs text-gray-400 mt-1">Let AI handle customer inquiries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
