import { supabase } from './supabase'
import { withAuthTimeout, withTimeout, getErrorMessage } from './timeoutUtils'

export interface User {
  id: string
  email?: string
  phone?: string
  role: 'doctor' | 'customer' | 'admin'
  isActive: boolean
  name?: string
  profile?: {
    phone?: string
    specialization?: string // 의사용
    licenseNumber?: string // 의사용
    birthDate?: string // 고객용
    height?: number // 고객용
  }
}

import { isDevelopment, isDummySupabase, isSuperAdmin } from './config'

// 개발 환경에서 더미 사용자 생성
const createDummyUser = (email: string, role: 'doctor' | 'customer' | 'admin' = 'customer'): User => {
  // 역할에 따른 기본 이름 설정
  let defaultName = email.split('@')[0]
  if (role === 'doctor') {
    defaultName = '김의사'
  } else if (role === 'customer') {
    defaultName = '이고객'
  } else if (role === 'admin') {
    defaultName = '관리자'
  }

  const baseUser = {
    id: `dummy-${Date.now()}`,
    email,
    name: defaultName,
    role,
    isActive: true
  }

  // 역할별 프로필 정보 추가
  switch (role) {
    case 'doctor':
      return {
        ...baseUser,
        profile: {
          specialization: '내과',
          licenseNumber: 'DOC-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          phone: '010-1234-5678'
        }
      }
    case 'customer':
      return {
        ...baseUser,
        profile: {
          birthDate: '1990-01-01',
          height: 170,
          phone: '010-9876-5432'
        }
      }
    case 'admin':
      return {
        ...baseUser,
        profile: {
          phone: '010-0000-0000'
        }
      }
    default:
      return baseUser
  }
}

// isSuperAdmin은 config.ts에서 import

// 관리자 빠른 로그인 함수
const quickAdminLogin = async (email: string): Promise<any | null> => {
  if (email === 'brandnewmedi@naver.com' || email === 'jinhyucks@gmail.com' || email === 'admin@obdoc.com') {
    console.log('⚡ ADMIN LOGIN:', email)

    // Supabase에서 사용자 정보 가져오기 (타임아웃 적용)
    const { data: { user } } = await withAuthTimeout(supabase.auth.getUser())
    if (user && user.email === email) {
      return {
        id: user.id,
        email: user.email,
        role: 'admin' as const,
        isActive: true,
        name: '관리자'
      }
    }
  }
  return null
}

export const auth = {
  async signIn(email: string, password: string) {
    try {
      // 개발 환경에서 더미 인증 처리
      if (isDevelopment && isDummySupabase) {
        console.log('개발 모드: 더미 인증 사용', { email, password })

        // 간단한 더미 인증 로직
        if (password.length < 6) {
          return {
            data: null,
            error: { message: '비밀번호는 최소 6자 이상이어야 합니다.' }
          }
        }

        // 이메일에 따른 역할 결정
        let role: 'doctor' | 'customer' | 'admin' = 'customer'
        if (email.includes('doctor') || email.includes('의사')) {
          role = 'doctor'
        } else if (email.includes('admin') || email.includes('관리자') || isSuperAdmin(email)) {
          role = 'admin'
        } else if (email.includes('customer')) {
          role = 'customer'
        }

        const dummyUser = createDummyUser(email, role)

        // 더미 세션 데이터
        const dummySession = {
          access_token: 'dummy-access-token',
          refresh_token: 'dummy-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: dummyUser.id,
            email: dummyUser.email,
            role: dummyUser.role
          }
        }

        // 토큰 만료 시간 설정 (24시간)
        const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
        localStorage.setItem('token_expiry', expiryTime.toISOString())
        localStorage.setItem('dummy_user', JSON.stringify(dummyUser))

        return {
          data: { session: dummySession, user: dummySession.user },
          error: null
        }
      }

      // 실제 Supabase 인증 (5초 타임아웃 적용)
      const { data, error } = await withAuthTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      )

      if (error) {
        console.error('Login error:', error)
        return { data: null, error }
      }

      // 슈퍼 관리자 검증 활성화
      console.log('🔧 슈퍼 관리자 검증 활성화됨')
      if (!isDummySupabase && data.user?.email && !isSuperAdmin(data.user.email)) {
        // 슈퍼 관리자가 아닌 경우 admin 역할 접근 차단
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (userProfile?.role === 'admin') {
          console.warn('🚨 무권한 관리자 접근 시도:', data.user.email)
          await supabase.auth.signOut()
          return {
            data: null,
            error: { message: '접근 권한이 없습니다.' }
          }
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Login exception:', error)
      return { data: null, error: { message: '로그인 중 오류가 발생했습니다.' } }
    }
  },

  async signOut() {
    try {
      // 개발 환경에서 더미 로그아웃 처리
      if (isDevelopment && isDummySupabase) {
        console.log('개발 모드: 더미 로그아웃')
        localStorage.removeItem('dummy_user')
        localStorage.removeItem('token_expiry')
        return { error: null }
      }

      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Logout error:', error)
      return { error: { message: '로그아웃 중 오류가 발생했습니다.' } }
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      // 🚨 무한로딩 방지: 5초 타임아웃 적용
      return await withAuthTimeout(this._getCurrentUserInternal())
    } catch (error) {
      console.error('getCurrentUser timeout or error:', error)
      return null
    }
  },

  async _getCurrentUserInternal(): Promise<User | null> {
    try {
      // 개발 환경에서 더미 사용자 반환
      if (isDevelopment && isDummySupabase) {
        const dummyUser = localStorage.getItem('dummy_user')
        if (dummyUser) {
          return JSON.parse(dummyUser)
        }
        return null
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Auth user error:', authError)
        return null
      }

      if (!user) return null

      // ⚡ 관리자 빠른 로그인 체크
      const quickAdmin = await quickAdminLogin(user.email)
      if (quickAdmin) {
        return quickAdmin
      }

      // 사용자 프로필 정보 가져오기 (doctors 또는 customers 테이블에서)
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries) {
        try {
          // 슈퍼 관리자 먼저 체크 (강화된 로직)
          console.log('🔍 Checking super admin for:', user.email)
          const isAdmin = isSuperAdmin(user.email)
          console.log('� isSuperAd min result:', isAdmin)

          if (isAdmin) {
            console.log('🔧 슈퍼 관리자로 인식됨:', user.email)
            const adminUser = {
              id: user.id,
              email: user.email,
              role: 'admin' as const,
              isActive: true,
              name: '관리자'
            }
            console.log('🔧 Returning admin user object:', adminUser)
            return adminUser
          }

          // 관리자가 아닌 경우에만 다른 테이블 확인
          console.log('🔍 Not admin, checking other tables for user:', user.id)

          // 먼저 doctors 테이블에서 찾기 (service_role 사용)
          const { data: doctorProfile, error: doctorError } = await supabase
            .from('doctors')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle() // single() 대신 maybeSingle() 사용

          console.log('🔍 Doctor query result:', { doctorProfile, doctorError })

          if (doctorProfile && !doctorError) {
            console.log('✅ Doctor profile found')
            return {
              id: user.id,
              email: user.email,
              role: 'doctor' as const,
              isActive: true,
              name: doctorProfile.hospital_name || user.email?.split('@')[0] || '의사'
            }
          }

          console.log('🔍 Attempting to fetch customer profile for user:', user.id)

          // doctors에서 찾지 못했으면 customers 테이블에서 찾기
          const { data: customerProfile, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle() // single() 대신 maybeSingle() 사용

          console.log('🔍 Customer query result:', { customerProfile, customerError })

          if (customerProfile && !customerError) {
            console.log('✅ Customer profile found')
            return {
              id: user.id,
              email: user.email,
              role: 'customer' as const,
              isActive: true,
              name: customerProfile.name || user.email?.split('@')[0] || '고객'
            }
          }

          // 🚨 프로필이 없는 경우 자동 생성
          console.warn('⚠️ User not found in doctors or customers table, creating profile automatically:', user.id)
          console.log('🔍 Email analysis:', {
            email: user.email,
            includesDoctor: user.email?.includes('doctor'),
            includesNaver: user.email?.includes('naver'),
            includesJinhyuck: user.email?.includes('jinhyuck')
          })

          // 이메일 패턴에 따른 역할 결정 및 프로필 자동 생성
          let roleToCreate: 'doctor' | 'customer' = 'customer'
          let profileData: any = {}

          if (user.email === 'jinhyucks@gmail.com' || user.email === 'brandnewmedi@naver.com') {
            console.log('🔧 Creating admin profile')
            return {
              id: user.id,
              email: user.email,
              role: 'admin' as const,
              isActive: true,
              name: '관리자'
            }
          } else if (user.email?.includes('doctor') || user.email?.includes('의사')) {
            console.log('🔧 Creating doctor profile based on email pattern')
            roleToCreate = 'doctor'
            profileData = {
              user_id: user.id,
              hospital_name: user.email?.split('@')[0] + '의원',
              hospital_type: 'clinic',
              subscription_plan: '1month',
              subscription_status: 'pending',
              is_approved: false
            }
          } else {
            console.log('🔧 Creating customer profile')
            roleToCreate = 'customer'
            profileData = {
              user_id: user.id,
              name: user.email?.split('@')[0] || '고객',
              birth_date: '1990-01-01',
              height: 170,
              initial_weight: 70,
              target_weight: 60
            }
          }

          // 프로필 자동 생성 시도
          try {
            // 먼저 users 테이블에 사용자 정보 추가
            console.log('🔧 Creating user record first')
            const { error: userError } = await supabase
              .from('users')
              .upsert({
                id: user.id,
                email: user.email,
                role: roleToCreate,
                is_active: true
              })

            if (userError) {
              console.warn('⚠️ User record creation failed, continuing with profile creation:', userError)
            }

            const tableName = roleToCreate === 'doctor' ? 'doctors' : 'customers'
            console.log(`🔧 Attempting to create ${roleToCreate} profile in ${tableName} table`)

            const { data: newProfile, error: createError } = await supabase
              .from(tableName)
              .insert(profileData)
              .select()
              .single()

            if (createError) {
              console.error('❌ Failed to create profile:', createError)
              // 생성 실패 시 기본 사용자 정보 반환
              return {
                id: user.id,
                email: user.email,
                role: roleToCreate,
                isActive: true,
                name: user.email?.split('@')[0] || (roleToCreate === 'doctor' ? '의사' : '고객')
              }
            }

            console.log('✅ Profile created successfully:', newProfile)
            return {
              id: user.id,
              email: user.email,
              role: roleToCreate,
              isActive: true,
              name: roleToCreate === 'doctor'
                ? (newProfile.hospital_name || '의사')
                : (newProfile.name || '고객')
            }

          } catch (createError) {
            console.error('❌ Exception during profile creation:', createError)
            // 예외 발생 시 기본 사용자 정보 반환
            return {
              id: user.id,
              email: user.email,
              role: roleToCreate,
              isActive: true,
              name: user.email?.split('@')[0] || (roleToCreate === 'doctor' ? '의사' : '고객')
            }
          }

        } catch (error) {
          console.error(`Profile fetch attempt ${retryCount + 1} failed:`, error)
          retryCount++

          if (retryCount < maxRetries) {
            // 재시도 전 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      console.error('Failed to fetch profile after all retries')
      return null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  async resetPassword(email: string) {
    try {
      // 개발 환경에서 더미 비밀번호 재설정
      if (isDevelopment && isDummySupabase) {
        console.log('개발 모드: 더미 비밀번호 재설정', email)
        return { error: null }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: { message: '비밀번호 재설정 중 오류가 발생했습니다.' } }
    }
  },

  async signUp(email: string, password: string, userData: any) {
    try {
      // 개발 환경에서 더미 회원가입
      if (isDevelopment && isDummySupabase) {
        console.log('개발 모드: 더미 회원가입', { email, userData })

        if (password.length < 6) {
          return {
            data: null,
            error: { message: '비밀번호는 최소 6자 이상이어야 합니다.' }
          }
        }

        const dummyUser = createDummyUser(email, userData.role || 'customer')
        localStorage.setItem('dummy_user', JSON.stringify(dummyUser))

        return {
          data: { user: dummyUser },
          error: null
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      return { data, error }
    } catch (error) {
      console.error('Signup error:', error)
      return { data: null, error: { message: '회원가입 중 오류가 발생했습니다.' } }
    }
  }
}