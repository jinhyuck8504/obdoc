'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DoctorFormData, DoctorCompleteData, SubscriptionData } from '@/types/user'
import { HospitalData, HospitalType } from '@/types/hospital'
import HospitalCodeGeneratorEnhanced from './HospitalCodeGeneratorEnhanced'
// LoadingSpinner 컴포넌트 (인라인)
const LoadingSpinner = ({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) => {
  const sizeClasses = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-6 h-6' }
  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  )
}
import { supabase } from '@/lib/supabase'

interface DoctorSignupFlowProps {
  onComplete?: (data: DoctorCompleteData) => Promise<void>
  onBack?: () => void
  isSubmitting?: boolean
  error?: string | null
  className?: string
}

export default function DoctorSignupFlow({
  onComplete,
  onBack,
  isSubmitting = false,
  error: externalError = null,
  className = ''
}: DoctorSignupFlowProps) {
  const router = useRouter()
  
  // 단계 관리
  const [currentStep, setCurrentStep] = useState<'basic-info' | 'subscription'>('basic-info')
  
  // 폼 데이터
  const [formData, setFormData] = useState<Partial<DoctorFormData>>({
    role: 'doctor',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    hospitalName: '',
    hospitalType: 'clinic',
    region: '서울',
    address: '',
    hospitalPhone: '',
    registrationNumber: '',
    medicalLicenseNumber: '',
    medicalLicense: '',
    specialization: '',
    yearsOfExperience: undefined
  })
  
  // 구독 데이터
  const [subscriptionData, setSubscriptionData] = useState<Partial<SubscriptionData>>({
    planId: '1month',
    planName: '1개월 플랜',
    price: 50000,
    duration: '1개월'
  })
  
  // 생성된 병원 정보
  const [generatedHospitalCode, setGeneratedHospitalCode] = useState<string>('')
  const [hospitalData, setHospitalData] = useState<HospitalData | null>(null)
  
  // UI 상태
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(externalError)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 외부 에러 동기화
  useEffect(() => {
    setError(externalError)
  }, [externalError])

  // 지역 옵션
  const regionOptions = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ]

  // 병원 유형 옵션
  const hospitalTypeOptions: { value: HospitalType; label: string }[] = [
    { value: 'clinic', label: '의원' },
    { value: 'oriental_clinic', label: '한의원' },
    { value: 'hospital', label: '병원' }
  ]

  // 구독 플랜 옵션
  const subscriptionPlans: SubscriptionData[] = [
    {
      planId: '1month',
      planName: '1개월 플랜',
      price: 50000,
      originalPrice: 50000,
      duration: '1개월',
      features: ['기본 기능', '고객 관리', '예약 관리']
    },
    {
      planId: '6months',
      planName: '6개월 플랜',
      price: 240000,
      originalPrice: 300000,
      discount: 20,
      duration: '6개월',
      features: ['기본 기능', '고객 관리', '예약 관리', '통계 분석'],
      recommended: true
    },
    {
      planId: '12months',
      planName: '12개월 플랜',
      price: 400000,
      originalPrice: 600000,
      discount: 33,
      duration: '12개월',
      features: ['모든 기능', '고객 관리', '예약 관리', '통계 분석', '우선 지원']
    }
  ]

  // 폼 필드 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 해당 필드의 검증 에러 제거
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // 병원 코드 생성 성공 핸들러
  const handleHospitalCodeGenerated = (code: string, hospitalInfo: HospitalData) => {
    setGeneratedHospitalCode(code)
    setHospitalData(hospitalInfo)
    setFormData(prev => ({ ...prev, hospitalCode: code }))
    setError(null)
    
    // 성공 메시지 표시 (선택적)
    console.log('병원 코드가 성공적으로 생성되었습니다:', code)
  }

  // 병원 코드 생성 실패 핸들러
  const handleHospitalCodeError = (errorMessage: string) => {
    setError(errorMessage)
    setGeneratedHospitalCode('')
    setHospitalData(null)
  }

  // 구독 플랜 선택 핸들러
  const handlePlanSelect = (plan: SubscriptionData) => {
    setSubscriptionData(plan)
    setError(null) // 플랜 선택 시 에러 초기화
  }

  // 1단계 폼 검증
  const validateBasicForm = (): boolean => {
    const errors: Record<string, string> = {}

    // 이메일 검증
    if (!formData.email) {
      errors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '올바른 이메일 형식을 입력해주세요.'
    }

    // 비밀번호 검증
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 8) {
      errors.password = '비밀번호는 8자 이상이어야 합니다.'
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = '비밀번호는 영문과 숫자를 포함해야 합니다.'
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    // 이름 검증
    if (!formData.name) {
      errors.name = '이름을 입력해주세요.'
    } else if (formData.name.length < 2) {
      errors.name = '이름은 2자 이상 입력해주세요.'
    }

    // 병원명 검증
    if (!formData.hospitalName) {
      errors.hospitalName = '병원명을 입력해주세요.'
    } else if (formData.hospitalName.length < 2) {
      errors.hospitalName = '병원명은 2자 이상 입력해주세요.'
    }

    // 의료진 정보 검증
    if (!formData.medicalLicense) {
      errors.medicalLicense = '의사 면허번호를 입력해주세요.'
    }

    // 전화번호 검증 (선택사항이지만 입력된 경우)
    if (formData.phone && !/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ''))) {
      errors.phone = '올바른 전화번호 형식을 입력해주세요.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 다음 단계로 이동
  const handleNextStep = () => {
    if (currentStep === 'basic-info') {
      if (!validateBasicForm()) {
        return
      }
      
      if (!generatedHospitalCode) {
        setError('병원 코드 생성이 필요합니다.')
        return
      }
      
      setCurrentStep('subscription')
      setError(null)
    }
  }

  // 이전 단계로 이동
  const handlePrevStep = () => {
    if (currentStep === 'subscription') {
      setCurrentStep('basic-info')
    } else if (onBack) {
      onBack()
    }
  }

  // 최종 제출 핸들러
  const handleSubmit = async () => {
    if (!validateBasicForm() || !generatedHospitalCode || !subscriptionData.planId) {
      setError('모든 필수 정보를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const doctorCompleteData: DoctorCompleteData = {
        role: 'doctor',
        email: formData.email!,
        password: formData.password!,
        confirmPassword: formData.confirmPassword!,
        name: formData.name!,
        phone: formData.phone || '',
        hospitalName: formData.hospitalName!,
        hospitalType: formData.hospitalType!,
        region: formData.region!,
        address: formData.address,
        hospitalPhone: formData.hospitalPhone,
        registrationNumber: formData.registrationNumber,
        medicalLicenseNumber: formData.medicalLicenseNumber,
        medicalLicense: formData.medicalLicense!,
        specialization: formData.specialization,
        yearsOfExperience: formData.yearsOfExperience,
        subscription: subscriptionData as SubscriptionData,
        hospitalCode: generatedHospitalCode
      }

      if (onComplete) {
        await onComplete(doctorCompleteData)
      } else {
        // 기본 회원가입 처리
        await handleDefaultSignup(doctorCompleteData)
      }

    } catch (error) {
      console.error('의사 회원가입 중 오류:', error)
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 기본 회원가입 처리
  const handleDefaultSignup = async (doctorData: DoctorCompleteData) => {
    // Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: doctorData.email,
      password: doctorData.password,
      options: {
        data: {
          role: 'doctor',
          name: doctorData.name,
          phone: doctorData.phone
        }
      }
    })

    if (authError) {
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('사용자 생성에 실패했습니다.')
    }

    // 의사 프로필 생성
    const { error: profileError } = await supabase
      .from('doctors')
      .insert({
        user_id: authData.user.id,
        hospital_code: doctorData.hospitalCode,
        medical_license: doctorData.medicalLicense,
        specialization: doctorData.specialization,
        years_of_experience: doctorData.yearsOfExperience,
        subscription_plan_id: doctorData.subscription.planId,
        subscription_status: 'active'
      })

    if (profileError) {
      console.error('의사 프로필 생성 오류:', profileError)
      // 사용자 삭제 (롤백)
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new Error('의사 프로필 생성에 실패했습니다.')
    }

    // 성공 시 의사 대시보드로 리디렉션
    router.push('/dashboard/doctor')
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* 진행 상황 표시 */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span className={currentStep === 'basic-info' ? 'text-blue-600 font-medium' : ''}>
            1. 기본 정보 및 병원 코드 생성
          </span>
          <span className={currentStep === 'subscription' ? 'text-blue-600 font-medium' : ''}>
            2. 구독 플랜 선택
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: currentStep === 'basic-info' ? '50%' : '100%' }}
          />
        </div>
      </div>

      {/* 헤더 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">의사 회원가입</h2>
        <p className="text-gray-600">
          {currentStep === 'basic-info' 
            ? '기본 정보를 입력하고 병원 코드를 생성해주세요.'
            : '구독 플랜을 선택해주세요.'
          }
        </p>
      </div>

      {/* 전체 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 단계별 컨텐츠 */}
      {currentStep === 'basic-info' ? (
        /* 1단계: 기본 정보 및 병원 코드 생성 */
        <div className="space-y-6">
          {/* 개인 정보 섹션 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">개인 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 이메일 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className={`
                    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="doctor@example.com"
                  disabled={isLoading || isSubmitting}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
                )}
              </div>

              {/* 이름 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className={`
                    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="홍길동"
                  disabled={isLoading || isSubmitting}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
                )}
              </div>

              {/* 비밀번호 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password || ''}
                    onChange={handleInputChange}
                    className={`
                      w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    `}
                    placeholder="8자 이상, 영문+숫자 포함"
                    disabled={isLoading || isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword || ''}
                    onChange={handleInputChange}
                    className={`
                      w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${validationErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    `}
                    placeholder="비밀번호를 다시 입력해주세요"
                    disabled={isLoading || isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>

              {/* 전화번호 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 <span className="text-gray-400">(선택사항)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  className={`
                    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="010-1234-5678"
                  disabled={isLoading || isSubmitting}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.phone}</p>
                )}
              </div>

              {/* 의사 면허번호 */}
              <div>
                <label htmlFor="medicalLicense" className="block text-sm font-medium text-gray-700 mb-1">
                  의사 면허번호 <span className="text-red-500">*</span>
                </label>
                <input
                  id="medicalLicense"
                  name="medicalLicense"
                  type="text"
                  value={formData.medicalLicense || ''}
                  onChange={handleInputChange}
                  className={`
                    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${validationErrors.medicalLicense ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="의사 면허번호"
                  disabled={isLoading || isSubmitting}
                />
                {validationErrors.medicalLicense && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.medicalLicense}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* 전문 분야 */}
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                  전문 분야 <span className="text-gray-400">(선택사항)</span>
                </label>
                <input
                  id="specialization"
                  name="specialization"
                  type="text"
                  value={formData.specialization || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 내과, 외과, 정형외과"
                  disabled={isLoading || isSubmitting}
                />
              </div>

              {/* 경력 */}
              <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-1">
                  경력 (년) <span className="text-gray-400">(선택사항)</span>
                </label>
                <input
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsOfExperience || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>
          </div>      
    {/* 병원 정보 및 코드 생성 섹션 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">병원 정보 및 코드 생성</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* 병원명 */}
              <div>
                <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-1">
                  병원명 <span className="text-red-500">*</span>
                </label>
                <input
                  id="hospitalName"
                  name="hospitalName"
                  type="text"
                  value={formData.hospitalName || ''}
                  onChange={handleInputChange}
                  className={`
                    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${validationErrors.hospitalName ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="예: 서울내과의원"
                  disabled={isLoading || isSubmitting}
                />
                {validationErrors.hospitalName && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.hospitalName}</p>
                )}
              </div>

              {/* 병원 유형 */}
              <div>
                <label htmlFor="hospitalType" className="block text-sm font-medium text-gray-700 mb-1">
                  병원 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  id="hospitalType"
                  name="hospitalType"
                  value={formData.hospitalType || 'clinic'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading || isSubmitting}
                >
                  {hospitalTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 지역 */}
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  지역 <span className="text-red-500">*</span>
                </label>
                <select
                  id="region"
                  name="region"
                  value={formData.region || '서울'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading || isSubmitting}
                >
                  {regionOptions.map(region => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* 병원 전화번호 */}
              <div>
                <label htmlFor="hospitalPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  병원 전화번호 <span className="text-gray-400">(선택사항)</span>
                </label>
                <input
                  id="hospitalPhone"
                  name="hospitalPhone"
                  type="tel"
                  value={formData.hospitalPhone || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="02-1234-5678"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* 주소 */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  주소 <span className="text-gray-400">(선택사항)</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="서울시 강남구 테헤란로 123"
                  disabled={isLoading || isSubmitting}
                />
              </div>

              {/* 사업자등록번호 */}
              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  사업자등록번호 <span className="text-gray-400">(선택사항)</span>
                </label>
                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  type="text"
                  value={formData.registrationNumber || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123-45-67890"
                  disabled={isLoading || isSubmitting}
                />
              </div>

              {/* 의료기관 허가번호 */}
              <div>
                <label htmlFor="medicalLicenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  의료기관 허가번호 <span className="text-gray-400">(선택사항)</span>
                </label>
                <input
                  id="medicalLicenseNumber"
                  name="medicalLicenseNumber"
                  type="text"
                  value={formData.medicalLicenseNumber || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="의료기관 허가번호"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            {/* 병원 코드 생성기 */}
            {formData.hospitalName && formData.hospitalType && formData.region && (
              <HospitalCodeGeneratorEnhanced
                doctorId="temp-doctor-id" // 실제로는 현재 사용자 ID 사용
                hospitalName={formData.hospitalName}
                hospitalType={formData.hospitalType}
                region={formData.region}
                address={formData.address}
                phoneNumber={formData.hospitalPhone}
                registrationNumber={formData.registrationNumber}
                medicalLicenseNumber={formData.medicalLicenseNumber}
                onCodeGenerated={handleHospitalCodeGenerated}
                onGenerationError={handleHospitalCodeError}
              />
            )}
          </div>

          {/* 다음 버튼 */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevStep}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading || isSubmitting}
            >
              이전
            </button>
            
            <button
              onClick={handleNextStep}
              disabled={!generatedHospitalCode || isLoading || isSubmitting}
              className={`
                px-6 py-3 rounded-lg font-medium transition-colors
                ${!generatedHospitalCode || isLoading || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              다음: 구독 플랜 선택
            </button>
          </div>
        </div>
      ) : (
        /* 2단계: 구독 플랜 선택 */
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">구독 플랜을 선택해주세요</h3>
            <p className="text-gray-600">언제든지 플랜을 변경하실 수 있습니다.</p>
          </div>

          {/* 구독 플랜 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptionPlans.map(plan => (
              <div
                key={plan.planId}
                className={`
                  relative border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg
                  ${subscriptionData.planId === plan.planId
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                  }
                  ${plan.recommended ? 'ring-2 ring-blue-200 shadow-lg' : ''}
                `}
                onClick={() => handlePlanSelect(plan)}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                      추천
                    </span>
                  </div>
                )}

                {subscriptionData.planId === plan.planId && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{plan.planName}</h4>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price.toLocaleString()}원
                    </span>
                    <span className="text-gray-500">/{plan.duration}</span>
                    
                    {plan.originalPrice && plan.originalPrice > plan.price && (
                      <div className="text-sm text-gray-500 mt-1">
                        <span className="line-through">{plan.originalPrice.toLocaleString()}원</span>
                        <span className="text-red-500 ml-2">{plan.discount}% 할인</span>
                      </div>
                    )}
                  </div>

                  <ul className="text-sm text-gray-600 space-y-2">
                    {plan.features?.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* 최종 제출 버튼 */}
          <div className="flex justify-between pt-6">
            <button
              onClick={handlePrevStep}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading || isSubmitting}
            >
              이전
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={!subscriptionData.planId || isLoading || isSubmitting}
              className={`
                px-6 py-3 rounded-lg font-medium transition-colors
                ${!subscriptionData.planId || isLoading || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {isLoading || isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>가입 중...</span>
                </div>
              ) : (
                '회원가입 완료'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}