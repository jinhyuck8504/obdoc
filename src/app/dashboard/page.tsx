'use client'
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else {
        // 역할에 따라 적절한 대시보드로 리다이렉트
        switch (user.role) {
          case 'doctor':
            router.push('/dashboard/doctor')
            break
          case 'customer':
            router.push('/dashboard/customer')
            break
          case 'admin':
            router.push('/dashboard/admin')
            break
          default:
            router.push('/login')
        }
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}