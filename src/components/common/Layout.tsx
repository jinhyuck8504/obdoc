'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import SkipLink from './SkipLink'
import { useAuth } from '@/contexts/AuthContext'
import ErrorBoundary from '@/components/error/ErrorBoundary'
import { ToastContainer } from '@/components/common/Toast'
import { useToast } from '@/contexts/ToastContext'
import { useLoading } from '@/contexts/LoadingContext'
import LoadingSpinner from './LoadingSpinner'
import { HydrationDevProvider } from '@/components/hydration'

interface LayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  showFooter?: boolean
  className?: string
}

export default function Layout({ 
  children, 
  showHeader = true, 
  showFooter = true,
  className = ''
}: LayoutProps) {
  const pathname = usePathname()
  const { toasts, hideToast } = useToast()
  const { loading: loadingStates } = useLoading()

  // 특정 페이지에서는 Header/Footer 숨기기
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isAdminPage = pathname === '/admin.html'
  const isUnauthorizedPage = pathname === '/unauthorized'
  
  // 메인 헤더는 모든 페이지에서 표시 (로그인/회원가입 제외)
  const shouldShowHeader = showHeader && !isAuthPage && !isUnauthorizedPage
  const shouldShowFooter = showFooter && !isAuthPage && !isAdminPage && !isUnauthorizedPage

  // 전역 로딩 상태 확인
  const hasGlobalLoading = Object.values(loadingStates).some(state => state.isLoading)

  return (
    <HydrationDevProvider>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Layout Error:', error, errorInfo)
        }}
      >
        <div className={`min-h-screen flex flex-col ${className}`}>
          <SkipLink />
          {shouldShowHeader && <Header />}
          
          <main 
            id="main-content"
            className={`flex-1 ${shouldShowHeader ? '' : 'pt-0'} relative`}
            role="main"
            aria-label="메인 콘텐츠"
          >
            <div className="min-h-full">
              {children}
            </div>
            
            {/* 전역 로딩 오버레이 */}
            {hasGlobalLoading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-xl">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    {Object.values(loadingStates).find(state => state.isLoading)?.message || '처리 중...'}
                  </p>
                </div>
              </div>
            )}
          </main>
          
          {shouldShowFooter && <Footer />}
          
          {/* 토스트 알림 컨테이너 */}
          <ToastContainer toasts={toasts} onClose={hideToast} />
        </div>
      </ErrorBoundary>
    </HydrationDevProvider>
  )
}