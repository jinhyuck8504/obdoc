import { NextRequest } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getConfig } from './config'

// 서버 사이드 Supabase 클라이언트 생성
export function createServerClient() {
  const config = getConfig()
  return createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey, // 서비스 롤 키 사용
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Next.js 13+ App Router용 인증 클라이언트
export function createAuthClient() {
  return createServerComponentClient({ cookies })
}

// 관리자 권한 확인
export async function verifyAdminAuth(request?: NextRequest) {
  try {
    const supabase = createAuthClient()
    
    // 현재 세션 가져오기
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      throw new Error('인증이 필요합니다')
    }

    const user = session.user
    
    // 관리자 권한 확인
    const config = getConfig()
    const isSuperAdmin = user.email === config.superAdmin.email
    
    if (!isSuperAdmin) {
      // 데이터베이스에서 관리자 역할 확인
      const serverClient = createServerClient()
      const { data: userProfile, error: profileError } = await serverClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profileError || userProfile?.role !== 'admin') {
        throw new Error('관리자 권한이 필요합니다')
      }
    }
    
    return user
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '권한 확인 중 오류가 발생했습니다')
  }
}

// API 라우트용 인증 확인
export async function verifyApiAuth(request: NextRequest) {
  try {
    // Authorization 헤더 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('인증 토큰이 필요합니다')
    }
    
    const token = authHeader.substring(7)
    const supabase = createServerClient()
    
    // 토큰으로 사용자 확인
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new Error('유효하지 않은 토큰입니다')
    }
    
    return user
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'API 인증 실패')
  }
}

// 쿠키 기반 인증 (브라우저용)
export async function verifyCookieAuth() {
  try {
    const supabase = createAuthClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      throw new Error('로그인이 필요합니다')
    }
    
    return user
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '인증 확인 실패')
  }
}