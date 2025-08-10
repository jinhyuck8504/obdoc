'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getDefaultDashboardRoute, UserRole } from '@/lib/roleUtils'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface AutoRedirectProps {
  children?: React.ReactNode
  redirectTo?: 'dashboard' | 'login'
}

/**
 * 사용자 상태에 따라 자동으로 리다이렉트하는 컴포넌트
 * - 로그인된 사용자: 역할에 맞는 대시보드로 리다이렉트
 * - 로그인되지 않은 사용자: 로그인 페이지로 리다이렉트
 */
export default function AutoRedirect({ 
  children, 
  redirectTo = 'dashboard' 
}: AutoRedirectProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (user && redirectTo === 'dashboard') {
      // 로그인된 사용자를 역할에 맞는 대시보드로 리다이렉트
      const userRole = user.role as UserRole
      const dashboardPath = getDefaultDashboardRoute(userRole)
      router.push(dashboardPath)
    } else if (!user && redirectTo === 'login') {
      // 로그인되지 않은 사용자를 로그인 페이지로 리다이렉트
      router.push('/login')
    }
  }, [user, loading, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // 리다이렉트 중이면 로딩 표시
  if ((user && redirectTo === 'dashboard') || (!user && redirectTo === 'login')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
}