'use client'
import React, { Suspense, lazy, ComponentType } from 'react'
import LoadingSpinner from './LoadingSpinner'
import ErrorBoundary from '@/components/error/ErrorBoundary'

// 지연 로딩 래퍼 컴포넌트
interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ComponentType<any>
}

export function LazyWrapper({ 
  children, 
  fallback = <LoadingSpinner size="lg" />,
  errorFallback 
}: LazyWrapperProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

// 동적 import를 위한 헬퍼 함수
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn)
  
  return function WrappedLazyComponent(props: React.ComponentProps<T>) {
    return (
      <LazyWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyWrapper>
    )
  }
}

// 조건부 지연 로딩 컴포넌트
interface ConditionalLazyProps {
  condition: boolean
  children: React.ReactNode
  placeholder?: React.ReactNode
}

export function ConditionalLazy({ 
  condition, 
  children, 
  placeholder = <div className="h-32 bg-gray-100 animate-pulse rounded" />
}: ConditionalLazyProps) {
  if (!condition) {
    return <>{placeholder}</>
  }
  
  return (
    <LazyWrapper>
      {children}
    </LazyWrapper>
  )
}

// 뷰포트 기반 지연 로딩
interface ViewportLazyProps {
  children: React.ReactNode
  rootMargin?: string
  threshold?: number
  placeholder?: React.ReactNode
}

export function ViewportLazy({ 
  children, 
  rootMargin = '50px',
  threshold = 0.1,
  placeholder = <div className="h-32 bg-gray-100 animate-pulse rounded" />
}: ViewportLazyProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold }
    )
    
    if (ref.current) {
      observer.observe(ref.current)
    }
    
    return () => observer.disconnect()
  }, [rootMargin, threshold])
  
  return (
    <div ref={ref}>
      {isVisible ? (
        <LazyWrapper>
          {children}
        </LazyWrapper>
      ) : (
        placeholder
      )}
    </div>
  )
}

// 이미지 지연 로딩 컴포넌트
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  className?: string
}

export function LazyImage({ 
  src, 
  alt, 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==',
  className = '',
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    
    if (imgRef.current) {
      observer.observe(imgRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-50'
      } ${className}`}
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  )
}

// 스크립트 지연 로딩
interface LazyScriptProps {
  src: string
  onLoad?: () => void
  onError?: () => void
}

export function LazyScript({ src, onLoad, onError }: LazyScriptProps) {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  React.useEffect(() => {
    if (!isClient) return

    const script = document.createElement('script')
    script.src = src
    script.async = true
    
    script.onload = () => onLoad?.()
    script.onerror = () => onError?.()
    
    document.head.appendChild(script)
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [src, onLoad, onError, isClient])
  
  return null
}

// 모듈 지연 로딩 훅
export function useLazyModule<T>(
  importFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [module, setModule] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  
  React.useEffect(() => {
    let cancelled = false
    
    setLoading(true)
    setError(null)
    
    importFn()
      .then(mod => {
        if (!cancelled) {
          setModule(mod)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      })
    
    return () => {
      cancelled = true
    }
  }, deps)
  
  return { module, loading, error }
}

// 지연 로딩된 컴포넌트들을 위한 프리로드 함수
export function preloadComponent(importFn: () => Promise<any>) {
  // 컴포넌트를 미리 로드하되 렌더링하지는 않음
  importFn().catch(() => {
    // 프리로드 실패는 무시
  })
}

// 라우트 기반 프리로딩
export function useRoutePreload(routes: Record<string, () => Promise<any>>) {
  React.useEffect(() => {
    // 현재 페이지에서 링크된 라우트들을 프리로드
    const links = document.querySelectorAll('a[href]')
    const hrefs = Array.from(links).map(link => 
      (link as HTMLAnchorElement).pathname
    )
    
    hrefs.forEach(href => {
      const route = Object.keys(routes).find(route => href.includes(route))
      if (route && routes[route]) {
        // 약간의 지연 후 프리로드 (즉시 로드하면 초기 페이지 로딩에 영향)
        setTimeout(() => {
          preloadComponent(routes[route])
        }, 2000)
      }
    })
  }, [routes])
}

export default LazyWrapper