import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Package, Upload, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBusiness } from '../hooks/useBusiness'
import { businessService } from '../services/business'
import { productService } from '../services/product'
import { api } from '../services/api'

type SetupStep = 'business' | 'products'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setCurrentBusiness, refetchBusinesses } = useBusiness()

  const [step, setStep] = useState<SetupStep>('business')
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null)
  const [productsAdded, setProductsAdded] = useState(0)

  const [businessLoading, setBusinessLoading] = useState(false)
  const [productLoading, setProductLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)

  const [businessError, setBusinessError] = useState('')
  const [productError, setProductError] = useState('')
  const [productSuccess, setProductSuccess] = useState('')

  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    businessType: 'Retail',
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    description: '',
  })

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '0',
    imageUrl: '',
  })

  const handleCreateBusiness = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusinessError('')

    if (!user) {
      setBusinessError('You must be logged in to create a business.')
      return
    }

    setBusinessLoading(true)

    try {
      const createdBusiness = await businessService.createBusiness({
        ownerId: user.id,
        businessName: businessForm.businessName,
        businessType: businessForm.businessType,
        phoneNumber: businessForm.phoneNumber,
        email: businessForm.email || undefined,
        description: businessForm.description || undefined,
        settings: {
          currency: 'NGN',
        },
      })

      const refreshedBusinesses = await businessService.getMyBusinesses()
      const selectedBusiness =
        refreshedBusinesses.find((business) => business.id === createdBusiness.id) || refreshedBusinesses[0]

      if (selectedBusiness) {
        setCurrentBusiness(selectedBusiness)
        setCreatedBusinessId(selectedBusiness.id)
      } else {
        setCreatedBusinessId(createdBusiness.id)
      }

      await refetchBusinesses()
      setStep('products')
    } catch (error: any) {
      setBusinessError(error.response?.data?.error || 'Failed to create business. Please try again.')
    } finally {
      setBusinessLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setProductError('')
    setUploadLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'products')

      const response = await api.post('/uploads/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const uploadedUrl = response.data?.data?.fileUrl
      if (!uploadedUrl) {
        throw new Error('Upload did not return a file URL')
      }

      setProductForm((previous) => ({ ...previous, imageUrl: uploadedUrl }))
    } catch (error: any) {
      setProductError(error.response?.data?.error || 'Image upload failed. You can still add a product without image.')
    } finally {
      setUploadLoading(false)
      event.target.value = ''
    }
  }

  const handleAddProduct = async (event: React.FormEvent) => {
    event.preventDefault()
    setProductError('')
    setProductSuccess('')

    if (!createdBusinessId) {
      setProductError('Business setup is incomplete. Please refresh and try again.')
      return
    }

    const parsedPrice = Number(productForm.price)
    const parsedStock = Number(productForm.stock)

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setProductError('Please enter a valid product price.')
      return
    }

    setProductLoading(true)

    try {
      await productService.createProduct(createdBusinessId, {
        name: productForm.name,
        description: productForm.description || undefined,
        category: productForm.category || undefined,
        price: parsedPrice,
        stock: Number.isFinite(parsedStock) ? parsedStock : 0,
        imageUrl: productForm.imageUrl || undefined,
      })

      setProductsAdded((count) => count + 1)
      setProductSuccess('Product added successfully. You can add another one or continue.')
      setProductForm({
        name: '',
        description: '',
        category: productForm.category,
        price: '',
        stock: '0',
        imageUrl: '',
      })
    } catch (error: any) {
      setProductError(error.response?.data?.error || 'Failed to create product. Please try again.')
    } finally {
      setProductLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to WazAssist</h1>
          <p className="text-gray-600 mt-2">Let’s get your business ready in a few quick steps.</p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${step === 'business' ? 'bg-primary-100 text-primary-700' : 'bg-green-100 text-green-700'}`}>
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">Business Setup</span>
            {step !== 'business' && <CheckCircle className="w-4 h-4" />}
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${step === 'products' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">Add Products</span>
          </div>
        </div>

        {step === 'business' && (
          <form onSubmit={handleCreateBusiness} className="space-y-4">
            {businessError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {businessError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                required
                value={businessForm.businessName}
                onChange={(event) =>
                  setBusinessForm((previous) => ({ ...previous, businessName: event.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g. Benvi Fashion Hub"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <input
                type="text"
                required
                value={businessForm.businessType}
                onChange={(event) =>
                  setBusinessForm((previous) => ({ ...previous, businessType: event.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Retail, Food, Electronics..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={businessForm.phoneNumber}
                  onChange={(event) =>
                    setBusinessForm((previous) => ({ ...previous, phoneNumber: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+234..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={businessForm.email}
                  onChange={(event) =>
                    setBusinessForm((previous) => ({ ...previous, email: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="business@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                value={businessForm.description}
                onChange={(event) =>
                  setBusinessForm((previous) => ({ ...previous, description: event.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Tell customers what your business offers"
              />
            </div>

            <button
              type="submit"
              disabled={businessLoading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
            >
              {businessLoading ? 'Creating business...' : 'Create Business & Continue'}
            </button>
          </form>
        )}

        {step === 'products' && (
          <div className="space-y-4">
            {productError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {productError}
              </div>
            )}

            {productSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {productSuccess}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(event) =>
                      setProductForm((previous) => ({ ...previous, name: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g. Ankara Gown"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((previous) => ({ ...previous, category: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Fashion, Food, Electronics..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (NGN)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productForm.price}
                    onChange={(event) =>
                      setProductForm((previous) => ({ ...previous, price: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(event) =>
                      setProductForm((previous) => ({ ...previous, stock: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((previous) => ({ ...previous, description: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief product description"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Product Image</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    {uploadLoading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadLoading}
                    />
                  </label>

                  <input
                    type="url"
                    value={productForm.imageUrl}
                    onChange={(event) =>
                      setProductForm((previous) => ({ ...previous, imageUrl: event.target.value }))
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Or paste image URL"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={productLoading || uploadLoading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
              >
                {productLoading ? 'Adding product...' : 'Add Product'}
              </button>
            </form>

            <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                {productsAdded > 0
                  ? `${productsAdded} product${productsAdded > 1 ? 's' : ''} added.`
                  : 'You can skip this step and add products later.'}
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition"
              >
                Finish Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
