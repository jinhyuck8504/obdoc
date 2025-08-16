'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AutoRedirectProps {
  children: React.ReactNode
  redirectTo?: string
}

const AutoRedirect: React.FC<AutoRedirectProps> = ({ 
  children, 
  redirectTo = 'dashboard' 
}) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // 사용자가 로그인되어 있으면 역할에 따라 리다이렉트
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
          router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  // 로그인된 사용자는 리다이렉트되므로 children을 렌더링하지 않음
  if (user) {
    return null
  }

  return <>{children}</>
}

export default AutoRedirect