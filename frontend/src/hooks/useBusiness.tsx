import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { businessService, Business } from '../services/business'
import { useAuth } from './useAuth'

interface BusinessContextType {
  currentBusiness: Business | null
  businesses: Business[] | undefined
  isLoading: boolean
  setCurrentBusiness: (business: Business) => void
  refetchBusinesses: () => void
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null)

  // Fetch user's businesses - only when user is authenticated
  const { data: businesses, isLoading, refetch } = useQuery({
    queryKey: ['businesses', user?.id],
    queryFn: businessService.getMyBusinesses,
    enabled: !!user, // Only fetch when user is logged in
  })

  // Clear current business when user logs out
  useEffect(() => {
    if (!user) {
      setCurrentBusinessState(null)
    }
  }, [user])

  // Set first business as current if none selected
  useEffect(() => {
    if (businesses && businesses.length > 0 && !currentBusiness) {
      const stored = localStorage.getItem('currentBusinessId')
      const business = stored
        ? businesses.find(b => b.id === stored) || businesses[0]
        : businesses[0]
      setCurrentBusinessState(business)
    }
  }, [businesses, currentBusiness])

  const setCurrentBusiness = (business: Business) => {
    setCurrentBusinessState(business)
    localStorage.setItem('currentBusinessId', business.id)
  }

  return (
    <BusinessContext.Provider
      value={{
        currentBusiness,
        businesses,
        isLoading,
        setCurrentBusiness,
        refetchBusinesses: refetch,
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  }
  return context
}
