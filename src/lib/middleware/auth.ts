/**
 * 인증 미들웨어
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'doctor' | 'customer'
}

/**
 * JWT 토큰에서 사용자 정보 추출
 */
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      role: (user.user_metadata?.role || 'customer') as AuthUser['role']
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return null
  }
}

/**
 * 요청에서 인증 토큰 추출
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 쿠키에서도 확인
  const tokenCookie = request.cookies.get('auth-token')
  if (tokenCookie) {
    return tokenCookie.value
  }

  return null
}

/**
 * 인증 필수 미들웨어
 */
export function requireAuth(allowedRoles?: AuthUser['role'][]) {
  return async (request: NextRequest): Promise<NextResponse | { user: AuthUser }> => {
    const token = extractToken(request)
    
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user) {
      return new NextResponse('Invalid token', { status: 401 })
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    return { user }
  }
}

/**
 * 관리자 권한 필수
 */
export const requireAdmin = () => requireAuth(['admin'])

/**
 * 의사 권한 필수
 */
export const requireDoctor = () => requireAuth(['doctor', 'admin'])

/**
 * 로그인 사용자 (모든 역할)
 */
export const requireUser = () => requireAuth(['admin', 'doctor', 'customer'])

/**
 * API 핸들러에 인증 미들웨어 적용
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthUser, ...args: T) => Promise<NextResponse>,
  authMiddleware = requireUser()
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await authMiddleware(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    return handler(request, authResult.user, ...args)
  }
}

/**
 * 선택적 인증 (토큰이 있으면 검증, 없어도 통과)
 */
export async function optionalAuth(request: NextRequest): Promise<AuthUser | null> {
  const token = extractToken(request)
  
  if (!token) {
    return null
  }

  return getUserFromToken(token)
}

export default requireAuth