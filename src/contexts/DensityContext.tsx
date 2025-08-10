'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type DensityLevel = 'compact' | 'comfortable' | 'spacious'

export interface DensityConfig {
  level: DensityLevel
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  padding: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
  }
  lineHeight: {
    tight: string
    normal: string
    relaxed: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
  }
}

const DENSITY_CONFIGS: Record<DensityLevel, DensityConfig> = {
  compact: {
    level: 'compact',
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem', 
      md: '0.75rem',
      lg: '1rem',
      xl: '1.25rem'
    },
    padding: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '0.75rem', 
      lg: '1rem',
      xl: '1.25rem'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '0.875rem',
      lg: '1rem',
      xl: '1.125rem'
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.4',
      relaxed: '1.5'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem'
    }
  },
  comfortable: {
    level: 'comfortable',
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    padding: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem', 
      xl: '2rem'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem'
    },
    lineHeight: {
      tight: '1.375',
      normal: '1.5',
      relaxed: '1.625'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem'
    }
  },
  spacious: {
    level: 'spacious',
    spacing: {
      xs: '0.75rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem'
    },
    padding: {
      xs: '0.75rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem'
    },
    fontSize: {
      xs: '0.875rem',
      sm: '1rem',
      base: '1.125rem',
      lg: '1.25rem',
      xl: '1.5rem'
    },
    lineHeight: {
      tight: '1.5',
      normal: '1.625',
      relaxed: '1.75'
    },
    borderRadius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem'
    }
  }
}

interface DensityContextType {
  density: DensityLevel
  config: DensityConfig
  setDensity: (density: DensityLevel) => void
  getDensityClass: (component: string, variant?: string) => string
}

const DensityContext = createContext<DensityContextType | undefined>(undefined)

interface DensityProviderProps {
  children: ReactNode
  defaultDensity?: DensityLevel
}

export function DensityProvider({ children, defaultDensity = 'comfortable' }: DensityProviderProps) {
  const [density, setDensityState] = useState<DensityLevel>(defaultDensity)
  const [isClient, setIsClient] = useState(false)

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 로컬 스토리지에서 설정 로드 (클라이언트 사이드에서만)
  useEffect(() => {
    if (!isClient) return
    
    try {
      const saved = localStorage.getItem('ui-density')
      if (saved && (saved === 'compact' || saved === 'comfortable' || saved === 'spacious')) {
        setDensityState(saved)
      }
    } catch (error) {
      console.warn('Failed to load density setting from localStorage:', error)
    }
  }, [isClient])

  // 설정 변경 시 로컬 스토리지에 저장
  const setDensity = (newDensity: DensityLevel) => {
    setDensityState(newDensity)
    
    if (isClient) {
      try {
        localStorage.setItem('ui-density', newDensity)
      } catch (error) {
        console.warn('Failed to save density setting to localStorage:', error)
      }
    }
    
    // CSS 변수 업데이트 (클라이언트 사이드에서만)
    if (typeof document === 'undefined') return
    
    const config = DENSITY_CONFIGS[newDensity]
    const root = document.documentElement
    
    root.style.setProperty('--density-spacing-xs', config.spacing.xs)
    root.style.setProperty('--density-spacing-sm', config.spacing.sm)
    root.style.setProperty('--density-spacing-md', config.spacing.md)
    root.style.setProperty('--density-spacing-lg', config.spacing.lg)
    root.style.setProperty('--density-spacing-xl', config.spacing.xl)
    
    root.style.setProperty('--density-padding-xs', config.padding.xs)
    root.style.setProperty('--density-padding-sm', config.padding.sm)
    root.style.setProperty('--density-padding-md', config.padding.md)
    root.style.setProperty('--density-padding-lg', config.padding.lg)
    root.style.setProperty('--density-padding-xl', config.padding.xl)
    
    root.style.setProperty('--density-font-xs', config.fontSize.xs)
    root.style.setProperty('--density-font-sm', config.fontSize.sm)
    root.style.setProperty('--density-font-base', config.fontSize.base)
    root.style.setProperty('--density-font-lg', config.fontSize.lg)
    root.style.setProperty('--density-font-xl', config.fontSize.xl)
    
    root.style.setProperty('--density-leading-tight', config.lineHeight.tight)
    root.style.setProperty('--density-leading-normal', config.lineHeight.normal)
    root.style.setProperty('--density-leading-relaxed', config.lineHeight.relaxed)
    
    root.style.setProperty('--density-radius-sm', config.borderRadius.sm)
    root.style.setProperty('--density-radius-md', config.borderRadius.md)
    root.style.setProperty('--density-radius-lg', config.borderRadius.lg)
  }

  // 컴포넌트별 밀도 클래스 생성
  const getDensityClass = (component: string, variant?: string) => {
    const baseClass = `density-${density}`
    const componentClass = `${component}-${density}`
    const variantClass = variant ? `${component}-${variant}-${density}` : ''
    
    return [baseClass, componentClass, variantClass].filter(Boolean).join(' ')
  }

  const config = DENSITY_CONFIGS[density]

  // 초기 CSS 변수 설정 (클라이언트 사이드에서만)
  useEffect(() => {
    if (isClient) {
      setDensity(density)
    }
  }, [isClient, density])

  const value: DensityContextType = {
    density,
    config,
    setDensity,
    getDensityClass
  }

  return (
    <DensityContext.Provider value={value}>
      {children}
    </DensityContext.Provider>
  )
}

export function useDensity() {
  const context = useContext(DensityContext)
  if (context === undefined) {
    throw new Error('useDensity must be used within a DensityProvider')
  }
  return context
}

export { DENSITY_CONFIGS }
export default DensityContext