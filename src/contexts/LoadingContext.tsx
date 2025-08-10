'use client'
import React, { createContext, useContext, useState, useCallback } from 'react'

interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
  cancelable?: boolean
  onCancel?: () => void
}

interface LoadingContextType {
  loading: Record<string, LoadingState>
  setLoading: (key: string, state: LoadingState) => void
  clearLoading: (key: string) => void
  isLoading: (key?: string) => boolean
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoadingState] = useState<Record<string, LoadingState>>({})

  const setLoading = useCallback((key: string, state: LoadingState) => {
    setLoadingState(prev => ({
      ...prev,
      [key]: state
    }))
  }, [])

  const clearLoading = useCallback((key: string) => {
    setLoadingState(prev => {
      const { [key]: removed, ...rest } = prev
      return rest
    })
  }, [])

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return !!loading[key]?.isLoading
    }
    return Object.values(loading).some(state => state.isLoading)
  }, [loading])

  return (
    <LoadingContext.Provider value={{
      loading,
      setLoading,
      clearLoading,
      isLoading
    }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}