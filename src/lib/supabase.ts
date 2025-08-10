import { createClient } from '@supabase/supabase-js'

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 싱글톤 인스턴스 저장소 (글로벌 레벨)
declare global {
  var __supabase: any
  var __supabaseAdmin: any
}

// 글로벌 변수로 싱글톤 보장
const getGlobalSupabase = () => {
  if (typeof globalThis !== 'undefined') {
    return globalThis.__supabase
  }
  return null
}

const setGlobalSupabase = (instance: any) => {
  if (typeof globalThis !== 'undefined') {
    globalThis.__supabase = instance
  }
}

const getGlobalSupabaseAdmin = () => {
  if (typeof globalThis !== 'undefined') {
    return globalThis.__supabaseAdmin
  }
  return null
}

const setGlobalSupabaseAdmin = (instance: any) => {
  if (typeof globalThis !== 'undefined') {
    globalThis.__supabaseAdmin = instance
  }
}

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

// 클라이언트 생성 함수 (강화된 싱글톤 패턴)
const getSupabaseClient = () => {
  // 글로벌 인스턴스 확인
  const existingInstance = getGlobalSupabase()
  if (existingInstance) {
    return existingInstance
  }

  // 프로덕션 환경 변수 검증 (브라우저에서만)
  validateProductionEnvironment()

  let newInstance: any

  // 서버 사이드에서는 세션 비활성화
  if (typeof window === 'undefined') {
    if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
      newInstance = createDummySupabaseClient()
    } else {
      newInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: false
        }
      })
    }
  } else {
    // 브라우저에서 실제 클라이언트 생성
    if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
      console.warn('⚠️ 개발 모드로 실행: Supabase 환경 변수가 설정되지 않았습니다.')
      newInstance = createDummySupabaseClient()
    } else {
      console.log('✅ 실제 Supabase 클라이언트 초기화 (싱글톤)')
      newInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'obdoc-auth-token-v7', // 버전 업데이트로 기존 세션 클리어
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          // 이메일 확인 없이 즉시 로그인 허용
          flowType: 'pkce'
        }
      })
    }
  }

  // 글로벌 인스턴스로 저장
  setGlobalSupabase(newInstance)
  return newInstance
}

const getSupabaseAdminClient = () => {
  // 글로벌 관리자 인스턴스 확인
  const existingAdminInstance = getGlobalSupabaseAdmin()
  if (existingAdminInstance) {
    return existingAdminInstance
  }

  let newAdminInstance: any

  // 서버 사이드에서는 세션 비활성화
  if (typeof window === 'undefined') {
    if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
      newAdminInstance = createDummySupabaseClient()
    } else {
      newAdminInstance = createClient(
        supabaseUrl!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey!,
        {
          auth: {
            persistSession: false
          }
        }
      )
    }
  } else {
    // 브라우저에서 관리자 클라이언트 생성
    if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
      newAdminInstance = createDummySupabaseClient()
    } else {
      newAdminInstance = createClient(
        supabaseUrl!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey!,
        {
          auth: {
            persistSession: false,
            storageKey: 'obdoc-admin-auth-token-v3'
          }
        }
      )
    }
  }

  // 글로벌 관리자 인스턴스로 저장
  setGlobalSupabaseAdmin(newAdminInstance)
  return newAdminInstance
}

export const supabase = getSupabaseClient()
export const supabaseAdmin = getSupabaseAdminClient()