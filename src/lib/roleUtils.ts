export type UserRole = 'doctor' | 'customer' | 'admin'

export interface RoleConfig {
  role: UserRole
  defaultRoute: string
  allowedRoutes: string[]
  restrictedRoutes: string[]
}

// 역할별 설정
export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  doctor: {
    role: 'doctor',
    defaultRoute: '/dashboard/doctor',
    allowedRoutes: [
      '/dashboard/doctor',
      '/dashboard/doctor/*',
      '/community',
      '/community/*',
      '/profile',
      '/settings'
    ],
    restrictedRoutes: [
      '/dashboard/customer',
      '/dashboard/customer/*',
      '/dashboard/admin',
      '/dashboard/admin/*',
      '/dashboard/customer',
      '/dashboard/customer/*'
    ]
  },
  customer: {
    role: 'customer',
    defaultRoute: '/dashboard/customer',
    allowedRoutes: [
      '/dashboard/customer',
      '/dashboard/customer/*',
      '/community',
      '/community/*',
      '/profile',
      '/settings'
    ],
    restrictedRoutes: [
      '/dashboard/doctor',
      '/dashboard/doctor/*',
      '/dashboard/admin',
      '/dashboard/admin/*'
    ]
  },
  admin: {
    role: 'admin',
    defaultRoute: '/dashboard/admin',
    allowedRoutes: [
      '/dashboard/admin',
      '/dashboard/admin/*',
      '/dashboard/doctor',
      '/dashboard/doctor/*',
      '/dashboard/customer',
      '/dashboard/customer/*',
      '/community',
      '/community/*',
      '/profile',
      '/settings'
    ],
    restrictedRoutes: []
  }
}

// 공개 라우트 (인증 불필요)
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/unauthorized'
]

// 인증 필요 라우트
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/*',
  '/community',
  '/community/*',
  '/profile',
  '/settings'
]

/**
 * 사용자 역할에 따른 기본 대시보드 경로 반환
 */
export function getDefaultDashboardRoute(role: UserRole): string {
  return ROLE_CONFIGS[role].defaultRoute
}

/**
 * 경로가 특정 역할에 허용되는지 확인
 */
export function isRouteAllowed(path: string, role: UserRole): boolean {
  const config = ROLE_CONFIGS[role]
  
  // 허용된 라우트 확인
  const isAllowed = config.allowedRoutes.some(route => {
    if (route.endsWith('/*')) {
      const basePath = route.slice(0, -2)
      return path.startsWith(basePath)
    }
    return path === route
  })
  
  // 제한된 라우트 확인
  const isRestricted = config.restrictedRoutes.some(route => {
    if (route.endsWith('/*')) {
      const basePath = route.slice(0, -2)
      return path.startsWith(basePath)
    }
    return path === route
  })
  
  return isAllowed && !isRestricted
}

/**
 * 경로가 공개 라우트인지 확인
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/*')) {
      const basePath = route.slice(0, -2)
      return path.startsWith(basePath)
    }
    return path === route
  })
}

/**
 * 경로가 보호된 라우트인지 확인
 */
export function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some(route => {
    if (route.endsWith('/*')) {
      const basePath = route.slice(0, -2)
      return path.startsWith(basePath)
    }
    return path === route
  })
}

/**
 * 사용자를 적절한 대시보드로 리다이렉트할 경로 결정
 */
export function getRedirectPath(role: UserRole, currentPath: string): string | null {
  // 공개 라우트면 리다이렉트 불필요
  if (isPublicRoute(currentPath)) {
    return null
  }
  
  // 현재 경로가 허용되면 리다이렉트 불필요
  if (isRouteAllowed(currentPath, role)) {
    return null
  }
  
  // 허용되지 않으면 기본 대시보드로 리다이렉트
  return getDefaultDashboardRoute(role)
}

/**
 * 헤더용 전역 네비게이션 메뉴 항목 반환 (대시보드 메뉴 제외)
 */
export function getNavigationItems(role: UserRole) {
  // 모든 역할에서 커뮤니티는 메인 헤더에 표시
  return [
    {
      name: '커뮤니티',
      href: '/community',
      icon: 'MessageCircle'
    },
    {
      name: '프로필',
      href: '/profile',
      icon: 'User'
    }
  ]
}

/**
 * 대시보드 내부용 네비게이션 메뉴 항목 반환
 * 헤더에 있는 메뉴와 중복되지 않도록 대시보드 전용 기능들만 포함
 */
export function getDashboardNavigationItems(role: UserRole) {
  switch (role) {
    case 'doctor':
      return [
        {
          name: '고객 관리',
          href: '/dashboard/doctor/customers',
          icon: 'Users'
        },
        {
          name: '예약 관리',
          href: '/dashboard/doctor/appointments',
          icon: 'Calendar'
        }
      ]
    
    case 'customer':
      return [
        {
          name: '내 예약',
          href: '/dashboard/customer/appointments',
          icon: 'Calendar'
        },
        {
          name: '건강 기록',
          href: '/dashboard/customer/health',
          icon: 'Activity'
        }
      ]
    
    case 'admin':
      return [
        {
          name: '사용자 관리',
          href: '/admin/users',
          icon: 'Users'
        },
        {
          name: '시스템 설정',
          href: '/admin/settings',
          icon: 'Settings'
        }
      ]
    
    default:
      return []
  }
}