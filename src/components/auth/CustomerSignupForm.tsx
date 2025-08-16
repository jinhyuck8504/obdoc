'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import InviteCodeValidator from './InviteCodeValidator'
import { HospitalData } from '@/types/hospital'
import { useAuth } from '@/contexts/AuthContext'

// LoadingSpinner 컴포넌트
const LoadingSpinner = ({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-6 h-6'
  }
  
  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  )
}

interface CustomerSignupFormProps {
  onSuccess: () => void
  onBack?: () => void
  className?: string
}

export default function CustomerSignupForm({
  onSuccess,
  onBack,
  className = ''
}: CustomerSignupFormProps) {
  const router = useRouter()
  const { signUp } = useAuth()
  
  const [currentStep, setCurrentStep] = useState<'invite-code' | 'customer-info'>('invite-code')
  const [validatedHospital, setValidatedHospital] = useState<HospitalData | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 고객 정보 상태
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    birthDate: '',
    gender: '' as 'male' | 'female' | ''
  })
  
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)

  // 가입 코드 검증 성공 핸들러
  const handleCodeValidated = (hospitalInfo: HospitalData, code: string) => {
    setValidatedHospital(hospitalInfo)
    setInviteCode(code)
    setCurrentStep('customer-info')
    setError(null)
  }

  // 가입 코드 검증 실패 핸들러
  const handleValidationError = (errorMessage: string) => {
    setError(errorMessage)
    setValidatedHospital(null)
  }

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 에러 클리어
    if (error) {
      setError(null)
    }
  }

  // 폼 검증
  const validateForm = (): boolean => {
    const errors: string[] = []

    if (!formData.name.trim()) errors.push('이름을 입력해주세요.')
    if (!formData.email.trim()) errors.push('이메일을 입력해주세요.')
    if (!formData.password) errors.push('비밀번호를 입력해주세요.')
    if (formData.password !== formData.confirmPassword) errors.push('비밀번호가 일치하지 않습니다.')
    if (!formData.phoneNumber.trim()) errors.push('전화번호를 입력해주세요.')
    if (!agreedToTerms) errors.push('서비스 이용약관에 동의해주세요.')
    if (!agreedToPrivacy) errors.push('개인정보 처리방침에 동의해주세요.')

    if (errors.length > 0) {
      setError(errors[0])
      return false
    }

    return true
  }

  // 가입 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (!validatedHospital || !inviteCode) {
      setError('가입 코드 검증이 필요합니다.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const signupData = {
        ...formData,
        role: 'customer' as const,
        hospitalCode: validatedHospital.hospitalCode,
        inviteCode: inviteCode
      }

      await signUp(signupData)
      onSuccess()
    } catch (error) {
      console.error('고객 가입 실패:', error)
      setError(error instanceof Error ? error.message : '가입 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 뒤로 가기
  const handleBack = () => {
    if (currentStep === 'customer-info') {
      setCurrentStep('invite-code')
    } else if (onBack) {
      onBack()
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 진행 상황 표시 */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${
          currentStep === 'invite-code' ? 'text-blue-600' : 'text-green-600'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'invite-code' ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            {currentStep === 'invite-code' ? '1' : '✓'}
          </div>
          <span className="text-sm font-medium">가입 코드 확인</span>
        </div>
        
        <div className={`w-8 h-0.5 ${
          currentStep === 'customer-info' ? 'bg-blue-600' : 'bg-gray-300'
        }`}></div>
        
        <div className={`flex items-center space-x-2 ${
          currentStep === 'customer-info' ? 'text-blue-600' : 'text-gray-400'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'customer-info' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            2
          </div>
          <span className="text-sm font-medium">개인 정보 입력</span>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* 1단계: 가입 코드 검증 */}
      {currentStep === 'invite-code' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">고객 회원가입</h2>
            <p className="text-gray-600">
              병원에서 제공받은 가입 코드를 입력해주세요.
            </p>
          </div>

          <InviteCodeValidator
            onCodeValidated={handleCodeValidated}
            onValidationError={handleValidationError}
            isValidating={isLoading}
            autoFocus={true}
            showHelpText={true}
            allowManualValidation={true}
          />
        </div>
      )}

      {/* 2단계: 고객 정보 입력 */}
      {currentStep === 'customer-info' && validatedHospital && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">개인 정보 입력</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                <strong>{validatedHospital.hospitalName}</strong>의 고객으로 가입합니다.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="홍길동"
                  disabled={isLoading || isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8자 이상 입력해주세요"
                  disabled={isLoading || isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호를 다시 입력해주세요"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="010-1234-5678"
                  disabled={isLoading || isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                  생년월일
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading || isSubmitting}
                  />
                  <span className="text-sm text-gray-700">남성</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading || isSubmitting}
                  />
                  <span className="text-sm text-gray-700">여성</span>
                </label>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 pt-4 border-t">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading || isSubmitting}
                />
                <div className="text-sm">
                  <span className="text-gray-900">
                    <span className="text-red-500">*</span> 서비스 이용약관에 동의합니다
                  </span>
                  <button
                    type="button"
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    onClick={() => window.open('/terms', '_blank')}
                  >
                    보기
                  </button>
                </div>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading || isSubmitting}
                />
                <div className="text-sm">
                  <span className="text-gray-900">
                    <span className="text-red-500">*</span> 개인정보 처리방침에 동의합니다
                  </span>
                  <button
                    type="button"
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    onClick={() => window.open('/privacy', '_blank')}
                  >
                    보기
                  </button>
                </div>
              </label>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting || !agreedToTerms || !agreedToPrivacy}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isLoading || isSubmitting || !agreedToTerms || !agreedToPrivacy
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading || isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>가입 중...</span>
                </div>
              ) : (
                '회원가입 완료'
              )}
            </button>
          </form>
        </div>
      )}

      {/* 뒤로 가기 버튼 */}
      {onBack && (
        <div className="text-center">
          <button
            onClick={handleBack}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isLoading || isSubmitting}
          >
            ← 역할 선택으로 돌아가기
          </button>
        </div>
      )}
    </div>
  )
}