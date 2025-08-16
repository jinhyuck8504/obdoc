'use client'

import React, { useState, useEffect } from 'react'
import { HospitalData, InviteCodeValidationResult, InviteCodeFormatValidation, InviteCodeSecurityCheck } from '@/types/hospital'
import { 
  validateInviteCodeRealtime, 
  validateInviteCodeFormatRealtime, 
  checkInviteCodeSecurity 
} from '@/lib/inviteCodeService'
import { useInviteCodeErrorHandler } from '@/hooks/useErrorHandler'
import { userFeedbackSystem } from '@/lib/feedback/userFeedbackSystem'
import ErrorFeedbackModal from '@/components/feedback/ErrorFeedbackModal'
// LoadingSpinner 컴포넌트 (인라인)
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

interface InviteCodeValidatorProps {
  onCodeValidated: (hospitalInfo: HospitalData, code: string) => void
  onValidationError: (error: string) => void
  isValidating?: boolean
  className?: string
  autoFocus?: boolean
  showHelpText?: boolean
  allowManualValidation?: boolean
  onCodeChange?: (code: string, isValid: boolean) => void
}

export default function InviteCodeValidator({
  onCodeValidated,
  onValidationError,
  isValidating = false,
  className = '',
  autoFocus = false,
  showHelpText = true,
  allowManualValidation = true,
  onCodeChange
}: InviteCodeValidatorProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validatedHospital, setValidatedHospital] = useState<HospitalData | null>(null)
  const [formatValidation, setFormatValidation] = useState<InviteCodeFormatValidation | null>(null)
  const [securityCheck, setSecurityCheck] = useState<InviteCodeSecurityCheck | null>(null)
  const [isRealtimeValidating, setIsRealtimeValidating] = useState(false)
  const [validationHistory, setValidationHistory] = useState<string[]>([])
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  
  // 에러 처리 훅
  const { 
    error: processedError, 
    showErrorModal, 
    handleError, 
    closeErrorModal 
  } = useInviteCodeErrorHandler()

  // 실시간 형식 검증 및 보안 검사
  useEffect(() => {
    if (code.length > 0) {
      // 형식 검증
      const formatResult = validateInviteCodeFormatRealtime(code)
      setFormatValidation(formatResult)
      
      // 보안 강도 검사
      const securityResult = checkInviteCodeSecurity(code)
      setSecurityCheck(securityResult)
      
      // 에러 상태 업데이트
      if (error && formatResult.isValid) {
        setError(null)
      }

      // 부모 컴포넌트에 코드 변경 알림
      if (onCodeChange) {
        onCodeChange(code, formatResult.isValid)
      }

      // 실시간 검증 (디바운싱 적용)
      if (formatResult.isValid && code.length >= 20) {
        setIsRealtimeValidating(true)
        
        const performRealtimeValidation = async () => {
          try {
            const ipAddress = await fetch('/api/client-info')
              .then(res => res.json())
              .then(data => data.ip)
              .catch(() => '')

            const result = await validateInviteCodeRealtime(
              code,
              ipAddress,
              navigator.userAgent,
              1000 // 1초 디바운싱
            )

            if (result.isValid && result.hospitalInfo) {
              setValidatedHospital(result.hospitalInfo)
              setError(null)
            } else if (!result.isValid && result.error) {
              // 실시간 검증 실패는 에러로 표시하지 않음 (사용자가 아직 입력 중일 수 있음)
              if (code === result.error) { // 완전히 입력이 끝난 경우만
                setError(result.error)
              }
            }
          } catch (error) {
            console.error('실시간 검증 오류:', error)
          } finally {
            setIsRealtimeValidating(false)
          }
        }

        performRealtimeValidation()
      } else {
        setIsRealtimeValidating(false)
      }
    } else {
      setFormatValidation(null)
      setSecurityCheck(null)
      setError(null)
      setIsRealtimeValidating(false)
    }
  }, [code, error])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    setCode(value)
    
    // 이전 검증 결과 초기화
    if (validatedHospital) {
      setValidatedHospital(null)
    }
    setFormatValidation(null)
    setSecurityCheck(null)
  }

  const handleInputFocus = () => {
    setInputFocused(true)
  }

  const handleInputBlur = () => {
    setInputFocused(false)
  }

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const cleanedText = text.toUpperCase().replace(/[^A-Z0-9-]/g, '')
      if (cleanedText) {
        setCode(cleanedText)
      }
    } catch (error) {
      console.error('클립보드 읽기 실패:', error)
    }
  }

  const handleCopyCode = async () => {
    if (code) {
      try {
        await navigator.clipboard.writeText(code)
        // 간단한 피드백 (실제로는 toast 알림 등을 사용할 수 있음)
        console.log('코드가 클립보드에 복사되었습니다.')
      } catch (error) {
        console.error('클립보드 복사 실패:', error)
      }
    }
  }

  const handleValidateCode = async () => {
    if (!code.trim()) {
      setError('가입 코드를 입력해주세요.')
      onValidationError('가입 코드를 입력해주세요.')
      return
    }

    const formatCheck = validateInviteCodeFormatRealtime(code)
    if (!formatCheck.isValid) {
      const errorMessage = formatCheck.errors[0] || '가입 코드 형식이 올바르지 않습니다.'
      setError(errorMessage)
      onValidationError(errorMessage)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // IP 주소와 User Agent 정보 수집
      const ipAddress = await fetch('/api/client-info')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => '')

      const userAgent = navigator.userAgent

      const result: InviteCodeValidationResult = await validateInviteCodeRealtime(
        code,
        ipAddress,
        userAgent,
        0 // 즉시 검증 (디바운싱 없음)
      )

      if (result.isValid && result.hospitalInfo) {
        setValidatedHospital(result.hospitalInfo)
        setError(null)
        
        // 성공한 검증 기록 추가
        setValidationHistory(prev => {
          const newHistory = [code, ...prev.filter(c => c !== code)].slice(0, 3) // 최근 3개만 유지
          return newHistory
        })
        
        onCodeValidated(result.hospitalInfo, code)
      } else {
        const errorMessage = result.error || '가입 코드 검증에 실패했습니다.'
        setError(errorMessage)
        onValidationError(errorMessage)
        setValidatedHospital(null)
      }
    } catch (error) {
      console.error('가입 코드 검증 중 오류:', error)
      
      // 고급 에러 처리
      await handleError(error, 'invite_code_validation', {
        inviteCode: code,
        formatValidation: formatCheck,
        securityCheck
      })
      
      // 사용자 피드백 수집
      await userFeedbackSystem.collectInviteCodeFeedback(
        'difficult',
        `가입 코드 검증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        undefined,
        code
      )
      
      const errorMessage = '가입 코드 검증 중 오류가 발생했습니다.'
      setError(errorMessage)
      onValidationError(errorMessage)
      setValidatedHospital(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allowManualValidation) {
      e.preventDefault()
      handleValidateCode()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+V 또는 Cmd+V로 붙여넣기
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      // 기본 붙여넣기 동작 후 처리
      setTimeout(() => {
        const input = e.target as HTMLInputElement
        const cleanedValue = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
        if (cleanedValue !== input.value) {
          setCode(cleanedValue)
        }
      }, 0)
    }
    
    // Escape로 초기화
    if (e.key === 'Escape') {
      handleReset()
    }
  }

  const handleReset = () => {
    setCode('')
    setError(null)
    setValidatedHospital(null)
    setFormatValidation(null)
    setSecurityCheck(null)
    setIsRealtimeValidating(false)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 가입 코드 입력 섹션 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700">
            병원 가입 코드 <span className="text-red-500">*</span>
          </label>
          
          {/* 고급 옵션 토글 */}
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {showAdvancedOptions ? '간단히 보기' : '고급 옵션'}
          </button>
        </div>
        
        <div className="relative">
          <input
            id="invite-code"
            type="text"
            value={code}
            onChange={handleCodeChange}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="예: OB-SEOUL-CLINIC-001-202401-A7B9X2K5"
            autoFocus={autoFocus}
            autoComplete="off"
            spellCheck={false}
            aria-describedby="invite-code-help invite-code-error"
            aria-invalid={error ? 'true' : 'false'}
            className={`
              w-full px-4 py-3 pr-16 border rounded-lg font-mono text-sm transition-all duration-200
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              ${validatedHospital ? 'border-green-300 bg-green-50' : ''}
              ${isLoading || isValidating ? 'opacity-50' : ''}
              ${inputFocused ? 'shadow-lg' : ''}
            `}
            disabled={isLoading || isValidating}
            maxLength={50}
          />
          
          {/* 검증 상태 아이콘 */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
            {/* 실시간 검증 로딩 */}
            {isRealtimeValidating && (
              <div className="w-4 h-4">
                <LoadingSpinner size="xs" />
              </div>
            )}
            
            {/* 메인 상태 아이콘 */}
            {isLoading || isValidating ? (
              <LoadingSpinner size="sm" />
            ) : validatedHospital ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : error ? (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : formatValidation?.isValid ? (
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : null}
          </div>
        </div>

        {/* 고급 옵션 */}
        {showAdvancedOptions && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">빠른 작업</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handlePasteCode}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  붙여넣기
                </button>
                {code && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    복사
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  초기화
                </button>
              </div>
            </div>
            
            {/* 최근 검증 기록 */}
            {validationHistory.length > 0 && (
              <div className="text-xs">
                <span className="font-medium text-gray-700 block mb-1">최근 사용한 코드:</span>
                <div className="flex flex-wrap gap-1">
                  {validationHistory.map((historyCode, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCode(historyCode)}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors font-mono text-xs"
                      title={`${historyCode} 사용하기`}
                    >
                      {historyCode.slice(0, 15)}...
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 실시간 형식 검증 피드백 */}
        {formatValidation && !formatValidation.isValid && code.length > 5 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="space-y-2">
              {formatValidation.errors.map((error, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <svg className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              ))}
              
              {formatValidation.suggestions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-200">
                  <p className="font-medium mb-1">도움말:</p>
                  {formatValidation.suggestions.map((suggestion, index) => (
                    <p key={index} className="text-amber-700">{suggestion}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 보안 강도 표시 */}
        {securityCheck && code.length > 10 && (
          <div className={`text-xs p-2 rounded-lg border ${
            securityCheck.strength === 'strong' ? 'bg-green-50 border-green-200 text-green-700' :
            securityCheck.strength === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">
                보안 강도: {
                  securityCheck.strength === 'strong' ? '강함' :
                  securityCheck.strength === 'medium' ? '보통' : '약함'
                }
              </span>
              <span className="text-xs opacity-75">
                {securityCheck.score}/100
              </span>
            </div>
            
            {/* 보안 강도 바 */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  securityCheck.strength === 'strong' ? 'bg-green-500' :
                  securityCheck.strength === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(securityCheck.score, 100)}%` }}
              ></div>
            </div>

            {securityCheck.issues.length > 0 && (
              <div className="space-y-1">
                {securityCheck.issues.slice(0, 2).map((issue, index) => (
                  <p key={index} className="text-xs opacity-90">• {issue}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div id="invite-code-error" className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 검증 버튼 */}
      {!validatedHospital && allowManualValidation && (
        <button
          onClick={handleValidateCode}
          disabled={!code.trim() || isLoading || isValidating || !formatValidation?.isValid}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
            ${!code.trim() || isLoading || isValidating || !formatValidation?.isValid
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            }
          `}
          aria-describedby={error ? 'invite-code-error' : undefined}
        >
          {isLoading || isValidating ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>검증 중...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>가입 코드 확인</span>
            </div>
          )}
        </button>
      )}

      {/* 자동 검증 모드 안내 */}
      {!allowManualValidation && !validatedHospital && (
        <div className="text-center py-2">
          <div className="inline-flex items-center space-x-2 text-sm text-blue-600">
            <LoadingSpinner size="xs" />
            <span>입력하시면 자동으로 검증됩니다</span>
          </div>
        </div>
      )}

      {/* 검증된 병원 정보 표시 */}
      {validatedHospital && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">가입 코드가 확인되었습니다</span>
            </div>
            
            <button
              onClick={handleReset}
              className="text-xs text-green-600 hover:text-green-800 underline"
            >
              다시 입력
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">병원명:</span>
                <p className="font-medium text-gray-900">{validatedHospital.hospitalName}</p>
              </div>
              <div>
                <span className="text-gray-600">병원 유형:</span>
                <p className="font-medium text-gray-900">
                  {validatedHospital.hospitalType === 'clinic' && '의원'}
                  {validatedHospital.hospitalType === 'oriental_clinic' && '한의원'}
                  {validatedHospital.hospitalType === 'hospital' && '병원'}
                </p>
              </div>
            </div>
            
            {validatedHospital.address && (
              <div className="text-sm">
                <span className="text-gray-600">주소:</span>
                <p className="font-medium text-gray-900">{validatedHospital.address}</p>
              </div>
            )}
            
            <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
              이 병원의 가입 코드로 회원가입을 진행합니다.
            </div>
          </div>
        </div>
      )}

      {/* 도움말 */}
      {showHelpText && (
        <div id="invite-code-help" className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="space-y-1">
              <p>• 가입 코드는 병원에서 제공받으실 수 있습니다.</p>
              <p>• 가입 코드가 없으시면 병원에 문의해주세요.</p>
              <p>• 가입 코드는 대소문자를 구분하지 않습니다.</p>
              <p>• 코드 형식: OB-지역-병원유형-순번-년월-코드</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 에러 피드백 모달 */}
      <ErrorFeedbackModal
        error={processedError}
        isOpen={showErrorModal}
        onClose={closeErrorModal}
      />
    </div>
  )
}

// QR 코드 스캐너 컴포넌트 (간단한 구현)
const QRCodeScanner = ({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 실제 구현에서는 QR 코드 라이브러리를 사용해야 합니다
    // 여기서는 파일명에서 코드를 추출하는 간단한 예시입니다
    const reader = new FileReader()
    reader.onload = (event) => {
      // 실제로는 QR 코드 디코딩 라이브러리 사용
      // 예: jsQR, qr-scanner 등
      const mockCode = 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5' // 임시 코드
      onScan(mockCode)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">QR 코드 스캔</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            QR 코드 이미지를 업로드하거나 카메라로 스캔하세요.
          </div>

          {/* 파일 업로드 */}
          <div>
            <label className="block w-full">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">QR 코드 이미지 업로드</p>
              </div>
            </label>
          </div>

          {/* 카메라 스캔 (실제 구현 필요) */}
          <button
            onClick={() => {
              setError('카메라 스캔 기능은 준비 중입니다.')
            }}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isScanning}
          >
            {isScanning ? '스캔 중...' : '카메라로 스캔'}
          </button>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 접근성 개선된 InviteCodeValidator 확장
export const AccessibleInviteCodeValidator = (props: InviteCodeValidatorProps & {
  enableQRScanner?: boolean
  enableVoiceInput?: boolean
  enableKeyboardShortcuts?: boolean
}) => {
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const handleQRScan = (code: string) => {
    // QR 코드에서 스캔된 코드를 설정
    // 실제 구현에서는 props를 통해 부모 컴포넌트에 전달
    setShowQRScanner(false)
    console.log('QR 코드 스캔됨:', code)
  }

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('음성 인식이 지원되지 않는 브라우저입니다.')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'ko-KR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      const cleanedCode = transcript.toUpperCase().replace(/[^A-Z0-9-]/g, '')
      console.log('음성 입력 결과:', cleanedCode)
      // 실제 구현에서는 코드를 설정하는 로직 추가
    }

    recognition.onerror = (event: any) => {
      console.error('음성 인식 오류:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  // 키보드 단축키 처리
  useEffect(() => {
    if (!props.enableKeyboardShortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Q: QR 스캐너 열기
      if ((e.ctrlKey || e.metaKey) && e.key === 'q' && props.enableQRScanner) {
        e.preventDefault()
        setShowQRScanner(true)
      }
      
      // Ctrl+M: 음성 입력 시작
      if ((e.ctrlKey || e.metaKey) && e.key === 'm' && props.enableVoiceInput) {
        e.preventDefault()
        handleVoiceInput()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [props.enableKeyboardShortcuts, props.enableQRScanner, props.enableVoiceInput])

  return (
    <div>
      <InviteCodeValidator {...props} />
      
      {/* 추가 입력 방법 */}
      {(props.enableQRScanner || props.enableVoiceInput) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900 mb-2">다른 입력 방법</div>
          <div className="flex space-x-2">
            {props.enableQRScanner && (
              <button
                onClick={() => setShowQRScanner(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                title="QR 코드 스캔 (Ctrl+Q)"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>QR 스캔</span>
              </button>
            )}
            
            {props.enableVoiceInput && (
              <button
                onClick={handleVoiceInput}
                disabled={isListening}
                className={`flex items-center space-x-1 px-3 py-1 text-xs rounded transition-colors ${
                  isListening 
                    ? 'bg-red-600 text-white' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title="음성 입력 (Ctrl+M)"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>{isListening ? '듣는 중...' : '음성 입력'}</span>
              </button>
            )}
          </div>
          
          {props.enableKeyboardShortcuts && (
            <div className="mt-2 text-xs text-blue-700">
              단축키: QR 스캔 (Ctrl+Q), 음성 입력 (Ctrl+M)
            </div>
          )}
        </div>
      )}

      {/* QR 스캐너 모달 */}
      {showQRScanner && (
        <QRCodeScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  )
}