'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { auth, User } from '@/lib/auth'
import { withAuthTimeout, getErrorMessage } from '@/lib/timeoutUtils'
import { isDevelopment, isDummySupabase } from '@/lib/config'

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

  // 환경 설정은 config.ts에서 가져오기

  const refreshUser = async () => {
    try {
      setLoading(true)
      // 2초 타임아웃으로 더 빠르게
      const timeoutPromise = new Promise<User | null>((_, reject) => 
        setTimeout(() => reject(new Error('User refresh timeout')), 2000)
      )
      const userPromise = auth.getCurrentUser()
      
      const currentUser = await Promise.race([userPromise, timeoutPromise])
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
      const { data, error } = await withAuthTimeout(auth.signIn(email, password))

      if (error) {
        return { error }
      }

      // 사용자 정보 새로고침
      await refreshUser()

      // 세션 정보 로컬 스토리지에 저장
      if (data?.session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(data.session))
      }

      // 로그인 성공 후 즉시 리다이렉트 시도
      const currentUser = await auth.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        // 약간의 지연 후 리다이렉트
        setTimeout(() => {
          redirectToDashboard(currentUser.role)
        }, 500)
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

    // 초기 사용자 상태 확인 (빠른 로딩)
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

        // 1초 타임아웃으로 빠른 세션 체크
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 1000)
        )

        try {
          const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
          
          if (session?.user && mounted) {
            // 사용자 정보도 빠르게 가져오기 (1초 타임아웃)
            const userPromise = auth.getCurrentUser()
            const userTimeoutPromise = new Promise<User | null>((_, reject) => 
              setTimeout(() => reject(new Error('User timeout')), 1000)
            )
            
            try {
              const currentUser = await Promise.race([userPromise, userTimeoutPromise])
              setUser(currentUser)
            } catch (userError) {
              console.warn('User fetch timeout, using basic session info')
              // 기본 사용자 정보로 폴백
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: 'customer',
                isActive: true,
                name: session.user.email?.split('@')[0] || '사용자'
              })
            }
          } else if (mounted) {
            setUser(null)
          }
        } catch (sessionError) {
          console.warn('Session fetch timeout')
          if (mounted) {
            setUser(null)
          }
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

    // 최대 2초 후에는 무조건 로딩 완료
    const maxLoadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Force completing auth loading after 2 seconds')
        setLoading(false)
      }
    }, 2000)

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
              // 세션이 있지만 사용자 정보를 가져올 수 없는 경우, 재시도
              setTimeout(async () => {
                try {
                  const retryUser = await auth.getCurrentUser()
                  setUser(retryUser)
                } catch (retryError) {
                  console.error('Retry failed, signing out:', retryError)
                  setUser(null)
                }
              }, 2000)
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            try {
              const currentUser = await auth.getCurrentUser()
              setUser(currentUser)
            } catch (error) {
              console.error('Error getting user after token refresh:', error)
              // 토큰 갱신 후 사용자 정보 가져오기 실패 시 재시도
              setTimeout(async () => {
                try {
                  const retryUser = await auth.getCurrentUser()
                  setUser(retryUser)
                } catch (retryError) {
                  console.error('Token refresh retry failed:', retryError)
                }
              }, 1000)
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
      clearTimeout(maxLoadingTimeout)
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
        console.log('🔄 Redirecting from login/signup page...')
        redirectToDashboard(user.role)
      }
      // 루트 경로에서도 대시보드로 리다이렉트 (로그인된 사용자의 경우)
      else if (currentPath === '/') {
        console.log('🔄 Redirecting from root page...')
        redirectToDashboard(user.role)
      }
    }
  }, [user, loading])

  const redirectToDashboard = (role: string) => {
    console.log('🔄 Redirecting user with role:', role)
    console.log('🔍 User object:', user)

    let targetPath = '/login'
    
    switch (role) {
      case 'doctor':
        targetPath = '/dashboard/doctor'
        break
      case 'customer':
        targetPath = '/dashboard/customer'
        break
      case 'admin':
        targetPath = '/dashboard/admin'
        break
      default:
        console.warn('Unknown role:', role)
        targetPath = '/login'
    }

    console.log('➡️ Navigating to:', targetPath)

    // Next.js router와 window.location 둘 다 시도
    router.push(targetPath)
    
    // 만약 router.push가 실패하면 window.location으로 강제 이동
    setTimeout(() => {
      if (window.location.pathname !== targetPath) {
        console.log('🔄 Router.push failed, using window.location')
        window.location.href = targetPath
      }
    }, 1000)
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