/**
 * 환경 변수 검증 및 설정 관리
 */

interface Config {
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
  }
  app: {
    url: string
    environment: 'development' | 'production' | 'test'
  }
  admin: {
    email: string
    secret: string
  }
}

/**
 * 필수 환경 변수 검증
 */
function validateEnvironmentVariables(): Config {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  // 더미 URL 체크
  const isDummySupabase = 
    requiredVars.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy-project') ||
    requiredVars.NEXT_PUBLIC_SUPABASE_URL?.includes('your-supabase-url') ||
    requiredVars.NEXT_PUBLIC_SUPABASE_URL?.includes('your_supabase_url_here')

  const environment = process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development'

  // 프로덕션에서 더미 URL 사용 시 경고
  if (environment === 'production' && isDummySupabase) {
    console.warn('⚠️ Production environment detected with dummy Supabase URL!')
  }

  return {
    supabase: {
      url: requiredVars.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: requiredVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    app: {
      url: requiredVars.NEXT_PUBLIC_APP_URL!,
      environment
    },
    admin: {
      email: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@obdoc.com',
      secret: process.env.NEXT_PUBLIC_SUPER_ADMIN_SECRET || 'obdoc-admin-2024'
    }
  }
}

/**
 * 설정 객체 (싱글톤)
 */
let config: Config | null = null

export function getConfig(): Config {
  if (!config) {
    config = validateEnvironmentVariables()
  }
  return config
}

/**
 * 환경별 설정 확인
 */
export function isDevelopment(): boolean {
  return getConfig().app.environment === 'development'
}

export function isProduction(): boolean {
  return getConfig().app.environment === 'production'
}

export function isDummySupabase(): boolean {
  const url = getConfig().supabase.url
  return url.includes('dummy-project') || 
         url.includes('your-supabase-url') || 
         url.includes('your_supabase_url_here')
}

/**
 * 관리자 권한 확인
 */
export function isSuperAdmin(email?: string): boolean {
  if (!email) return false
  
  const config = getConfig()
  
  // 개발 환경이거나 더미 Supabase 사용 시 특정 이메일 허용
  if (isDevelopment() || isDummySupabase()) {
    return email === 'jinhyucks@gmail.com' || email === 'brandnewmedi@naver.com' || email === 'admin@obdoc.com'
  }
  
  // 프로덕션에서는 환경 변수 기반 검증
  return email === config.admin.email && config.admin.secret === 'obdoc-admin-2024'
}

export default getConfig