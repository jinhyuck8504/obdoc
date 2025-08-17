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
  Zap,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'
import DoctorSignupFlow from './DoctorSignupFlow'
import CustomerSignupForm from './CustomerSignupForm'
import EnhancedSignupForm from './EnhancedSignupForm'
import LegacySignupSupport from './LegacySignupSupport'
import { useNotifications } from '@/hooks/useNotifications'
import QuickFeedbackWidget from '@/components/feedback/QuickFeedbackWidget'
import ErrorBoundaryWithFeedback from '@/components/feedback/ErrorBoundaryWithFeedback'
import { notificationService } from '@/lib/notificationService'
import { realTimeMonitoringService } from '@/lib/realTimeMonitoringService'

// 역할 타입 정의
type UserRole = 'doctor' | 'customer'

// 가입 단계 타입
type SignupStep = 'role-selection' | 'signup-form' | 'success'

// URL 파라미터 처리 컴포넌트
function URLParamsHandler({ 
  onRoleChange, 
  onInviteCodeChange 
}: { 
  onRoleChange: (role: UserRole) => void
  onInviteCodeChange: (code: string) => void
}) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // 역할 파라미터 처리
    const roleParam = searchParams.get('role')
    if (roleParam === 'doctor' || roleParam === 'customer') {
      onRoleChange(roleParam)
    }
    
    // 가입 코드 파라미터 처리 (고객 가입용)
    const codeParam = searchParams.get('code')
    if (codeParam) {
      onInviteCodeChange(codeParam)
      onRoleChange('customer') // 코드가 있으면 자동으로 고객 역할 선택
    }
  }, [searchParams, onRoleChange, onInviteCodeChange])
  
  return null
}

// 역할 선택 카드 컴포넌트
const RoleSelectionCard: React.FC<{
  role: UserRole
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
  isSelected: boolean
  onClick: () => void
}> = ({ role, title, description, icon, features, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${
              isSelected ? 'text-blue-900' : 'text-gray-900'
            }`}>
              {title}
            </h3>
            <p className={`text-sm ${
              isSelected ? 'text-blue-700' : 'text-gray-600'
            }`}>
              {description}
            </p>
          </div>
        </div>
        {isSelected && (
          <CheckCircle className="w-6 h-6 text-blue-600" />
        )}
      </div>
      
      <ul className="space-y-2">
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
  )
}

function SignupFormContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<SignupStep>('role-selection')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [inviteCode, setInviteCode] = useState<string>('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [useLegacyMode, setUseLegacyMode] = useState(false)
  const [useEnhancedMode, setUseEnhancedMode] = useState(true) // 기본적으로 새 시스템 사용
  
  // 실시간 알림 연결
  const { isConnected } = useNotifications({ autoConnect: false })

  // URL 파라미터 처리
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    setCurrentStep('signup-form')
  }

  const handleInviteCodeChange = (code: string) => {
    setInviteCode(code)
  }

  // 레거시 모드 결정 처리
  const handleMigrationDecision = (useNew: boolean) => {
    setUseLegacyMode(!useNew)
  }

  // 가입 성공 처리
  const handleSignupSuccess = (role: UserRole) => {
    setSignupSuccess(true)
    setCurrentStep('success')
    
    // 역할에 따른 리디렉트
    setTimeout(() => {
      if (role === 'doctor') {
        router.push('/dashboard/doctor')
      } else {
        router.push('/dashboard/customer')
      }
    }, 2000)
  }

  // 역할 선택으로 돌아가기
  const handleBackToRoleSelection = () => {
    setSelectedRole(null)
    setCurrentStep('role-selection')
  }

  // 가입 성공 화면
  if (signupSuccess) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="p-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">회원가입 완료!</h2>
          <p className="text-gray-600 mb-6">
            OBDoc에 오신 것을 환영합니다!
            <br />
            {selectedRole === 'doctor' ? '의사 대시보드' : '고객 대시보드'}로 이동합니다...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>보안 강화된 가입 플로우로 안전하게 가입되었습니다</span>
          </div>
        </div>
      </div>
    )
  }

  // 새로운 보안 강화 시스템 사용 여부 확인
  if (useEnhancedMode) {
    return <EnhancedSignupForm />
  }

  // 역할 선택 단계
  if (currentStep === 'role-selection') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">OBDoc 회원가입</h1>
          <p className="text-lg text-gray-600 mb-2">
            어떤 유형으로 가입하시겠습니까?
          </p>
          <p className="text-sm text-gray-500 mb-4">
            역할에 따라 최적화된 보안 가입 플로우를 제공합니다
          </p>
          
          {/* 시스템 선택 옵션 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant={useEnhancedMode ? "default" : "outline"}
                size="sm"
                onClick={() => setUseEnhancedMode(true)}
                className="flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>보안 강화 시스템</span>
                <Badge variant="secondary" className="ml-2">권장</Badge>
              </Button>
              <Button
                variant={!useEnhancedMode ? "default" : "outline"}
                size="sm"
                onClick={() => setUseEnhancedMode(false)}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>기존 시스템</span>
              </Button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              보안 강화 시스템은 다단계 검증과 실시간 모니터링을 제공합니다
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <RoleSelectionCard
            role="doctor"
            title="의사 / 한의사"
            description="의료진을 위한 전문 서비스"
            icon={<Stethoscope className="w-6 h-6" />}
            features={[
              "병원 코드 자동 생성",
              "고객 가입 코드 관리",
              "의료진 전용 대시보드",
              "고객 관리 시스템",
              "실시간 알림 서비스"
            ]}
            isSelected={selectedRole === 'doctor'}
            onClick={() => handleRoleChange('doctor')}
          />

          <RoleSelectionCard
            role="customer"
            title="고객"
            description="의료 서비스 이용자"
            icon={<User className="w-6 h-6" />}
            features={[
              "가입 코드로 간편 가입",
              "병원별 맞춤 서비스",
              "개인 건강 관리",
              "의료진과 소통",
              "서비스 이용 내역"
            ]}
            isSelected={selectedRole === 'customer'}
            onClick={() => handleRoleChange('customer')}
          />
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
            <Shield className="w-4 h-4" />
            <span>보안 강화된 역할 기반 가입 시스템</span>
          </div>
          <p className="text-xs text-gray-400">
            각 역할에 맞는 보안 정책과 검증 절차가 적용됩니다
          </p>
        </div>
      </div>
    )
  }

  // 가입 폼 단계
  if (currentStep === 'signup-form' && selectedRole) {
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
          <p className="text-gray-600">
            {selectedRole === 'doctor' 
              ? '의료진을 위한 보안 강화된 가입 절차입니다'
              : '가입 코드를 통한 안전한 고객 가입입니다'
            }
          </p>
        </div>

        {/* 역할별 가입 폼 */}
        {selectedRole === 'doctor' ? (
          <DoctorSignupFlow onSuccess={() => handleSignupSuccess('doctor')} />
        ) : (
          <CustomerSignupForm 
            initialInviteCode={inviteCode}
            onSuccess={() => handleSignupSuccess('customer')} 
          />
        )}
      </div>
    )
  }

  // 레거시 모드인 경우 기존 SignupForm 로직 사용
  if (useLegacyMode) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">레거시 모드</h4>
          <p className="text-sm text-yellow-700">
            기존 가입 방식을 사용하고 있습니다. 보안상 새로운 시스템 사용을 권장합니다.
          </p>
          <button
            onClick={() => setUseLegacyMode(false)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            새로운 보안 강화 시스템으로 전환
          </button>
        </div>
        <div className="text-center text-gray-500">
          <p>레거시 가입 폼이 여기에 표시됩니다.</p>
          <p className="text-xs mt-2">
            기존 기능과의 호환성을 위해 유지되는 모드입니다.
          </p>
        </div>
      </div>
    )
  }

  return null
}

export default function SignupForm() {
  return (
    <ErrorBoundaryWithFeedback component="signup_form">
      <Suspense fallback={
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">가입 시스템을 준비하고 있습니다...</p>
          </div>
        </div>
      }>
        <LegacySignupSupport>
          <SignupFormContent />
          <URLParamsHandler 
            onRoleChange={(role) => {}} 
            onInviteCodeChange={(code) => {}} 
          />
        </LegacySignupSupport>
        
        {/* 빠른 피드백 위젯 */}
        <QuickFeedbackWidget 
          context="signup_flow"
          position="bottom-right"
          showOnPages={['/signup', '/auth/signup']}
        />
      </Suspense>
    </ErrorBoundaryWithFeedback>
  )
}
