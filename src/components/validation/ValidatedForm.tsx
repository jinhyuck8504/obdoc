'use client'
import React, { useState, useCallback, useRef } from 'react'
import { z } from 'zod'
import { AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react'
import { useValidation } from '@/hooks/useValidation'

interface ValidatedFormProps<T> {
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => Promise<void> | void
  onError?: (errors: Record<string, string[]>) => void
  children: React.ReactNode
  className?: string
  validateOnChange?: boolean
  validateOnBlur?: boolean
  showErrorSummary?: boolean
  submitButtonText?: string
  submitButtonClassName?: string
  disabled?: boolean
  resetOnSubmit?: boolean
}

export default function ValidatedForm<T>({
  schema,
  onSubmit,
  onError,
  children,
  className = '',
  validateOnChange = true,
  validateOnBlur = true,
  showErrorSummary = true,
  submitButtonText = '제출',
  submitButtonClassName = '',
  disabled = false,
  resetOnSubmit = false
}: ValidatedFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const validation = useValidation(schema, {
    validateOnChange,
    validateOnBlur,
    showErrorsOnTouched: true
  })

  // 폼 제출 처리
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (disabled || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      // 폼 데이터 수집
      const formData = new FormData(e.currentTarget)
      const data = Object.fromEntries(formData.entries())
      
      // 체크박스 처리 (체크되지 않은 경우 false로 설정)
      const checkboxes = e.currentTarget.querySelectorAll('input[type="checkbox"]')
      checkboxes.forEach((checkbox) => {
        const input = checkbox as HTMLInputElement
        if (!data.hasOwnProperty(input.name)) {
          data[input.name] = 'false'
        }
      })

      // 숫자 필드 변환
      const numberInputs = e.currentTarget.querySelectorAll('input[type="number"]')
      numberInputs.forEach((input) => {
        const numberInput = input as HTMLInputElement
        if (data[numberInput.name]) {
          data[numberInput.name] = Number(data[numberInput.name])
        }
      })

      // 검증 실행
      const result = validation.validateForm(data)
      
      if (!result.success) {
        onError?.(result.errors || {})
        return
      }

      // 제출 실행
      await onSubmit(result.data!)
      
      setSubmitSuccess(true)
      
      // 성공 시 폼 리셋
      if (resetOnSubmit) {
        formRef.current?.reset()
        validation.clearErrors()
      }
      
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : '폼 제출 중 오류가 발생했습니다'
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [disabled, isSubmitting, validation, onSubmit, onError, resetOnSubmit])

  // 오류 요약 렌더링
  const renderErrorSummary = () => {
    if (!showErrorSummary || validation.isFormValid) return null

    const errorEntries = Object.entries(validation.errors)
    if (errorEntries.length === 0) return null

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-sm font-medium text-red-800">
            입력 오류가 있습니다
          </h3>
        </div>
        <ul className="text-sm text-red-700 space-y-1">
          {errorEntries.map(([field, errors]) => (
            <li key={field} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{errors[0]}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // 제출 오류 렌더링
  const renderSubmitError = () => {
    if (!submitError) return null

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              {submitError}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // 성공 메시지 렌더링
  const renderSuccessMessage = () => {
    if (!submitSuccess) return null

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              성공적으로 제출되었습니다
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitSuccess(false)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // 제출 버튼 클래스명
  const getSubmitButtonClassName = () => {
    const baseClass = `
      w-full flex items-center justify-center px-4 py-2 border border-transparent 
      text-sm font-medium rounded-lg transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `
    
    const statusClass = disabled || isSubmitting || !validation.isFormValid
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
    
    return `${baseClass} ${statusClass} ${submitButtonClassName}`
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate
    >
      {/* 성공 메시지 */}
      {renderSuccessMessage()}
      
      {/* 제출 오류 */}
      {renderSubmitError()}
      
      {/* 오류 요약 */}
      {renderErrorSummary()}
      
      {/* 폼 필드들 */}
      <div className="space-y-4">
        {children}
      </div>
      
      {/* 제출 버튼 */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={disabled || isSubmitting || !validation.isFormValid}
          className={getSubmitButtonClassName()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              처리 중...
            </>
          ) : (
            submitButtonText
          )}
        </button>
      </div>
      
      {/* 폼 상태 디버그 정보 (개발 모드에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <div>Form Valid: {validation.isFormValid ? '✅' : '❌'}</div>
          <div>Validating: {validation.isValidating ? '⏳' : '✅'}</div>
          <div>Errors: {Object.keys(validation.errors).length}</div>
          <div>Touched: {Object.keys(validation.touched).length}</div>
        </div>
      )}
    </form>
  )
}

// 다단계 폼 컴포넌트
interface MultiStepFormProps<T extends Record<string, any>> {
  schemas: Record<keyof T, z.ZodSchema<any>>
  onSubmit: (data: T) => Promise<void> | void
  onStepChange?: (step: keyof T, data: any) => void
  children: Record<keyof T, React.ReactNode>
  className?: string
  showProgress?: boolean
  allowSkipSteps?: boolean
  stepTitles?: Record<keyof T, string>
}

export function MultiStepForm<T extends Record<string, any>>({
  schemas,
  onSubmit,
  onStepChange,
  children,
  className = '',
  showProgress = true,
  allowSkipSteps = false,
  stepTitles = {}
}: MultiStepFormProps<T>) {
  const [currentStepData, setCurrentStepData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 다단계 검증 훅 사용 (실제 구현에서는 useMultiStepValidation 사용)
  const steps = Object.keys(schemas) as (keyof T)[]
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = steps[currentStepIndex]
  const currentSchema = schemas[currentStep]
  
  const validation = useValidation(currentSchema)

  // 다음 단계로 이동
  const handleNextStep = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(formData.entries())
    
    const result = validation.validateForm(data)
    if (!result.success) return

    setCurrentStepData(result.data)
    onStepChange?.(currentStep, result.data)

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
      validation.clearErrors()
    } else {
      // 마지막 단계 - 전체 제출
      setIsSubmitting(true)
      try {
        const allData = { ...currentStepData, [currentStep]: result.data } as T
        await onSubmit(allData)
      } catch (error) {
        console.error('Multi-step form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [validation, currentStep, currentStepIndex, steps.length, onStepChange, onSubmit, currentStepData])

  // 이전 단계로 이동
  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
      validation.clearErrors()
    }
  }, [currentStepIndex, validation])

  // 특정 단계로 이동
  const goToStep = useCallback((stepIndex: number) => {
    if (allowSkipSteps && stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex)
      validation.clearErrors()
    }
  }, [allowSkipSteps, steps.length, validation])

  // 진행률 계산
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 진행률 표시 */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>단계 {currentStepIndex + 1} / {steps.length}</span>
            <span>{Math.round(progress)}% 완료</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* 단계 제목 */}
          {stepTitles[currentStep] && (
            <h2 className="text-lg font-semibold text-gray-900 mt-4">
              {stepTitles[currentStep]}
            </h2>
          )}
        </div>
      )}

      {/* 현재 단계 폼 */}
      <form onSubmit={handleNextStep} className="space-y-4">
        {children[currentStep]}
        
        {/* 네비게이션 버튼 */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handlePreviousStep}
            disabled={currentStepIndex === 0}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            이전
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || !validation.isFormValid}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : currentStepIndex === steps.length - 1 ? (
              '완료'
            ) : (
              '다음'
            )}
          </button>
        </div>
      </form>

      {/* 단계 네비게이션 (건너뛰기 허용 시) */}
      {allowSkipSteps && (
        <div className="flex justify-center space-x-2 pt-4">
          {steps.map((step, index) => (
            <button
              key={step as string}
              onClick={() => goToStep(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStepIndex
                  ? 'bg-blue-600'
                  : index < currentStepIndex
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              title={stepTitles[step] || `단계 ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}