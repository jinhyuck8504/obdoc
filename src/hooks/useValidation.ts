import { useState, useCallback, useMemo } from 'react'
import { z } from 'zod'
import { ValidationResult, validateSchema, FormValidator, debounce } from '@/lib/validation/utils'

// 검증 훅 옵션
interface UseValidationOptions {
  validateOnChange?: boolean
  validateOnBlur?: boolean
  debounceMs?: number
  showErrorsOnTouched?: boolean
}

// 검증 훅
export function useValidation<T>(
  schema: z.ZodSchema<T>,
  options: UseValidationOptions = {}
) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
    showErrorsOnTouched = true
  } = options

  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isValidating, setIsValidating] = useState(false)

  // FormValidator 인스턴스 생성
  const validator = useMemo(() => new FormValidator(schema), [schema])

  // 디바운스된 검증 함수
  const debouncedValidate = useMemo(
    () => debounce((fieldName: string, value: unknown) => {
      setIsValidating(true)
      const isValid = validator.validateField(fieldName, value)
      setErrors(prev => ({
        ...prev,
        [fieldName]: isValid ? [] : validator.getAllErrors()[fieldName] || []
      }))
      setIsValidating(false)
    }, debounceMs),
    [validator, debounceMs]
  )

  // 전체 폼 검증
  const validateForm = useCallback((data: unknown): ValidationResult<T> => {
    setIsValidating(true)
    const result = validateSchema(schema, data)

    if (!result.success && result.errors) {
      setErrors(result.errors)
      // 모든 필드를 touched로 설정
      const touchedFields: Record<string, boolean> = {}
      Object.keys(result.errors).forEach(field => {
        touchedFields[field] = true
      })
      setTouched(prev => ({ ...prev, ...touchedFields }))
    } else {
      setErrors({})
    }

    setIsValidating(false)
    return result
  }, [schema])

  // 개별 필드 검증
  const validateField = useCallback((fieldName: string, value: unknown) => {
    if (validateOnChange) {
      debouncedValidate(fieldName, value)
    }
  }, [validateOnChange, debouncedValidate])

  // 필드 블러 처리
  const handleFieldBlur = useCallback((fieldName: string, value: unknown) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))

    if (validateOnBlur) {
      setIsValidating(true)
      const isValid = validator.validateField(fieldName, value)
      setErrors(prev => ({
        ...prev,
        [fieldName]: isValid ? [] : validator.getAllErrors()[fieldName] || []
      }))
      setIsValidating(false)
    }
  }, [validateOnBlur, validator])

  // 필드 오류 가져오기
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    if (showErrorsOnTouched && !touched[fieldName]) {
      return undefined
    }
    return errors[fieldName]?.[0]
  }, [errors, touched, showErrorsOnTouched])

  // 필드 유효성 확인
  const isFieldValid = useCallback((fieldName: string): boolean => {
    if (showErrorsOnTouched && !touched[fieldName]) {
      return true
    }
    return !errors[fieldName] || errors[fieldName].length === 0
  }, [errors, touched, showErrorsOnTouched])

  // 전체 폼 유효성 확인
  const isFormValid = useMemo(() => {
    return Object.keys(errors).every(field =>
      !errors[field] || errors[field].length === 0
    )
  }, [errors])

  // 오류 초기화
  const clearErrors = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  // 특정 필드 오류 초기화
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
    setTouched(prev => {
      const newTouched = { ...prev }
      delete newTouched[fieldName]
      return newTouched
    })
  }, [])

  // 필드 터치 상태 설정
  const setFieldTouched = useCallback((fieldName: string, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [fieldName]: isTouched }))
  }, [])

  return {
    // 검증 함수들
    validateForm,
    validateField,
    handleFieldBlur,

    // 상태
    errors,
    touched,
    isValidating,
    isFormValid,

    // 헬퍼 함수들
    getFieldError,
    isFieldValid,
    clearErrors,
    clearFieldError,
    setFieldTouched,

    // 유틸리티
    validator
  }
}

// 실시간 검증 훅
export function useRealtimeValidation<T>(
  schema: z.ZodSchema<T>,
  initialData?: Partial<T>
) {
  const [data, setData] = useState<Partial<T>>(initialData || {})
  const validation = useValidation(schema, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 500
  })

  // 필드 값 업데이트
  const updateField = useCallback((fieldName: keyof T, value: unknown) => {
    setData(prev => ({ ...prev, [fieldName]: value }))
    validation.validateField(fieldName as string, value)
  }, [validation])

  // 필드 블러 처리
  const handleBlur = useCallback((fieldName: keyof T) => {
    const value = data[fieldName]
    validation.handleFieldBlur(fieldName as string, value)
  }, [data, validation])

  // 전체 데이터 검증
  const validateAll = useCallback(() => {
    return validation.validateForm(data)
  }, [data, validation])

  return {
    data,
    updateField,
    handleBlur,
    validateAll,
    ...validation
  }
}

// 폼 필드 컴포넌트용 훅
export function useFieldValidation<T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown
) {
  const [error, setError] = useState<string | undefined>()
  const [touched, setTouched] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // 디바운스된 검증
  const debouncedValidate = useMemo(
    () => debounce((val: unknown) => {
      setIsValidating(true)
      try {
        // 부분 스키마로 해당 필드만 검증
        const fieldSchema = (schema as any).shape?.[fieldName]
        if (fieldSchema) {
          fieldSchema.parse(val)
          setError(undefined)
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          setError(err.issues[0]?.message)
        }
      } finally {
        setIsValidating(false)
      }
    }, 300),
    [schema, fieldName]
  )

  // 값 변경 시 검증
  const handleChange = useCallback((newValue: unknown) => {
    debouncedValidate(newValue)
  }, [debouncedValidate])

  // 블러 처리
  const handleBlur = useCallback(() => {
    setTouched(true)
    if (!touched) {
      debouncedValidate(value)
    }
  }, [touched, value, debouncedValidate])

  // 오류 표시 여부
  const shouldShowError = touched && error

  return {
    error: shouldShowError ? error : undefined,
    isValid: !error,
    isValidating,
    touched,
    handleChange,
    handleBlur,
    setTouched
  }
}

// 비동기 검증 훅 (서버 검증용)
export function useAsyncValidation<T>(
  schema: z.ZodSchema<T>,
  asyncValidator?: (data: T) => Promise<{ isValid: boolean; errors?: Record<string, string> }>
) {
  const [isAsyncValidating, setIsAsyncValidating] = useState(false)
  const [asyncErrors, setAsyncErrors] = useState<Record<string, string>>({})

  const validation = useValidation(schema)

  // 비동기 검증 실행
  const validateAsync = useCallback(async (data: unknown): Promise<ValidationResult<T>> => {
    // 먼저 동기 검증 실행
    const syncResult = validation.validateForm(data)

    if (!syncResult.success || !asyncValidator) {
      return syncResult
    }

    // 동기 검증 통과 시 비동기 검증 실행
    setIsAsyncValidating(true)
    setAsyncErrors({})

    try {
      const asyncResult = await asyncValidator(syncResult.data!)

      if (!asyncResult.isValid && asyncResult.errors) {
        setAsyncErrors(asyncResult.errors)
        // string을 string[]로 변환
        const formattedErrors: Record<string, string[]> = {}
        Object.entries(asyncResult.errors).forEach(([key, value]) => {
          formattedErrors[key] = [value]
        })
        return {
          success: false,
          errors: formattedErrors,
          message: '서버 검증에 실패했습니다'
        }
      }

      return syncResult
    } catch (error) {
      return {
        success: false,
        message: '서버 검증 중 오류가 발생했습니다'
      }
    } finally {
      setIsAsyncValidating(false)
    }
  }, [validation, asyncValidator])

  // 모든 오류 (동기 + 비동기)
  const allErrors = useMemo(() => ({
    ...validation.errors,
    ...Object.entries(asyncErrors).reduce((acc, [key, value]) => {
      acc[key] = [value]
      return acc
    }, {} as Record<string, string[]>)
  }), [validation.errors, asyncErrors])

  return {
    ...validation,
    validateAsync,
    isAsyncValidating,
    asyncErrors,
    allErrors,
    isFormValid: validation.isFormValid && Object.keys(asyncErrors).length === 0
  }
}

// 다단계 폼 검증 훅
export function useMultiStepValidation<T extends Record<string, any>>(
  schemas: Record<keyof T, z.ZodSchema<any>>,
  initialStep: keyof T = Object.keys(schemas)[0] as keyof T
) {
  const [currentStep, setCurrentStep] = useState<keyof T>(initialStep)
  const [stepData, setStepData] = useState<Partial<T>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<keyof T>>(new Set())

  // 현재 단계 스키마
  const currentSchema = schemas[currentStep]
  const validation = useValidation(currentSchema)

  // 단계 데이터 업데이트
  const updateStepData = useCallback((step: keyof T, data: any) => {
    setStepData(prev => ({ ...prev, [step]: data }))
  }, [])

  // 다음 단계로 이동
  const goToNextStep = useCallback((data: any) => {
    const result = validation.validateForm(data)

    if (result.success) {
      updateStepData(currentStep, result.data)
      setCompletedSteps(prev => new Set([...prev, currentStep]))

      const steps = Object.keys(schemas) as (keyof T)[]
      const currentIndex = steps.indexOf(currentStep)
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1])
      }
      return true
    }
    return false
  }, [validation, currentStep, schemas, updateStepData])

  // 이전 단계로 이동
  const goToPreviousStep = useCallback(() => {
    const steps = Object.keys(schemas) as (keyof T)[]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }, [currentStep, schemas])

  // 특정 단계로 이동
  const goToStep = useCallback((step: keyof T) => {
    setCurrentStep(step)
  }, [])

  // 전체 폼 검증
  const validateAllSteps = useCallback(() => {
    const results: Record<keyof T, ValidationResult<any>> = {} as any
    let isAllValid = true

    Object.entries(schemas).forEach(([step, schema]) => {
      const data = stepData[step as keyof T]
      const result = validateSchema(schema, data)
      results[step as keyof T] = result
      if (!result.success) {
        isAllValid = false
      }
    })

    return {
      isValid: isAllValid,
      results,
      data: stepData
    }
  }, [schemas, stepData])

  // 단계 완료 여부 확인
  const isStepCompleted = useCallback((step: keyof T) => {
    return completedSteps.has(step)
  }, [completedSteps])

  // 현재 단계가 마지막인지 확인
  const isLastStep = useMemo(() => {
    const steps = Object.keys(schemas) as (keyof T)[]
    return currentStep === steps[steps.length - 1]
  }, [currentStep, schemas])

  // 현재 단계가 첫 번째인지 확인
  const isFirstStep = useMemo(() => {
    const steps = Object.keys(schemas) as (keyof T)[]
    return currentStep === steps[0]
  }, [currentStep, schemas])

  return {
    // 현재 상태
    currentStep,
    stepData,
    completedSteps,

    // 단계 제어
    goToNextStep,
    goToPreviousStep,
    goToStep,

    // 데이터 관리
    updateStepData,

    // 검증
    validateAllSteps,
    ...validation,

    // 유틸리티
    isStepCompleted,
    isLastStep,
    isFirstStep,
    totalSteps: Object.keys(schemas).length,
    currentStepIndex: Object.keys(schemas).indexOf(currentStep as string)
  }
}