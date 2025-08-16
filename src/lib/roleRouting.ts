import { User } from './auth'

export type UserRole = 'doctor' | 'customer' | 'admin'

export interface RouteConfig {
  path: string
  allowedRoles: UserRole[]
  redirectTo?: string
}

// 역할별 기본 대시보드 경로
export const DEFAULT_ROUTES: Record<UserRole, string> = {
  doctor: '/dashboard/doctor',
  customer: '/dashboard/customer',
  admin: '/dashboard/admin'
}

// 보호된 라우트 설정
export const PROTECTED_ROUTES: RouteConfig[] = [
  // 의사 전용 라우트
  {
    path: '/dashboard/doctor',
    allowedRoles: ['doctor'],
    redirectTo: '/unauthorized'
  },

  
  // 고객 전용 라우트
  {
    path: '/dashboard/customer',
    allowedRoles: ['customer'],
    redirectTo: '/unauthorized'
  },
  
  // 관리자 전용 라우트
  {
    path: '/dashboard/admin',
    allowedRoles: ['admin'],
    redirectTo: '/unauthorized'
  },
  {
    path: '/admin.html',
    allowedRoles: ['admin'],
    redirectTo: '/unauthorized'
  },
  
  // 공통 인증 필요 라우트
  {
    path: '/community',
    allowedRoles: ['doctor', 'customer'],
    redirectTo: '/login'
  }
]

// 공개 라우트 (인증 불필요)
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/unauthorized'
]

/**
 * 사용자 역할에 따른 기본 대시보드 경로 반환
 */
export function getDefaultRoute(role: UserRole): string {
  return DEFAULT_ROUTES[role] || '/login'
}

/**
 * 현재 경로에 대한 접근 권한 확인
 */
export function checkRouteAccess(path: string, user: User | null): {
  hasAccess: boolean
  redirectTo?: string
  requiresAuth: boolean
} {
  // 공개 라우트 체크
  if (PUBLIC_ROUTES.includes(path)) {
    return { hasAccess: true, requiresAuth: false }
  }

  // 인증되지 않은 사용자
  if (!user) {
    return { 
      hasAccess: false, 
      redirectTo: '/login',
      requiresAuth: true
    }
  }

  // 보호된 라우트 체크
  const routeConfig = PROTECTED_ROUTES.find(route => 
    path.startsWith(route.path)
  )

  if (routeConfig) {
    const hasAccess = routeConfig.allowedRoles.includes(user.role as UserRole)
    return {
      hasAccess,
      redirectTo: hasAccess ? undefined : routeConfig.redirectTo,
      requiresAuth: true
    }
  }

  // 기본적으로 인증된 사용자는 접근 가능
  return { hasAccess: true, requiresAuth: true }
}

/**
 * 사용자를 적절한 대시보드로 리다이렉트
 */
export function getRedirectPath(user: User | null, currentPath: string): string | null {
  if (!user) {
    // 로그인되지 않은 사용자는 로그인 페이지로
    if (!PUBLIC_ROUTES.includes(currentPath)) {
      return '/login'
    }
    return null
  }

  // 로그인/회원가입 페이지에 있는 인증된 사용자는 대시보드로
  if (currentPath === '/login' || currentPath === '/signup') {
    return getDefaultRoute(user.role as UserRole)
  }

  // 루트 경로의 인증된 사용자도 대시보드로
  if (currentPath === '/') {
    return getDefaultRoute(user.role as UserRole)
  }

  // 접근 권한 체크
  const { hasAccess, redirectTo } = checkRouteAccess(currentPath, user)
  if (!hasAccess && redirectTo) {
    return redirectTo
  }

  return null
}

/**
 * 역할별 네비게이션 메뉴 항목
 */
export function getNavigationItems(role: UserRole) {
  const commonItems = [
    { name: '커뮤니티', href: '/community', icon: 'MessageCircle' }
  ]

  switch (role) {
    case 'doctor':
      return [
        { name: '대시보드', href: '/dashboard/doctor', icon: 'Home' },
        { name: '고객 관리', href: '/dashboard/doctor?tab=customers', icon: 'Users' },
        { name: '예약 관리', href: '/dashboard/doctor?tab=appointments', icon: 'Calendar' },
        ...commonItems
      ]
    
    case 'customer':
      return [
        { name: '대시보드', href: '/dashboard/customer', icon: 'Home' },
        { name: '내 건강', href: '/dashboard/customer?tab=health', icon: 'Heart' },
        { name: '예약', href: '/dashboard/customer?tab=appointments', icon: 'Calendar' },
        ...commonItems
      ]
    
    case 'admin':
      return [
        { name: '관리자 대시보드', href: '/dashboard/admin', icon: 'Settings' },
        ...commonItems
      ]
    
    default:
      return []
  }
}