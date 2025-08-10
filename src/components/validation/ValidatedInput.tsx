'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useFieldValidation } from '@/hooks/useValidation'

interface ValidatedInputProps {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time'
  placeholder?: string
  value: string | number
  onChange: (value: string | number) => void
  onBlur?: () => void
  schema: z.ZodSchema<any>
  required?: boolean
  disabled?: boolean
  className?: string
  showValidationIcon?: boolean
  validateOnChange?: boolean
  validateOnBlur?: boolean
  debounceMs?: number
  helpText?: string
  autoComplete?: string
}

export default function ValidatedInput({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  schema,
  required = false,
  disabled = false,
  className = '',
  showValidationIcon = true,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  helpText,
  autoComplete
}: ValidatedInputProps) {
  const [internalValue, setInternalValue] = useState(value)
  const [isDirty, setIsDirty] = useState(false)

  const {
    error,
    isValid,
    isValidating,
    touched,
    handleChange,
    handleBlur,
    setTouched
  } = useFieldValidation(schema, name, internalValue)

  // 외부 value 변경 시 내부 상태 동기화
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // 값 변경 처리
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value
    setInternalValue(newValue)
    setIsDirty(true)
    
    if (validateOnChange) {
      handleChange(newValue)
    }
    
    onChange(newValue)
  }, [type, validateOnChange, handleChange, onChange])

  // 블러 처리
  const handleInputBlur = useCallback(() => {
    if (validateOnBlur && isDirty) {
      handleBlur()
    }
    onBlur?.()
  }, [validateOnBlur, isDirty, handleBlur, onBlur])

  // 포커스 처리
  const handleInputFocus = useCallback(() => {
    if (!touched) {
      setTouched(true)
    }
  }, [touched, setTouched])

  // 검증 상태에 따른 스타일 클래스
  const getInputClassName = () => {
    const baseClass = `
      w-full px-3 py-2 border rounded-lg transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-100 disabled:cursor-not-allowed
    `.replace(/\s+/g, ' ').trim()
    
    let statusClass = 'border-gray-300'
    
    if (touched && isDirty) {
      if (isValidating) {
        statusClass = 'border-yellow-300 bg-yellow-50'
      } else if (error) {
        statusClass = 'border-red-300 bg-red-50'
      } else if (isValid) {
        statusClass = 'border-green-300 bg-green-50'
      }
    }
    
    return `${baseClass} ${statusClass} ${className}`
  }

  // 검증 아이콘 렌더링
  const renderValidationIcon = () => {
    if (!showValidationIcon || !touched || !isDirty) return null

    if (isValidating) {
      return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
    }
    
    if (error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    
    if (isValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    
    return null
  }

  return (
    <div className="space-y-1">
      {/* 라벨 */}
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* 입력 필드 */}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={internalValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={getInputClassName()}
          aria-invalid={touched && !!error}
          aria-describedby={`${name}-error ${name}-help`}
        />
        
        {/* 검증 아이콘 */}
        {showValidationIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {renderValidationIcon()}
          </div>
        )}
      </div>

      {/* 오류 메시지 */}
      {touched && error && (
        <p id={`${name}-error`} className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}

      {/* 도움말 텍스트 */}
      {helpText && !error && (
        <p id={`${name}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  )
}

// 검증된 텍스트 영역 컴포넌트
interface ValidatedTextareaProps extends Omit<ValidatedInputProps, 'type'> {
  rows?: number
  maxLength?: number
  showCharCount?: boolean
}

export function ValidatedTextarea({
  name,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  schema,
  required = false,
  disabled = false,
  className = '',
  rows = 4,
  maxLength,
  showCharCount = false,
  helpText,
  ...validationProps
}: ValidatedTextareaProps) {
  const [internalValue, setInternalValue] = useState(value as string)
  const [isDirty, setIsDirty] = useState(false)

  const {
    error,
    isValid,
    isValidating,
    touched,
    handleChange,
    handleBlur,
    setTouched
  } = useFieldValidation(schema, name, internalValue)

  useEffect(() => {
    setInternalValue(value as string)
  }, [value])

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    setIsDirty(true)
    
    if (validationProps.validateOnChange !== false) {
      handleChange(newValue)
    }
    
    onChange(newValue)
  }, [handleChange, onChange, validationProps.validateOnChange])

  const handleTextareaBlur = useCallback(() => {
    if (validationProps.validateOnBlur !== false && isDirty) {
      handleBlur()
    }
    onBlur?.()
  }, [validationProps.validateOnBlur, isDirty, handleBlur, onBlur])

  const getTextareaClassName = () => {
    const baseClass = `
      w-full px-3 py-2 border rounded-lg transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical
    `.replace(/\s+/g, ' ').trim()
    
    let statusClass = 'border-gray-300'
    
    if (touched && isDirty) {
      if (isValidating) {
        statusClass = 'border-yellow-300 bg-yellow-50'
      } else if (error) {
        statusClass = 'border-red-300 bg-red-50'
      } else if (isValid) {
        statusClass = 'border-green-300 bg-green-50'
      }
    }
    
    return `${baseClass} ${statusClass} ${className}`
  }

  const currentLength = (internalValue as string).length
  const isOverLimit = maxLength && currentLength > maxLength

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <textarea
          id={name}
          name={name}
          value={internalValue}
          onChange={handleTextareaChange}
          onBlur={handleTextareaBlur}
          onFocus={() => !touched && setTouched(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={getTextareaClassName()}
          aria-invalid={touched && !!error}
          aria-describedby={`${name}-error ${name}-help`}
        />
        
        {isValidating && (
          <div className="absolute top-2 right-2">
            <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
          </div>
        )}
      </div>

      {/* 글자 수 표시 */}
      {showCharCount && maxLength && (
        <div className="flex justify-end">
          <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
            {currentLength}/{maxLength}
          </span>
        </div>
      )}

      {/* 오류 메시지 */}
      {touched && error && (
        <p id={`${name}-error`} className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}

      {/* 도움말 텍스트 */}
      {helpText && !error && (
        <p id={`${name}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  )
}

// 검증된 선택 박스 컴포넌트
interface ValidatedSelectProps extends Omit<ValidatedInputProps, 'type' | 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; disabled?: boolean }>
  emptyOption?: string
}

export function ValidatedSelect({
  name,
  label,
  value,
  onChange,
  onBlur,
  schema,
  options,
  emptyOption,
  required = false,
  disabled = false,
  className = '',
  helpText,
  ...validationProps
}: ValidatedSelectProps) {
  const [isDirty, setIsDirty] = useState(false)

  const {
    error,
    isValid,
    isValidating,
    touched,
    handleChange,
    handleBlur,
    setTouched
  } = useFieldValidation(schema, name, value)

  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    setIsDirty(true)
    
    if (validationProps.validateOnChange !== false) {
      handleChange(newValue)
    }
    
    onChange(newValue)
  }, [handleChange, onChange, validationProps.validateOnChange])

  const handleSelectBlur = useCallback(() => {
    if (validationProps.validateOnBlur !== false && isDirty) {
      handleBlur()
    }
    onBlur?.()
  }, [validationProps.validateOnBlur, isDirty, handleBlur, onBlur])

  const getSelectClassName = () => {
    const baseClass = `
      w-full px-3 py-2 border rounded-lg transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-100 disabled:cursor-not-allowed
    `.replace(/\s+/g, ' ').trim()
    
    let statusClass = 'border-gray-300'
    
    if (touched && isDirty) {
      if (isValidating) {
        statusClass = 'border-yellow-300 bg-yellow-50'
      } else if (error) {
        statusClass = 'border-red-300 bg-red-50'
      } else if (isValid) {
        statusClass = 'border-green-300 bg-green-50'
      }
    }
    
    return `${baseClass} ${statusClass} ${className}`
  }

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleSelectChange}
          onBlur={handleSelectBlur}
          onFocus={() => !touched && setTouched(true)}
          disabled={disabled}
          required={required}
          className={getSelectClassName()}
          aria-invalid={touched && !!error}
          aria-describedby={`${name}-error ${name}-help`}
        >
          {emptyOption && (
            <option value="" disabled={required}>
              {emptyOption}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {isValidating && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
          </div>
        )}
      </div>

      {/* 오류 메시지 */}
      {touched && error && (
        <p id={`${name}-error`} className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}

      {/* 도움말 텍스트 */}
      {helpText && !error && (
        <p id={`${name}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  )
}