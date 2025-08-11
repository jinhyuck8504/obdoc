import { createClient } from '@supabase/supabase-js'

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 강화된 싱글톤 인스턴스 저장소
declare global {
  var __supabase: any
  var __supabaseAdmin: any
  var __supabaseInstanceCount: number
  var __supabaseAdminInstanceCount: number
}

// 인스턴스 카운터 초기화
if (typeof globalThis !== 'undefined') {
  globalThis.__supabaseInstanceCount = globalThis.__supabaseInstanceCount || 0
  globalThis.__supabaseAdminInstanceCount = globalThis.__supabaseAdminInstanceCount || 0
}

// 강화된 싱글톤 관리 클래스
class SupabaseSingleton {
  private static instance: any = null
  private static adminInstance: any = null
  private static instanceId: string | null = null
  private static adminInstanceId: string | null = null

  static getInstance() {
    // 글로벌 인스턴스 확인
    if (typeof globalThis !== 'undefined' && globalThis.__supabase) {
      if (!this.instance) {
        this.instance = globalThis.__supabase
      }
      return this.instance
    }
    return null
  }

  static setInstance(instance: any) {
    if (typeof globalThis !== 'undefined') {
      // 기존 인스턴스가 있다면 경고
      if (globalThis.__supabase && globalThis.__supabase !== instance) {
        console.warn('⚠️ Supabase 클라이언트 인스턴스가 교체됩니다. 이는 예상치 못한 동작을 일으킬 수 있습니다.')
      }
      
      globalThis.__supabase = instance
      globalThis.__supabaseInstanceCount = (globalThis.__supabaseInstanceCount || 0) + 1
      
      // 인스턴스 ID 생성
      this.instanceId = `supabase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log(`✅ Supabase 클라이언트 인스턴스 생성 (ID: ${this.instanceId}, Count: ${globalThis.__supabaseInstanceCount})`)
    }
    this.instance = instance
  }

  static getAdminInstance() {
    if (typeof globalThis !== 'undefined' && globalThis.__supabaseAdmin) {
      if (!this.adminInstance) {
        this.adminInstance = globalThis.__supabaseAdmin
      }
      return this.adminInstance
    }
    return null
  }

  static setAdminInstance(instance: any) {
    if (typeof globalThis !== 'undefined') {
      if (globalThis.__supabaseAdmin && globalThis.__supabaseAdmin !== instance) {
        console.warn('⚠️ Supabase 관리자 클라이언트 인스턴스가 교체됩니다.')
      }
      
      globalThis.__supabaseAdmin = instance
      globalThis.__supabaseAdminInstanceCount = (globalThis.__supabaseAdminInstanceCount || 0) + 1
      
      this.adminInstanceId = `supabase-admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log(`✅ Supabase 관리자 클라이언트 인스턴스 생성 (ID: ${this.adminInstanceId}, Count: ${globalThis.__supabaseAdminInstanceCount})`)
    }
    this.adminInstance = instance
  }

  static getInstanceCount() {
    return typeof globalThis !== 'undefined' ? globalThis.__supabaseInstanceCount || 0 : 0
  }

  static getAdminInstanceCount() {
    return typeof globalThis !== 'undefined' ? globalThis.__supabaseAdminInstanceCount || 0 : 0
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

// 강화된 싱글톤 패턴으로 클라이언트 생성
const getSupabaseClient = () => {
  // 기존 인스턴스 확인
  const existingInstance = SupabaseSingleton.getInstance()
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
      // 중복 인스턴스 생성 방지 체크
      const currentCount = SupabaseSingleton.getInstanceCount()
      if (currentCount > 0) {
        console.warn(`⚠️ Supabase 클라이언트가 이미 ${currentCount}번 생성되었습니다. 싱글톤 패턴을 확인하세요.`)
      }
      
      console.log('✅ 실제 Supabase 클라이언트 초기화 (강화된 싱글톤)')
      newInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'obdoc-auth-token-v8', // 버전 업데이트로 기존 세션 클리어
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          flowType: 'pkce'
        }
      })
    }
  }

  // 강화된 싱글톤으로 저장
  SupabaseSingleton.setInstance(newInstance)
  return newInstance
}

const getSupabaseAdminClient = () => {
  // 기존 관리자 인스턴스 확인
  const existingAdminInstance = SupabaseSingleton.getAdminInstance()
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
      // 중복 관리자 인스턴스 생성 방지 체크
      const currentAdminCount = SupabaseSingleton.getAdminInstanceCount()
      if (currentAdminCount > 0) {
        console.warn(`⚠️ Supabase 관리자 클라이언트가 이미 ${currentAdminCount}번 생성되었습니다.`)
      }
      
      newAdminInstance = createClient(
        supabaseUrl!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey!,
        {
          auth: {
            persistSession: false,
            storageKey: 'obdoc-admin-auth-token-v4'
          }
        }
      )
    }
  }

  // 강화된 싱글톤으로 저장
  SupabaseSingleton.setAdminInstance(newAdminInstance)
  return newAdminInstance
}

export const supabase = getSupabaseClient()
export const supabaseAdmin = getSupabaseAdminClient()