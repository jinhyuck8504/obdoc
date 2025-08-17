import { createClient } from '@supabase/supabase-js'
import { getConfig, isDummySupabase } from './config'

// 환경 설정 가져오기
const config = getConfig()

// 더미 프로젝트 감지 및 경고
if (isDummySupabase()) {
  console.warn('🚨 더미 Supabase URL이 감지되었습니다.')
  console.warn('SUPABASE_SETUP_GUIDE.md 파일을 참조하여 실제 Supabase 프로젝트를 설정하세요.')
} else {
  console.log('✅ Supabase 클라이언트가 실제 프로젝트와 연결되었습니다.')
}

// Supabase 클라이언트 생성 (간단한 싱글톤)
export const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'obdoc-mvp@1.0.0'
    }
  }
})

// API 라우트에서 사용할 클라이언트 생성 함수
export function createClient() {
  return supabase
}

// 프로덕션 환경 검증
export function validateProductionEnvironment(): boolean {
  try {
    if (isDummySupabase()) {
      console.error('❌ 더미 Supabase URL이 설정되어 있습니다.')
      return false
    }

    if (!config.supabase.url.includes('.supabase.co')) {
      console.error('❌ 올바르지 않은 Supabase URL 형식입니다.')
      return false
    }

    console.log('✅ 프로덕션 환경 검증 완료')
    return true
  } catch (error) {
    console.error('❌ 환경 검증 중 오류 발생:', error)
    return false
  }
}

// 연결 테스트
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      console.error('❌ Supabase 연결 테스트 실패:', error.message)
      return false
    }

    console.log('✅ Supabase 연결 테스트 성공')
    return true
  } catch (error) {
    console.error('❌ Supabase 연결 테스트 중 오류:', error)
    return false
  }
}