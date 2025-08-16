'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AccessTestResult {
  table: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  expected: 'ALLOW' | 'DENY'
  actual: 'ALLOW' | 'DENY' | 'PENDING'
  message: string
  details?: any
}

interface UserRole {
  id: string
  email: string
  role: 'admin' | 'doctor' | 'customer'
}

export default function RoleBasedAccessTest() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [testResults, setTestResults] = useState<AccessTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserRole(profile as UserRole)
        }
      }
    }
    getCurrentUser()
  }, [])

  const runRoleBasedTests = async () => {
    if (!currentUser || !userRole) return

    setIsRunning(true)
    const results: AccessTestResult[] = []

    // 역할별 예상 권한 정의
    const getExpectedAccess = (table: string, operation: string, role: string) => {
      const permissions: Record<string, Record<string, Record<string, 'ALLOW' | 'DENY'>>> = {
        admin: {
          users: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' },
          doctors: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' },
          customers: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' },
          weight_records: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' },
          appointments: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' },
          community_posts: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' },
          hospital_signup_codes: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' }
        },
        doctor: {
          users: { SELECT: 'DENY', INSERT: 'DENY', UPDATE: 'DENY', DELETE: 'DENY' },
          doctors: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'DENY' },
          customers: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'DENY' },
          weight_records: { SELECT: 'ALLOW', INSERT: 'DENY', UPDATE: 'ALLOW', DELETE: 'DENY' },
          appointments: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' },
          community_posts: { SELECT: 'DENY', INSERT: 'DENY', UPDATE: 'DENY', DELETE: 'DENY' },
          hospital_signup_codes: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' }
        },
        customer: {
          users: { SELECT: 'DENY', INSERT: 'DENY', UPDATE: 'DENY', DELETE: 'DENY' },
          doctors: { SELECT: 'DENY', INSERT: 'DENY', UPDATE: 'DENY', DELETE: 'DENY' },
          customers: { SELECT: 'ALLOW', INSERT: 'DENY', UPDATE: 'ALLOW', DELETE: 'DENY' },
          weight_records: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' },
          appointments: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'DENY' },
          community_posts: { SELECT: 'ALLOW', INSERT: 'ALLOW', UPDATE: 'ALLOW', DELETE: 'ALLOW' },
          hospital_signup_codes: { SELECT: 'DENY', INSERT: 'DENY', UPDATE: 'DENY', DELETE: 'DENY' }
        }
      }

      return permissions[role]?.[table]?.[operation] || 'DENY'
    }

    // 테스트할 테이블과 작업 정의
    const testCases = [
      { table: 'users', operation: 'SELECT' as const },
      { table: 'doctors', operation: 'SELECT' as const },
      { table: 'customers', operation: 'SELECT' as const },
      { table: 'weight_records', operation: 'SELECT' as const },
      { table: 'appointments', operation: 'SELECT' as const },
      { table: 'community_posts', operation: 'SELECT' as const },
      { table: 'hospital_signup_codes', operation: 'SELECT' as const }
    ]

    for (const testCase of testCases) {
      const expected = getExpectedAccess(testCase.table, testCase.operation, userRole.role)
      
      try {
        const { data, error } = await supabase
          .from(testCase.table)
          .select('*')
          .limit(1)

        let actual: 'ALLOW' | 'DENY' = 'DENY'
        let message = ''
        let details: any = null

        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('RLS')) {
            actual = 'DENY'
            message = `❌ RLS 정책에 의해 차단됨`
            details = { error: error.message }
          } else {
            actual = 'DENY'
            message = `❌ 오류 발생: ${error.message}`
            details = { error }
          }
        } else {
          actual = 'ALLOW'
          message = `✅ 접근 허용 (${data?.length || 0}개 레코드)`
          details = { recordCount: data?.length || 0 }
        }

        results.push({
          table: testCase.table,
          operation: testCase.operation,
          expected,
          actual,
          message,
          details
        })

      } catch (error) {
        results.push({
          table: testCase.table,
          operation: testCase.operation,
          expected,
          actual: 'DENY',
          message: `❌ 예외 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          details: { error }
        })
      }
    }

    // 특별한 권한 테스트 (관리자가 아닌 경우)
    if (userRole.role !== 'admin') {
      try {
        // 다른 사용자의 데이터에 접근 시도
        const { data: otherUsers, error } = await supabase
          .from('users')
          .select('id, email')
          .neq('id', currentUser.id)
          .limit(1)

        results.push({
          table: 'users (타인 데이터)',
          operation: 'SELECT',
          expected: 'DENY',
          actual: error ? 'DENY' : 'ALLOW',
          message: error 
            ? `✅ 타인 데이터 접근 차단됨` 
            : `⚠️ 타인 데이터 접근 허용됨 (${otherUsers?.length || 0}개)`,
          details: { error: error?.message, data: otherUsers }
        })
      } catch (error) {
        results.push({
          table: 'users (타인 데이터)',
          operation: 'SELECT',
          expected: 'DENY',
          actual: 'DENY',
          message: '✅ 타인 데이터 접근 차단됨',
          details: { error: error instanceof Error ? error.message : '알 수 없는 오류' }
        })
      }
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const getResultIcon = (expected: string, actual: string) => {
    if (actual === 'PENDING') return '⏳'
    if (expected === actual) return '✅'
    return '❌'
  }

  const getResultColor = (expected: string, actual: string) => {
    if (actual === 'PENDING') return 'text-yellow-600'
    if (expected === actual) return 'text-green-600'
    return 'text-red-600'
  }

  const passedTests = testResults.filter(r => r.expected === r.actual).length
  const totalTests = testResults.length

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">역할별 접근 권한 테스트</h3>
          {userRole && (
            <p className="text-sm text-gray-600 mt-1">
              현재 역할: <span className="font-medium text-blue-600">{userRole.role}</span>
            </p>
          )}
        </div>
        <button
          onClick={runRoleBasedTests}
          disabled={isRunning || !userRole}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
        >
          {isRunning ? '테스트 중...' : '권한 테스트'}
        </button>
      </div>

      {/* 테스트 결과 요약 */}
      {testResults.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">테스트 결과 요약</span>
            <span className={`font-bold ${passedTests === totalTests ? 'text-green-600' : 'text-red-600'}`}>
              {passedTests}/{totalTests} 통과
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                passedTests === totalTests ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${(passedTests / totalTests) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 테스트 결과 상세 */}
      {testResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">상세 테스트 결과</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">테이블</th>
                  <th className="text-left py-2">작업</th>
                  <th className="text-left py-2">예상</th>
                  <th className="text-left py-2">실제</th>
                  <th className="text-left py-2">결과</th>
                  <th className="text-left py-2">메시지</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 font-mono text-xs">{result.table}</td>
                    <td className="py-2">{result.operation}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.expected === 'ALLOW' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.expected}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.actual === 'ALLOW' ? 'bg-green-100 text-green-800' : 
                        result.actual === 'DENY' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.actual}
                      </span>
                    </td>
                    <td className="py-2 text-lg">
                      {getResultIcon(result.expected, result.actual)}
                    </td>
                    <td className={`py-2 text-xs ${getResultColor(result.expected, result.actual)}`}>
                      {result.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!userRole && (
        <div className="text-center py-8">
          <p className="text-gray-600">권한 테스트를 실행하려면 먼저 로그인하세요.</p>
        </div>
      )}
    </div>
  )
}