import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 클라이언트 전용 싱글톤 인스턴스
let clientInstance: SupabaseClient | null = null
let adminClientInstance: SupabaseClient | null = null

// 인스턴스 생성 플래그
let isCreatingInstance = false
let isCreatingAdminInstance = false

// 프로덕션 환경 변수 검증
const validateProductionEnvironment = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const missingVars: string[] = []

    if (!supabaseUrl || supabaseUrl.includes('your_supabase_url_here') || supabaseUrl.startsWith('missing_')) {
      missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    }

    if (!supabaseAnonKey || supabaseAnonKey.includes('your_supabase_anon_key_here') || supabaseAnonKey.startsWith('missing_')) {
      missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    if (missingVars.length > 0) {
      console.error('🚨 환경 변수 설정 오류:')
      missingVars.forEach(varName => {
        console.error(`  - ${varName}이 설정되지 않았습니다.`)
      })
      console.error(' 📝 해결 방법:')
      console.error('  1. Supabase 프로젝트를 생성하세요.')
      console.error('  2. Netlify 환경 변수에 실제 값을 설정하세요.')
      console.error('  3. 애플리케이션을 다시 배포하세요.')

      throw new Error('프로덕션 환경에서 환경 변수가 올바르게 설정되지 않았습니다.')
    }
  }
}

// 슈퍼 관리자 검증 함수

// 유효한 환경 변수인지 확인하는 함수
const isValidSupabaseConfig = (url?: string, key?: string): boolean => {
  if (!url || !key) return false
  if (url.includes('your_supabase_url_here') || key.includes('your_supabase_anon_key_here')) return false
  if (url.startsWith('missing_') || key.startsWith('missing_')) return false
  try {
    new URL(url) // URL 유효성 검사
    return true
  } catch {
    return false
  }
}

// 더미 클라이언트 (환경 변수가 없을 때)
const createDummySupabaseClient = () => {
  console.log('🚀 개발 모드: 더미 Supabase 클라이언트 사용')

  return {
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase가 설정되지 않았습니다.' } }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      signUp: async () => ({ data: null, error: { message: 'Supabase가 설정되지 않았습니다.' } })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          order: () => ({ data: [], error: null })
        }),
        insert: async () => ({ data: null, error: null }),
        update: () => ({
          eq: () => ({ data: null, error: null })
        }),
        order: () => ({ data: [], error: null })
      }),
      insert: async () => ({ data: null, error: null }),
      update: () => ({
        eq: () => ({ data: null, error: null })
      })
    })
  }
}

// 완전한 싱글톤 패턴으로 클라이언트 생성
const getSupabaseClient = (): SupabaseClient => {
  // 서버 사이드에서는 매번 새 인스턴스 생성 (세션 없음)
  if (typeof window === 'undefined') {
    if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
      return createDummySupabaseClient() as SupabaseClient
    }
    
    return createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  }

  // 클라이언트 사이드에서만 싱글톤 적용
  if (clientInstance) {
    return clientInstance
  }

  // 중복 생성 방지
  if (isCreatingInstance) {
    // 생성 중이면 잠시 대기 후 재시도
    return new Promise<SupabaseClient>((resolve) => {
      const checkInstance = () => {
        if (clientInstance) {
          resolve(clientInstance)
        } else {
          setTimeout(checkInstance, 10)
        }
      }
      checkInstance()
    }) as any
  }

  isCreatingInstance = true

  try {
    // 프로덕션 환경 변수 검증
    validateProductionEnvironment()

    if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
      console.warn('⚠️ 개발 모드로 실행: Supabase 환경 변수가 설정되지 않았습니다.')
      clientInstance = createDummySupabaseClient() as SupabaseClient
    } else {
      console.log('✅ 실제 Supabase 클라이언트 초기화 (완전한 싱글톤)')
      clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'obdoc-auth-token-v9', // 새 버전으로 기존 세션 클리어
          storage: window.localStorage,
          flowType: 'pkce'
        }
      })
    }
  } finally {
    isCreatingInstance = false
  }

  return clientInstance
}

const getSupabaseAdminClient = (): SupabaseClient => {
  // 서버 사이드에서는 매번 새 인스턴스 생성
  if (typeof window === 'undefined') {
    if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
      return createDummySupabaseClient() as SupabaseClient
    }
    
    return createClient(
      supabaseUrl!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    )
  }

  // 클라이언트 사이드에서만 싱글톤 적용
  if (adminClientInstance) {
    return adminClientInstance
  }

  // 중복 생성 방지
  if (isCreatingAdminInstance) {
    return new Promise<SupabaseClient>((resolve) => {
      const checkInstance = () => {
        if (adminClientInstance) {
          resolve(adminClientInstance)
        } else {
          setTimeout(checkInstance, 10)
        }
      }
      checkInstance()
    }) as any
  }

  isCreatingAdminInstance = true

  try {
    if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
      adminClientInstance = createDummySupabaseClient() as SupabaseClient
    } else {
      console.log('✅ Supabase 관리자 클라이언트 초기화 (완전한 싱글톤)')
      adminClientInstance = createClient(
        supabaseUrl!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey!,
        {
          auth: {
            persistSession: false,
            storageKey: 'obdoc-admin-auth-token-v5'
          }
        }
      )
    }
  } finally {
    isCreatingAdminInstance = false
  }

  return adminClientInstance
}

export const supabase = getSupabaseClient()
export const supabaseAdmin = getSupabaseAdminClient()