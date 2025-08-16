/**
 * 관리자 로그인 테스트 유틸리티
 */
import { auth } from './auth'
import { isSuperAdmin } from './config'

export async function testAdminLogin() {
  console.log('🧪 관리자 로그인 테스트 시작...')
  
  try {
    // 1. 관리자 이메일 권한 확인
    const adminEmails = ['admin@obdoc.com', 'jinhyucks@gmail.com']
    
    for (const email of adminEmails) {
      const isAdmin = isSuperAdmin(email)
      console.log(`✅ ${email}: ${isAdmin ? '관리자 권한 있음' : '일반 사용자'}`)
    }
    
    // 2. 더미 로그인 테스트
    const testResult = await auth.signIn('admin@obdoc.com', 'admin123')
    
    if (testResult.error) {
      console.error('❌ 로그인 실패:', testResult.error.message)
      return false
    }
    
    console.log('✅ 로그인 성공!')
    
    // 3. 현재 사용자 정보 확인
    const currentUser = await auth.getCurrentUser()
    
    if (currentUser) {
      console.log('✅ 사용자 정보:', {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        name: currentUser.name
      })
      
      if (currentUser.role === 'admin') {
        console.log('🎉 관리자 로그인 테스트 성공!')
        return true
      } else {
        console.warn('⚠️ 관리자 권한이 없습니다')
        return false
      }
    } else {
      console.error('❌ 사용자 정보를 가져올 수 없습니다')
      return false
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error)
    return false
  }
}

// 개발 환경에서만 자동 실행
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 페이지 로드 후 3초 뒤에 테스트 실행
  setTimeout(() => {
    if (window.location.pathname === '/login') {
      console.log('🔧 개발 모드: 관리자 로그인 테스트 준비됨')
      console.log('콘솔에서 testAdminLogin() 실행 가능')
      // @ts-ignore
      window.testAdminLogin = testAdminLogin
    }
  }, 3000)
}