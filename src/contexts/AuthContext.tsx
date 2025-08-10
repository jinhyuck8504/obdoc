'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { auth, User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 자동 로그아웃 타이머 (30분)
  const AUTO_LOGOUT_TIME = 30 * 60 * 1000 // 30분

  // 프로덕션 환경 체크 (더 엄격한 조건)
  const isDevelopment = process.env.NODE_ENV === 'development' && 
    (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') || 
     process.env.NEXT_PUBLIC_APP_URL?.includes('127.0.0.1'))
  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_url_here')

  const refreshUser = async () => {
    try {
      setLoading(true)
      const currentUser = await auth.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await auth.signIn(email, password)

      if (error) {
        return { error }
      }

      // 사용자 정보 새로고침
      await refreshUser()

      // 세션 정보 로컬 스토리지에 저장
      if (data?.session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(data.session))
      }

      return { error: null }
    } catch (error) {
      return { error: { message: '로그인 중 오류가 발생했습니다.' } }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await auth.signOut()
      setUser(null)

      // 로컬 스토리지 정리
      localStorage.removeItem('lastActivity')
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('token_expiry')

      // 모든 Supabase 관련 로컬 스토리지 정리
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key)
        }
      })

      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('사용자가 로그인되어 있지 않습니다')

    try {
      setLoading(true)
      // 로컬 상태 업데이트 (개발 환경)
      setUser(prev => prev ? { ...prev, ...updates } : null)

      // 실제 환경에서는 Supabase 프로필 업데이트
      // const { error } = await supabase
      //   .from('profiles')
      //   .update(updates)
      //   .eq('id', user.id)
      // if (error) throw error

    } catch (error) {
      console.error('프로필 업데이트 실패:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 활동 시간 업데이트
  const updateLastActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString())
  }

  // 자동 로그아웃 체크
  const checkAutoLogout = () => {
    if (!user) return

    const lastActivity = localStorage.getItem('lastActivity')
    if (lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity)
      if (timeSinceLastActivity > AUTO_LOGOUT_TIME) {
        console.log('Auto logout due to inactivity')
        signOut()
      }
    }
  }

  useEffect(() => {
    let mounted = true

    // 초기 사용자 상태 확인
    const initializeAuth = async () => {
      try {
        // 개발 환경에서 더미 사용자 복원
        if (isDevelopment && isDummySupabase) {
          const dummyUser = localStorage.getItem('dummy_user')
          if (dummyUser && mounted) {
            setUser(JSON.parse(dummyUser))
          } else if (mounted) {
            setUser(null)
          }
          if (mounted) {
            setLoading(false)
          }
          return
        }

        // 실제 Supabase 세션 복원 시도
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user && mounted) {
          const currentUser = await auth.getCurrentUser()
          setUser(currentUser)
        } else if (mounted) {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // 인증 상태 변경 감지 (실제 Supabase에서만)
    let subscription: any = null
    if (!isDummySupabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event: string, session: any) => {
          console.log('Auth state changed:', event, session?.user?.id)

          if (!mounted) return

          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const currentUser = await auth.getCurrentUser()
              setUser(currentUser)
            } catch (error) {
              console.error('Error getting user after sign in:', error)
              setUser(null)
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            try {
              const currentUser = await auth.getCurrentUser()
              setUser(currentUser)
            } catch (error) {
              console.error('Error getting user after token refresh:', error)
            }
          }

          if (mounted) {
            setLoading(false)
          }
        }
      )
      subscription = data.subscription
    }

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // 자동 로그아웃 및 활동 감지
  useEffect(() => {
    if (!user) return

    // 초기 활동 시간 설정
    updateLastActivity()

    // 사용자 활동 감지 이벤트
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

    const handleActivity = () => {
      updateLastActivity()
    }

    // 이벤트 리스너 등록
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // 주기적으로 자동 로그아웃 체크 (1분마다)
    const interval = setInterval(checkAutoLogout, 60000)

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      clearInterval(interval)
    }
  }, [user])

  // 자동 리다이렉트 로직
  useEffect(() => {
    if (!loading && user) {
      const currentPath = window.location.pathname

      // 로그인/회원가입 페이지에 있으면 대시보드로 리다이렉트
      if (currentPath === '/login' || currentPath === '/signup') {
        redirectToDashboard(user.role)
      }
      // 루트 경로에서도 대시보드로 리다이렉트 (로그인된 사용자의 경우)
      else if (currentPath === '/') {
        redirectToDashboard(user.role)
      }
    }
  }, [user, loading, router])

  const redirectToDashboard = (role: string) => {
    console.log('Redirecting user with role:', role)

    switch (role) {
      case 'doctor':
        router.push('/dashboard/doctor')
        break
      case 'customer':
        router.push('/dashboard/customer')
        break
      case 'customer':
        router.push('/dashboard/customer')
        break
      case 'admin':
        router.push('/dashboard/admin')
        break
      default:
        console.warn('Unknown role:', role)
        router.push('/login')
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    refreshUser,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}