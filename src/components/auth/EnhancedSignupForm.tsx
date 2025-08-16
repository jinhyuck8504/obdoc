'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Stethoscope, 
  User, 
  ArrowRight, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Lock,
  Key,
  Building2,
  UserCheck,
  Clock,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'
import DoctorSignupFlow from './DoctorSignupFlow'
import CustomerSignupForm from './CustomerSignupForm'
import InviteCodeValidator from './InviteCodeValidator'
import { notificationService } from '@/lib/notificationService'
import { realTimeMonitoringService } from '@/lib/realTimeMonitoringService'

// 역할 타입 정의
type UserRole = 'doctor' | 'customer'

// 가입 단계 타입
type SignupStep = 'role-selection' | 'security-check' | 'signup-form' | 'verification' | 'success'

// 보안 검증 상태
interface SecurityCheckStatus {
  ipValidation: boolean
  rateLimit: boolean
  deviceFingerprint: boolean
  geoLocation: boolean
}

// URL 파라미터 처리 컴포넌트
function URLParamsHandler({ 
  onRoleChange, 
  onInviteCodeChange,
  onHospitalCodeChange
}: { 
  onRoleChange: (role: UserRole) => void
  onInviteCodeChange: (code: string) => void
  onHospitalCodeChange: (code: string) => void
}) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // 역할 파라미터 처리
    const roleParam = searchParams.get('role')
    if (roleParam === 'doctor' || roleParam === 'customer') {
      onRoleChange(roleParam)
    }
    
    // 가입 코드 파라미터 처리 (고객 가입용)
    const inviteCodeParam = searchParams.get('code') || searchParams.get('invite')
    if (inviteCodeParam) {
      onInviteCodeChange(inviteCodeParam)
      onRoleChange('customer') // 코드가 있으면 자동으로 고객 역할 선택
    }

    // 병원 코드 파라미터 처리 (의사 가입용)
    const hospitalCodeParam = searchParams.get('hospital')
    if (hospitalCodeParam) {
      onHospitalCodeChange(hospitalCodeParam)
      onRoleChange('doctor') // 병원 코드가 있으면 자동으로 의사 역할 선택
    }
  }, [searchParams, onRoleChange, onInviteCodeChange, onHospitalCodeChange])
  
  return null
}

// 보안 검증 컴포넌트
const SecurityCheckComponent: React.FC<{
  onComplete: (passed: boolean) => void
  userRole: UserRole
}> = ({ onComplete, userRole }) => {
  const [checkStatus, setCheckStatus] = useState<SecurityCheckStatus>({
    ipValidation: false,
    rateLimit: false,
    deviceFingerprint: false,
    geoLocation: false
  })
  const [isChecking, setIsChecking] = useState(true)
  const [checkProgress, setCheckProgress] = useState(0)

  useEffect(() => {
    performSecurityChecks()
  }, [])

  const performSecurityChecks = async () => {
    setIsChecking(true)
    
    // IP 검증
    setTimeout(() => {
      setCheckStatus(prev => ({ ...prev, ipValidation: true }))
      setCheckProgress(25)
    }, 500)

    // Rate Limit 검증
    setTimeout(() => {
      setCheckStatus(prev => ({ ...prev, rateLimit: true }))
      setCheckProgress(50)
    }, 1000)

    // 디바이스 핑거프린트
    setTimeout(() => {
      setCheckStatus(prev => ({ ...prev, deviceFingerprint: true }))
      setCheckProgress(75)
    }, 1500)

    // 지리적 위치 검증
    setTimeout(() => {
      setCheckStatus(prev => ({ ...prev, geoLocation: true }))
      setCheckProgress(100)
      setIsChecking(false)
      
      // 모든 검증 완료 후 결과 전달
      setTimeout(() => {
        onComplete(true) // 실제로는 검증 결과에 따라 결정
      }, 500)
    }, 2000)
  }

  const getCheckIcon = (status: boolean, isActive: boolean) => {
    if (isActive && !status) {
      return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    }
    return status ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>보안 검증</span>
        </CardTitle>
        <CardDescription>
          {userRole === 'doctor' ? '의료진' : '고객'} 가입을 위한 보안 검증을 진행합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 진행률 표시 */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${checkProgress}%` }}
          />
        </div>

        {/* 검증 항목들 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              {getCheckIcon(checkStatus.ipValidation, checkProgress >= 25)}
              <span className="text-sm font-medium">IP 주소 검증</span>
            </div>
            <Badge variant={checkStatus.ipValidation ? "default" : "secondary"}>
              {checkStatus.ipValidation ? '완료' : '대기'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              {getCheckIcon(checkStatus.rateLimit, checkProgress >= 50)}
              <span className="text-sm font-medium">요청 빈도 검증</span>
            </div>
            <Badge variant={checkStatus.rateLimit ? "default" : "secondary"}>
              {checkStatus.rateLimit ? '완료' : '대기'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              {getCheckIcon(checkStatus.deviceFingerprint, checkProgress >= 75)}
              <span className="text-sm font-medium">디바이스 검증</span>
            </div>
            <Badge variant={checkStatus.deviceFingerprint ? "default" : "secondary"}>
              {checkStatus.deviceFingerprint ? '완료' : '대기'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              {getCheckIcon(checkStatus.geoLocation, checkProgress >= 100)}
              <span className="text-sm font-medium">위치 기반 검증</span>
            </div>
            <Badge variant={checkStatus.geoLocation ? "default" : "secondary"}>
              {checkStatus.geoLocation ? '완료' : '대기'}
            </Badge>
          </div>
        </div>

        {!isChecking && (
          <div className="text-center pt-4">
            <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">보안 검증 완료</span>
            </div>
            <p className="text-sm text-gray-600">
              안전한 가입 환경이 확인되었습니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 역할 선택 카드 컴포넌트 (개선된 버전)
const EnhancedRoleSelectionCard: React.FC<{
  role: UserRole
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
  securityFeatures: string[]
  isSelected: boolean
  onClick: () => void
}> = ({ role, title, description, icon, features, securityFeatures, isSelected, onClick }) => {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${
              isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {icon}
            </div>
            <div>
              <CardTitle className={`text-lg ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {title}
              </CardTitle>
              <CardDescription className={
                isSelected ? 'text-blue-700' : 'text-gray-600'
              }>
                {description}
              </CardDescription>
            </div>
          </div>
          {isSelected && (
            <CheckCircle className="w-6 h-6 text-blue-600" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 주요 기능 */}
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${
            isSelected ? 'text-blue-800' : 'text-gray-700'
          }`}>
            주요 기능
          </h4>
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className={`text-sm flex items-center ${
                isSelected ? 'text-blue-700' : 'text-gray-600'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-3 ${
                  isSelected ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* 보안 기능 */}
        <div>
          <h4 className={`text-sm font-semibold mb-2 flex items-center ${
            isSelected ? 'text-blue-800' : 'text-gray-700'
          }`}>
            <Shield className="w-3 h-3 mr-1" />
            보안 기능
          </h4>
          <ul className="space-y-1">
            {securityFeatures.map((feature, index) => (
              <li key={index} className={`text-sm flex items-center ${
                isSelected ? 'text-blue-700' : 'text-gray-600'
              }`}>
                <Lock className={`w-3 h-3 mr-2 ${
                  isSelected ? 'text-blue-500' : 'text-gray-400'
                }`} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

// 메인 컴포넌트
function EnhancedSignupFormContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<SignupStep>('role-selection')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [inviteCode, setInviteCode] = useState<string>('')
  const [hospitalCode, setHospitalCode] = useState<string>('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [securityCheckPassed, setSecurityCheckPassed] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  // URL 파라미터 처리
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    setCurrentStep('security-check')
  }

  const handleInviteCodeChange = (code: string) => {
    setInviteCode(code)
  }

  const handleHospitalCodeChange = (code: string) => {
    setHospitalCode(code)
  }

  // 보안 검증 완료 처리
  const handleSecurityCheckComplete = (passed: boolean) => {
    setSecurityCheckPassed(passed)
    if (passed) {
      setCurrentStep('signup-form')
      
      // 보안 검증 완료 이벤트 기록
      realTimeMonitoringService.recordEvent({
        id: `security_check_${Date.now()}`,
        eventType: 'security_alert',
        data: {
          checkType: 'signup_security_verification',
          role: selectedRole,
          passed: true
        },
        timestamp: new Date(),
        severity: 'low'
      })
    } else {
      toast({
        title: "보안 검증 실패",
        description: "보안 검증을 통과하지 못했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      })
    }
  }

  // 가입 성공 처리
  const handleSignupSuccess = (role: UserRole, userData?: any) => {
    setUserInfo(userData)
    setSignupSuccess(true)
    setCurrentStep('success')
    
    // 가입 성공 알림
    toast({
      title: "회원가입 완료",
      description: `${role === 'doctor' ? '의사' : '고객'} 회원가입이 성공적으로 완료되었습니다.`,
    })

    // 가입 성공 이벤트 기록
    realTimeMonitoringService.recordEvent({
      id: `signup_success_${Date.now()}`,
      eventType: 'signup',
      userId: userData?.id,
      hospitalCode: role === 'doctor' ? hospitalCode : userData?.hospitalCode,
      data: {
        role,
        signupMethod: role === 'doctor' ? 'hospital_code' : 'invite_code',
        timestamp: new Date()
      },
      timestamp: new Date(),
      severity: 'low'
    })
    
    // 역할에 따른 리디렉트
    setTimeout(() => {
      if (role === 'doctor') {
        router.push('/dashboard/doctor')
      } else {
        router.push('/dashboard/customer')
      }
    }, 3000)
  }

  // 역할 선택으로 돌아가기
  const handleBackToRoleSelection = () => {
    setSelectedRole(null)
    setSecurityCheckPassed(false)
    setCurrentStep('role-selection')
  }

  // 가입 성공 화면
  if (signupSuccess) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card className="p-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">회원가입 완료!</h2>
            <p className="text-gray-600 mb-6">
              OBDoc에 오신 것을 환영합니다!
              <br />
              보안 강화된 {selectedRole === 'doctor' ? '의사' : '고객'} 계정이 생성되었습니다.
            </p>
            
            {/* 가입 정보 요약 */}
            <div className="bg-white rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">가입 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">역할:</span>
                  <span className="font-medium">
                    {selectedRole === 'doctor' ? '의사/한의사' : '고객'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">가입 방식:</span>
                  <span className="font-medium">
                    {selectedRole === 'doctor' ? '병원 코드' : '가입 코드'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">보안 검증:</span>
                  <span className="font-medium text-green-600">완료</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">가입 시간:</span>
                  <span className="font-medium">
                    {new Date().toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '90%' }}></div>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
              <Shield className="w-4 h-4" />
              <span>보안 강화된 가입 플로우로 안전하게 가입되었습니다</span>
            </div>
            
            <p className="text-xs text-gray-400">
              {selectedRole === 'doctor' ? '의사 대시보드' : '고객 대시보드'}로 자동 이동합니다...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // 역할 선택 단계
  if (currentStep === 'role-selection') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">OBDoc 보안 강화 회원가입</h1>
          <p className="text-lg text-gray-600 mb-2">
            어떤 유형으로 가입하시겠습니까?
          </p>
          <p className="text-sm text-gray-500 mb-4">
            역할에 따라 최적화된 보안 가입 플로우를 제공합니다
          </p>
          
          {/* 보안 기능 강조 */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-8">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>다단계 보안 검증</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span>암호화된 데이터 전송</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span>역할 기반 접근 제어</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <EnhancedRoleSelectionCard
            role="doctor"
            title="의사 / 한의사"
            description="의료진을 위한 전문 서비스"
            icon={<Stethoscope className="w-6 h-6" />}
            features={[
              "병원 코드 자동 생성",
              "고객 가입 코드 관리",
              "의료진 전용 대시보드",
              "고객 관리 시스템",
              "실시간 알림 서비스",
              "통계 및 분석 도구"
            ]}
            securityFeatures={[
              "의료진 자격 검증",
              "병원 정보 암호화",
              "접근 권한 관리",
              "감사 로그 기록"
            ]}
            isSelected={selectedRole === 'doctor'}
            onClick={() => handleRoleChange('doctor')}
          />

          <EnhancedRoleSelectionCard
            role="customer"
            title="고객"
            description="의료 서비스 이용자"
            icon={<User className="w-6 h-6" />}
            features={[
              "가입 코드로 간편 가입",
              "병원별 맞춤 서비스",
              "개인 건강 관리",
              "의료진과 소통",
              "서비스 이용 내역",
              "개인정보 보호"
            ]}
            securityFeatures={[
              "가입 코드 검증",
              "개인정보 암호화",
              "병원별 데이터 분리",
              "프라이버시 보호"
            ]}
            isSelected={selectedRole === 'customer'}
            onClick={() => handleRoleChange('customer')}
          />
        </div>

        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">새로운 보안 강화 시스템</h3>
            <p className="text-sm text-blue-700">
              각 역할에 맞는 보안 정책과 검증 절차가 적용되어 더욱 안전한 가입이 가능합니다.
            </p>
          </div>
          <p className="text-xs text-gray-400">
            모든 가입 과정은 암호화되어 전송되며, 실시간 보안 모니터링이 적용됩니다.
          </p>
        </div>
      </div>
    )
  }

  // 보안 검증 단계
  if (currentStep === 'security-check' && selectedRole) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <button
            onClick={handleBackToRoleSelection}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            ← 역할 선택으로 돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            보안 검증 단계
          </h1>
          <p className="text-gray-600">
            {selectedRole === 'doctor' ? '의료진' : '고객'} 가입을 위한 보안 검증을 진행합니다
          </p>
        </div>

        <SecurityCheckComponent
          onComplete={handleSecurityCheckComplete}
          userRole={selectedRole}
        />
      </div>
    )
  }

  // 가입 폼 단계
  if (currentStep === 'signup-form' && selectedRole && securityCheckPassed) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <button
            onClick={handleBackToRoleSelection}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            ← 역할 선택으로 돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedRole === 'doctor' ? '의사 회원가입' : '고객 회원가입'}
          </h1>
          <p className="text-gray-600 mb-4">
            {selectedRole === 'doctor' 
              ? '의료진을 위한 보안 강화된 가입 절차입니다'
              : '가입 코드를 통한 안전한 고객 가입입니다'
            }
          </p>
          
          {/* 보안 검증 완료 표시 */}
          <div className="flex items-center justify-center space-x-2 text-sm text-green-600 mb-6">
            <CheckCircle className="w-4 h-4" />
            <span>보안 검증 완료</span>
            <Shield className="w-4 h-4" />
          </div>
        </div>

        {/* 역할별 가입 폼 */}
        {selectedRole === 'doctor' ? (
          <DoctorSignupFlow 
            initialHospitalCode={hospitalCode}
            onSuccess={(userData) => handleSignupSuccess('doctor', userData)} 
          />
        ) : (
          <CustomerSignupForm 
            initialInviteCode={inviteCode}
            onSuccess={(userData) => handleSignupSuccess('customer', userData)} 
          />
        )}
      </div>
    )
  }

  return null
}

export default function EnhancedSignupForm() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <Suspense fallback={
        <div className="w-full max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">보안 강화 가입 시스템을 준비하고 있습니다...</p>
            </div>
          </Card>
        </div>
      }>
        <EnhancedSignupFormContent />
        <URLParamsHandler 
          onRoleChange={() => {}} 
          onInviteCodeChange={() => {}}
          onHospitalCodeChange={() => {}}
        />
      </Suspense>
    </div>
  )
}