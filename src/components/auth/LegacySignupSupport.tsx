/**
 * 레거시 SignupForm 지원 컴포넌트
 * 기존 기능과의 호환성을 유지하면서 새로운 보안 강화 플로우로 점진적 마이그레이션을 지원합니다.
 */
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, Info, ArrowRight, Shield } from 'lucide-react'

// 레거시 기능 감지 타입
interface LegacyFeatureDetection {
  hasLegacyParams: boolean
  hasSubscriptionPlan: boolean
  hasDirectHospitalFields: boolean
  migrationRecommended: boolean
}

// 마이그레이션 안내 컴포넌트
const MigrationNotice: React.FC<{
  detection: LegacyFeatureDetection
  onProceedWithNew: () => void
  onUseLegacy: () => void
}> = ({ detection, onProceedWithNew, onUseLegacy }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              보안 강화된 가입 시스템으로 업그레이드
            </h3>
            <p className="text-blue-700 mb-4">
              더 안전하고 개선된 가입 경험을 위해 새로운 역할 기반 가입 시스템을 도입했습니다.
            </p>
            
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">새로운 기능:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 역할별 맞춤형 가입 플로우</li>
                <li>• 강화된 보안 검증</li>
                <li>• 실시간 알림 시스템</li>
                <li>• 개선된 사용자 경험</li>
                <li>• 병원 코드 자동 생성 (의사용)</li>
                <li>• 가입 코드 검증 (고객용)</li>
              </ul>
            </div>

            {detection.migrationRecommended && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    마이그레이션 권장
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  감지된 레거시 기능들은 새로운 시스템에서 더 안전하게 처리됩니다.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onProceedWithNew}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>새로운 시스템 사용</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={onUseLegacy}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                기존 방식 계속
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 레거시 파라미터 변환 유틸리티
const convertLegacyParams = (searchParams: URLSearchParams) => {
  const newParams = new URLSearchParams()
  
  // 구독 플랜 파라미터를 역할로 변환
  const plan = searchParams.get('plan')
  if (plan) {
    newParams.set('role', 'doctor') // 플랜이 있으면 의사로 가정
  }
  
  // 병원 코드 파라미터 변환
  const hospitalCode = searchParams.get('hospitalCode')
  if (hospitalCode) {
    newParams.set('code', hospitalCode)
    newParams.set('role', 'customer')
  }
  
  // 기타 파라미터 유지
  const role = searchParams.get('role')
  if (role && ['doctor', 'customer'].includes(role)) {
    newParams.set('role', role)
  }
  
  const code = searchParams.get('code')
  if (code) {
    newParams.set('code', code)
  }
  
  return newParams
}

// 레거시 기능 감지
const detectLegacyFeatures = (searchParams: URLSearchParams): LegacyFeatureDetection => {
  const hasLegacyParams = searchParams.has('plan') || searchParams.has('hospitalCode')
  const hasSubscriptionPlan = searchParams.has('plan')
  const hasDirectHospitalFields = searchParams.has('hospitalName') || searchParams.has('hospitalType')
  
  return {
    hasLegacyParams,
    hasSubscriptionPlan,
    hasDirectHospitalFields,
    migrationRecommended: hasLegacyParams || hasDirectHospitalFields
  }
}

// 메인 레거시 지원 컴포넌트
const LegacySignupSupport: React.FC<{
  children: React.ReactNode
  onMigrationDecision?: (useNew: boolean) => void
}> = ({ children, onMigrationDecision }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showMigrationNotice, setShowMigrationNotice] = useState(false)
  const [detection, setDetection] = useState<LegacyFeatureDetection | null>(null)
  const [userDecision, setUserDecision] = useState<'new' | 'legacy' | null>(null)

  useEffect(() => {
    const legacyDetection = detectLegacyFeatures(searchParams)
    setDetection(legacyDetection)
    
    // 레거시 기능이 감지되고 사용자가 아직 결정하지 않았으면 안내 표시
    if (legacyDetection.migrationRecommended && !userDecision) {
      setShowMigrationNotice(true)
    }
  }, [searchParams, userDecision])

  const handleProceedWithNew = () => {
    setUserDecision('new')
    setShowMigrationNotice(false)
    
    // 레거시 파라미터를 새로운 형식으로 변환
    const newParams = convertLegacyParams(searchParams)
    const newUrl = `${window.location.pathname}?${newParams.toString()}`
    
    // URL 업데이트 (히스토리 교체)
    router.replace(newUrl)
    
    onMigrationDecision?.(true)
  }

  const handleUseLegacy = () => {
    setUserDecision('legacy')
    setShowMigrationNotice(false)
    onMigrationDecision?.(false)
  }

  // 마이그레이션 안내가 필요한 경우
  if (showMigrationNotice && detection) {
    return (
      <MigrationNotice
        detection={detection}
        onProceedWithNew={handleProceedWithNew}
        onUseLegacy={handleUseLegacy}
      />
    )
  }

  // 레거시 모드로 결정된 경우 안내 메시지와 함께 기존 컴포넌트 표시
  if (userDecision === 'legacy') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-yellow-600" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">레거시 모드</h4>
              <p className="text-sm text-yellow-700 mt-1">
                기존 가입 방식을 사용하고 있습니다. 언제든지 새로운 보안 강화 시스템으로 전환할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
    )
  }

  // 새로운 시스템 사용 또는 레거시 기능이 감지되지 않은 경우
  return <>{children}</>
}

// 레거시 호환성 체크 훅
export const useLegacyCompatibility = () => {
  const searchParams = useSearchParams()
  const [isLegacyMode, setIsLegacyMode] = useState(false)
  const [migrationAvailable, setMigrationAvailable] = useState(false)

  useEffect(() => {
    const detection = detectLegacyFeatures(searchParams)
    setMigrationAvailable(detection.migrationRecommended)
  }, [searchParams])

  const enableLegacyMode = () => setIsLegacyMode(true)
  const disableLegacyMode = () => setIsLegacyMode(false)

  return {
    isLegacyMode,
    migrationAvailable,
    enableLegacyMode,
    disableLegacyMode
  }
}

// 레거시 파라미터 변환 유틸리티 (외부 사용용)
export const convertLegacySignupParams = (params: Record<string, string>) => {
  const converted: Record<string, string> = {}

  // 구독 플랜 -> 의사 역할
  if (params.plan) {
    converted.role = 'doctor'
  }

  // 병원 코드 -> 고객 역할 + 가입 코드
  if (params.hospitalCode) {
    converted.role = 'customer'
    converted.code = params.hospitalCode
  }

  // 직접 역할 지정
  if (params.role && ['doctor', 'customer'].includes(params.role)) {
    converted.role = params.role
  }

  // 가입 코드
  if (params.code) {
    converted.code = params.code
  }

  return converted
}

export default LegacySignupSupport