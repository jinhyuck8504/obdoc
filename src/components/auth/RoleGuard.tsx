'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  redirectTo?: string
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = '/unauthorized' 
}: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="권한 확인 중..." />
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (!allowedRoles.includes(user.role)) {
    router.push(redirectTo)
    return null
  }

  return <>{children}</>
}