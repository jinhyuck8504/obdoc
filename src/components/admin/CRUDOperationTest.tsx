'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface CRUDTestResult {
  feature: string
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  status: 'pending' | 'success' | 'error' | 'skipped'
  message: string
  duration?: number
  details?: any
}

interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'doctor' | 'customer'
}

export default function CRUDOperationTest() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [testResults, setTestResults] = useState<CRUDTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<string>('all')

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
          setUserProfile(profile as UserProfile)
        }
      }
    }
    getCurrentUser()
  }, [])

  const runCRUDTests = async () => {
    if (!currentUser || !userProfile) return

    setIsRunning(true)
    const results: CRUDTestResult[] = []

    // 테스트할 기능들 정의
    const features = [
      'user_profile',
      'weight_records',
      'appointments',
      'community_posts',
      'hospital_codes'
    ]

    const featuresToTest = selectedFeature === 'all' ? features : [selectedFeature]

    for (const feature of featuresToTest) {
      switch (feature) {
        case 'user_profile':
          await testUserProfile(results)
          break
        case 'weight_records':
          await testWeightRecords(results)
          break
        case 'appointments':
          await testAppointments(results)
          break
        case 'community_posts':
          await testCommunityPosts(results)
          break
        case 'hospital_codes':
          await testHospitalCodes(results)
          break
      }
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const testUserProfile = async (results: CRUDTestResult[]) => {
    const startTime = Date.now()

    // READ: 사용자 프로필 조회
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser!.id)
        .single()

      if (error) throw error

      results.push({
        feature: '사용자 프로필',
        operation: 'READ',
        status: 'success',
        message: '✅ 프로필 조회 성공',
        duration: Date.now() - startTime,
        details: { profile: data }
      })
    } catch (error) {
      results.push({
        feature: '사용자 프로필',
        operation: 'READ',
        status: 'error',
        message: `❌ 프로필 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        duration: Date.now() - startTime,
        details: { error }
      })
    }

    // UPDATE: 사용자 프로필 수정 (last_login 업데이트)
    const updateStartTime = Date.now()
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', currentUser!.id)
        .select()

      if (error) throw error

      results.push({
        feature: '사용자 프로필',
        operation: 'UPDATE',
        status: 'success',
        message: '✅ 프로필 업데이트 성공',
        duration: Date.now() - updateStartTime,
        details: { updated: data }
      })
    } catch (error) {
      results.push({
        feature: '사용자 프로필',
        operation: 'UPDATE',
        status: 'error',
        message: `❌ 프로필 업데이트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        duration: Date.now() - updateStartTime,
        details: { error }
      })
    }
  }

  const testWeightRecords = async (results: CRUDTestResult[]) => {
    if (userProfile?.role !== 'customer') {
      results.push({
        feature: '체중 기록',
        operation: 'CREATE',
        status: 'skipped',
        message: '⏭️ 고객 역할이 아니므로 건너뜀'
      })
      return
    }

    // CREATE: 체중 기록 생성
    const createStartTime = Date.now()
    let createdRecordId: string | null = null

    try {
      // 먼저 customer 정보 확인
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', currentUser!.id)
        .single()

      if (!customerData) {
        throw new Error('고객 정보를 찾을 수 없습니다')
      }

      const { data, error } = await supabase
        .from('weight_records')
        .insert({
          customer_id: customerData.id,
          weight: 70.5,
          recorded_at: new Date().toISOString(),
          notes: 'CRUD 테스트용 기록'
        })
        .select()
        .single()

      if (error) throw error

      createdRecordId = data.id
      results.push({
        feature: '체중 기록',
        operation: 'CREATE',
        status: 'success',
        message: '✅ 체중 기록 생성 성공',
        duration: Date.now() - createStartTime,
        details: { record: data }
      })
    } catch (error) {
      results.push({
        feature: '체중 기록',
        operation: 'CREATE',
        status: 'error',
        message: `❌ 체중 기록 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        duration: Date.now() - createStartTime,
        details: { error }
      })
    }

    // READ: 체중 기록 조회
    const readStartTime = Date.now()
    try {
      const { data, error } = await supabase
        .from('weight_records')
        .select('*')
        .limit(5)
        .order('recorded_at', { ascending: false })

      if (error) throw error

      results.push({
        feature: '체중 기록',
        operation: 'READ',
        status: 'success',
        message: `✅ 체중 기록 조회 성공 (${data.length}개)`,
        duration: Date.now() - readStartTime,
        details: { records: data }
      })
    } catch (error) {
      results.push({
        feature: '체중 기록',
        operation: 'READ',
        status: 'error',
        message: `❌ 체중 기록 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        duration: Date.now() - readStartTime,
        details: { error }
      })
    }

    // UPDATE: 체중 기록 수정 (생성된 기록이 있는 경우)
    if (createdRecordId) {
      const updateStartTime = Date.now()
      try {
        const { data, error } = await supabase
          .from('weight_records')
          .update({ 
            weight: 71.0,
            notes: 'CRUD 테스트용 기록 (수정됨)'
          })
          .eq('id', createdRecordId)
          .select()

        if (error) throw error

        results.push({
          feature: '체중 기록',
          operation: 'UPDATE',
          status: 'success',
          message: '✅ 체중 기록 수정 성공',
          duration: Date.now() - updateStartTime,
          details: { updated: data }
        })
      } catch (error) {
        results.push({
          feature: '체중 기록',
          operation: 'UPDATE',
          status: 'error',
          message: `❌ 체중 기록 수정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          duration: Date.now() - updateStartTime,
          details: { error }
        })
      }

      // DELETE: 체중 기록 삭제
      const deleteStartTime = Date.now()
      try {
        const { error } = await supabase
          .from('weight_records')
          .delete()
          .eq('id', createdRecordId)

        if (error) throw error

        results.push({
          feature: '체중 기록',
          operation: 'DELETE',
          status: 'success',
          message: '✅ 체중 기록 삭제 성공',
          duration: Date.now() - deleteStartTime
        })
      } catch (error) {
        results.push({
          feature: '체중 기록',
          operation: 'DELETE',
          status: 'error',
          message: `❌ 체중 기록 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          duration: Date.now() - deleteStartTime,
          details: { error }
        })
      }
    }
  }

  const testAppointments = async (results: CRUDTestResult[]) => {
    // READ: 예약 조회
    const readStartTime = Date.now()
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .limit(5)

      if (error) throw error

      results.push({
        feature: '예약 관리',
        operation: 'READ',
        status: 'success',
        message: `✅ 예약 조회 성공 (${data.length}개)`,
        duration: Date.now() - readStartTime,
        details: { appointments: data }
      })
    } catch (error) {
      results.push({
        feature: '예약 관리',
        operation: 'READ',
        status: 'error',
        message: `❌ 예약 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        duration: Date.now() - readStartTime,
        details: { error }
      })
    }
  }

  const testCommunityPosts = async (results: CRUDTestResult[]) => {
    if (userProfile?.role !== 'customer') {
      results.push({
        feature: '커뮤니티 게시글',
        operation: 'READ',
        status: 'skipped',
        message: '⏭️ 고객 역할이 아니므로 건너뜀'
      })
      return
    }

    // READ: 커뮤니티 게시글 조회
    const readStartTime = Date.now()
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .limit(5)
        .order('created_at', { ascending: false })

      if (error) throw error

      results.push({
        feature: '커뮤니티 게시글',
        operation: 'READ',
        status: 'success',
        message: `✅ 게시글 조회 성공 (${data.length}개)`,
        duration: Date.now() - readStartTime,
        details: { posts: data }
      })
    } catch (error) {
      results.push({
        feature: '커뮤니티 게시글',
        operation: 'READ',
        status: 'error',
        message: `❌ 게시글 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        duration: Date.now() - readStartTime,
        details: { error }
      })
    }
  }

  const testHospitalCodes = async (results: CRUDTestResult[]) => {
    if (userProfile?.role !== 'doctor' && userProfile?.role !== 'admin') {
      results.push({
        feature: '병원 가입 코드',
        operation: 'READ',
        status: 'skipped',
        message: '⏭️ 의사/관리자 역할이 아니므로 건너뜀'
      })
      return
    }

    // READ: 병원 가입 코드 조회
    const readStartTime = Date.now()
    try {
      const { data, error } = await supabase
        .from('hospital_signup_codes')
        .select('*')
        .limit(5)

      if (error) throw error

      results.push({
        feature: '병원 가입 코드',
        operation: 'READ',
        status: 'success',
        message: `✅ 가입 코드 조회 성공 (${data.length}개)`,
        duration: Date.now() - readStartTime,
        details: { codes: data }
      })
    } catch (error) {
      results.push({
        feature: '병원 가입 코드',
        operation: 'READ',
        status: 'error',
        message: `❌ 가입 코드 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        duration: Date.now() - readStartTime,
        details: { error }
      })
    }
  }

  const getStatusIcon = (status: CRUDTestResult['status']) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'pending': return '⏳'
      case 'skipped': return '⏭️'
      default: return '❓'
    }
  }

  const getStatusColor = (status: CRUDTestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      case 'skipped': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const successCount = testResults.filter(r => r.status === 'success').length
  const errorCount = testResults.filter(r => r.status === 'error').length
  const skippedCount = testResults.filter(r => r.status === 'skipped').length

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">핵심 기능 CRUD 테스트</h3>
          {userProfile && (
            <p className="text-sm text-gray-600 mt-1">
              현재 역할: <span className="font-medium text-blue-600">{userProfile.role}</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
            disabled={isRunning}
          >
            <option value="all">전체 기능</option>
            <option value="user_profile">사용자 프로필</option>
            <option value="weight_records">체중 기록</option>
            <option value="appointments">예약 관리</option>
            <option value="community_posts">커뮤니티</option>
            <option value="hospital_codes">병원 코드</option>
          </select>
          <button
            onClick={runCRUDTests}
            disabled={isRunning || !userProfile}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
          >
            {isRunning ? '테스트 중...' : 'CRUD 테스트'}
          </button>
        </div>
      </div>

      {/* 테스트 결과 요약 */}
      {testResults.length > 0 && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-green-800">성공</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-red-800">실패</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{skippedCount}</div>
            <div className="text-sm text-gray-800">건너뜀</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{testResults.length}</div>
            <div className="text-sm text-blue-800">총 테스트</div>
          </div>
        </div>
      )}

      {/* 테스트 결과 상세 */}
      {testResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">테스트 결과</h4>
          {testResults.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getStatusIcon(result.status)}</span>
                  <span className="font-medium">{result.feature}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {result.operation}
                  </span>
                </div>
                {result.duration && (
                  <span className="text-xs text-gray-500">{result.duration}ms</span>
                )}
              </div>
              <p className={`text-sm ${getStatusColor(result.status)} mb-2`}>
                {result.message}
              </p>
              {result.details && (
                <details className="text-xs text-gray-600">
                  <summary className="cursor-pointer hover:text-gray-800">상세 정보</summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-32">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {!userProfile && (
        <div className="text-center py-8">
          <p className="text-gray-600">CRUD 테스트를 실행하려면 먼저 로그인하세요.</p>
        </div>
      )}
    </div>
  )
}