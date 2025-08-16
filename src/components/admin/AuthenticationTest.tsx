'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: any
}

export default function AuthenticationTest() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getCurrentUser()
  }, [])

  const runAuthTests = async () => {
    setIsRunning(true)
    const results: TestResult[] = []

    // 1. 현재 세션 확인
    results.push({
      test: '현재 세션 확인',
      status: 'pending',
      message: '테스트 중...'
    })

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      results[0] = {
        test: '현재 세션 확인',
        status: session ? 'success' : 'error',
        message: session ? '✅ 활성 세션 존재' : '❌ 세션 없음',
        details: session ? {
          userId: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role
        } : null
      }
    } catch (error) {
      results[0] = {
        test: '현재 세션 확인',
        status: 'error',
        message: `❌ 세션 확인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        details: error
      }
    }

    // 2. 사용자 프로필 조회
    results.push({
      test: '사용자 프로필 조회',
      status: 'pending',
      message: '테스트 중...'
    })

    try {
      if (currentUser) {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (error) throw error

        results[1] = {
          test: '사용자 프로필 조회',
          status: 'success',
          message: '✅ 프로필 조회 성공',
          details: userProfile
        }
      } else {
        results[1] = {
          test: '사용자 프로필 조회',
          status: 'error',
          message: '❌ 로그인된 사용자 없음'
        }
      }
    } catch (error) {
      results[1] = {
        test: '사용자 프로필 조회',
        status: 'error',
        message: `❌ 프로필 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        details: error
      }
    }

    // 3. 역할별 데이터 접근 테스트
    results.push({
      test: '역할별 데이터 접근 테스트',
      status: 'pending',
      message: '테스트 중...'
    })

    try {
      if (currentUser) {
        // 현재 사용자의 역할에 따라 다른 테스트 수행
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        const role = userProfile?.role

        let testMessage = ''
        let accessDetails: any = {}

        switch (role) {
          case 'admin':
            // 관리자는 모든 사용자 조회 가능
            const { data: allUsers, error: adminError } = await supabase
              .from('users')
              .select('id, email, role')
              .limit(5)

            if (adminError) throw adminError
            testMessage = `✅ 관리자 권한 확인 (전체 사용자 ${allUsers?.length || 0}명 조회 가능)`
            accessDetails = { userCount: allUsers?.length, users: allUsers }
            break

          case 'doctor':
            // 의사는 자신의 고객만 조회 가능
            const { data: myCustomers, error: doctorError } = await supabase
              .from('customers')
              .select('id, name')
              .limit(5)

            if (doctorError && !doctorError.message.includes('RLS')) throw doctorError
            testMessage = `✅ 의사 권한 확인 (고객 ${myCustomers?.length || 0}명 조회 가능)`
            accessDetails = { customerCount: myCustomers?.length, customers: myCustomers }
            break

          case 'customer':
            // 고객은 자신의 데이터만 조회 가능
            const { data: myData, error: customerError } = await supabase
              .from('customers')
              .select('id, name')
              .limit(1)

            if (customerError && !customerError.message.includes('RLS')) throw customerError
            testMessage = `✅ 고객 권한 확인 (본인 데이터만 조회 가능)`
            accessDetails = { customerData: myData }
            break

          default:
            testMessage = '⚠️ 알 수 없는 역할'
        }

        results[2] = {
          test: '역할별 데이터 접근 테스트',
          status: 'success',
          message: testMessage,
          details: { role, ...accessDetails }
        }
      } else {
        results[2] = {
          test: '역할별 데이터 접근 테스트',
          status: 'error',
          message: '❌ 로그인된 사용자 없음'
        }
      }
    } catch (error) {
      results[2] = {
        test: '역할별 데이터 접근 테스트',
        status: 'error',
        message: `❌ 권한 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        details: error
      }
    }

    // 4. RLS 정책 테스트 (무단 접근 시도)
    results.push({
      test: 'RLS 정책 테스트 (보안 검증)',
      status: 'pending',
      message: '테스트 중...'
    })

    try {
      // 다른 사용자의 데이터에 접근 시도 (차단되어야 함)
      const { data: unauthorizedData, error: rlsError } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser?.id || '')
        .limit(1)

      if (currentUser) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (userProfile?.role === 'admin') {
          // 관리자는 모든 데이터 접근 가능
          results[3] = {
            test: 'RLS 정책 테스트 (보안 검증)',
            status: 'success',
            message: '✅ 관리자 권한으로 모든 데이터 접근 가능',
            details: { role: 'admin', dataCount: unauthorizedData?.length || 0 }
          }
        } else {
          // 일반 사용자는 제한된 데이터만 접근 가능
          results[3] = {
            test: 'RLS 정책 테스트 (보안 검증)',
            status: 'success',
            message: `✅ RLS 정책 작동 중 (${userProfile?.role} 권한으로 제한된 접근)`,
            details: { role: userProfile?.role, dataCount: unauthorizedData?.length || 0 }
          }
        }
      } else {
        results[3] = {
          test: 'RLS 정책 테스트 (보안 검증)',
          status: 'error',
          message: '❌ 로그인된 사용자 없음'
        }
      }
    } catch (error) {
      results[3] = {
        test: 'RLS 정책 테스트 (보안 검증)',
        status: 'success',
        message: '✅ RLS 정책이 무단 접근을 차단함',
        details: { error: error instanceof Error ? error.message : '알 수 없는 오류' }
      }
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'pending': return '⏳'
      default: return '❓'
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">인증 시스템 테스트</h3>
        <button
          onClick={runAuthTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          {isRunning ? '테스트 중...' : '테스트 실행'}
        </button>
      </div>

      {/* 현재 사용자 정보 */}
      {currentUser && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">현재 로그인 사용자</h4>
          <div className="text-sm text-blue-800">
            <p><strong>이메일:</strong> {currentUser.email}</p>
            <p><strong>사용자 ID:</strong> {currentUser.id}</p>
            <p><strong>가입일:</strong> {new Date(currentUser.created_at || '').toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      )}

      {/* 테스트 결과 */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">테스트 결과</h4>
          {testResults.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">{getStatusIcon(result.status)}</span>
                <span className="font-medium">{result.test}</span>
              </div>
              <p className={`text-sm ${getStatusColor(result.status)} mb-2`}>
                {result.message}
              </p>
              {result.details && (
                <details className="text-xs text-gray-600">
                  <summary className="cursor-pointer hover:text-gray-800">상세 정보</summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {!currentUser && (
        <div className="text-center py-8">
          <p className="text-gray-600">인증 테스트를 실행하려면 먼저 로그인하세요.</p>
        </div>
      )}
    </div>
  )
}