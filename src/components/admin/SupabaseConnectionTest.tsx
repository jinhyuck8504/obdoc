'use client'

import { useState, useEffect } from 'react'
import { supabase, validateProductionEnvironment, testSupabaseConnection } from '@/lib/supabase'
import { getConfig, isDummySupabase } from '@/lib/config'

export default function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<{
    isValid: boolean
    isConnected: boolean
    isDummy: boolean
    message: string
    userCount?: number
  }>({
    isValid: false,
    isConnected: false,
    isDummy: false,
    message: '테스트 중...'
  })

  useEffect(() => {
    async function runTests() {
      try {
        const config = getConfig()
        const isDummy = isDummySupabase()
        const isValid = validateProductionEnvironment()
        
        let isConnected = false
        let userCount = 0
        let message = ''

        if (isValid && !isDummy) {
          isConnected = await testSupabaseConnection()
          
          if (isConnected) {
            // 사용자 수 확인
            const { count, error } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
            
            if (!error && count !== null) {
              userCount = count
              message = `✅ 실제 Supabase 연결 성공! (사용자 ${count}명)`
            } else {
              message = '✅ 연결 성공하지만 사용자 수 조회 실패'
            }
          } else {
            message = '❌ Supabase 연결 실패'
          }
        } else if (isDummy) {
          message = '⚠️ 더미 Supabase URL 사용 중'
        } else {
          message = '❌ 환경 변수 검증 실패'
        }

        setConnectionStatus({
          isValid,
          isConnected,
          isDummy,
          message,
          userCount
        })
      } catch (error) {
        setConnectionStatus({
          isValid: false,
          isConnected: false,
          isDummy: false,
          message: `❌ 테스트 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        })
      }
    }

    runTests()
  }, [])

  const getStatusColor = () => {
    if (connectionStatus.isDummy) return 'text-yellow-600'
    if (connectionStatus.isConnected) return 'text-green-600'
    return 'text-red-600'
  }

  const getStatusIcon = () => {
    if (connectionStatus.isDummy) return '⚠️'
    if (connectionStatus.isConnected) return '✅'
    return '❌'
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold mb-4">Supabase 연결 상태</h3>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getStatusIcon()}</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {connectionStatus.message}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">환경 검증:</span>
            <span className={connectionStatus.isValid ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
              {connectionStatus.isValid ? '통과' : '실패'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">연결 상태:</span>
            <span className={connectionStatus.isConnected ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
              {connectionStatus.isConnected ? '연결됨' : '연결 안됨'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">클라이언트 타입:</span>
            <span className={connectionStatus.isDummy ? 'text-yellow-600 ml-2' : 'text-green-600 ml-2'}>
              {connectionStatus.isDummy ? '더미' : '실제'}
            </span>
          </div>
          
          {connectionStatus.userCount !== undefined && (
            <div>
              <span className="font-medium">등록 사용자:</span>
              <span className="text-blue-600 ml-2">{connectionStatus.userCount}명</span>
            </div>
          )}
        </div>

        {!connectionStatus.isDummy && connectionStatus.isConnected && (
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <p className="text-green-800 text-sm">
              🎉 프로덕션 Supabase 환경이 성공적으로 설정되었습니다!
            </p>
          </div>
        )}

        {connectionStatus.isDummy && (
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              ⚠️ 더미 Supabase URL을 사용 중입니다. SUPABASE_SETUP_GUIDE.md를 참조하여 실제 프로젝트를 설정하세요.
            </p>
          </div>
        )}

        {!connectionStatus.isConnected && !connectionStatus.isDummy && (
          <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
            <p className="text-red-800 text-sm">
              ❌ Supabase 연결에 실패했습니다. 환경 변수와 네트워크 연결을 확인하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}