'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { XSSProtection, InputValidator } from '@/lib/security'
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import Input from '@/components/ui/Input'

interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url'
  value: string
  onChange: (value: string, isValid: boolean) => void
  validation?: 'email' | 'phone' | 'password' | 'url' | 'business-number' | 'custom'
  customValidator?: (value: string) => { isValid: boolean; message?: string }
  sanitize?: boolean
  showStrength?: boolean
  maxLength?: number
  label?: string
  error?: string
  className?: string
}

export default function SecureInput({
  type = 'text',
  value,
  onChange,
  validation,
  customValidator,
  sanitize = true,
  showStrength = false,
  maxLength,
  label,
  error,
  className = '',
  ...props
}: SecureInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message?: string
    strength?: { score: number; feedback: string[] }
  }>({ isValid: true })
  const [isFocused, setIsFocused] = useState(false)

  // 입력값 검증
  const validateInput = useCallback((inputValue: string) => {
    if (!inputValue) {
      return { isValid: true }
    }

    switch (validation) {
      case 'email':
        const isValidEmail = XSSProtection.validateEmail(inputValue)
        return {
          isValid: isValidEmail,
          message: isValidEmail ? undefined : '올바른 이메일 형식이 아닙니다'
        }

      case 'phone':
        const isValidPhone = XSSProtection.validatePhoneNumber(inputValue)
        return {
          isValid: isValidPhone,
          message: isValidPhone ? undefined : '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
        }

      case 'password':
        const passwordValidation = InputValidator.validatePasswordStrength(inputValue)
        return {
          isValid: passwordValidation.isValid,
          message: passwordValidation.feedback.join(', '),
          strength: passwordValidation
        }

      case 'url':
        const isValidUrl = XSSProtection.validateURL(inputValue)
        return {
          isValid: isValidUrl,
          message: isValidUrl ? undefined : '올바른 URL 형식이 아닙니다'
        }

      case 'business-number':
        const isValidBusiness = InputValidator.validateBusinessNumber(inputValue)
        return {
          isValid: isValidBusiness,
          message: isValidBusiness ? undefined : '올바른 사업자등록번호가 아닙니다'
        }

      case 'custom':
        if (customValidator) {
          return customValidator(inputValue)
        }
        return { isValid: true }

      default:
        return { isValid: true }
    }
  }, [validation, customValidator])

  // 입력값 변경 처리
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    // 최대 길이 제한
    if (maxLength && inputValue.length > maxLength) {
      inputValue = inputValue.slice(0, maxLength)
    }

    // XSS 보호를 위한 입력값 정화
    if (sanitize) {
      inputValue = XSSProtection.sanitizeText(inputValue)
    }

    // SQL 인젝션 패턴 감지
    if (XSSProtection.detectSQLInjection(inputValue)) {
      return // 의심스러운 입력은 무시
    }

    // 검증 수행
    const validation = validateInput(inputValue)
    setValidationResult(validation)

    // 부모 컴포넌트에 변경사항 전달
    onChange(inputValue, validation.isValid)
  }, [maxLength, sanitize, validateInput, onChange])

  // 실시간 검증 (디바운싱)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value) {
        const validation = validateInput(value)
        setValidationResult(validation)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value, validateInput])

  // 비밀번호 강도 표시
  const renderPasswordStrength = () => {
    if (!showStrength || !validationResult.strength) return null

    const { score, feedback } = validationResult.strength
    const strengthLevels = ['매우 약함', '약함', '보통', '강함', '매우 강함']
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>비밀번호 강도</span>
          <span className={`font-medium ${score >= 4 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
            {strengthLevels[score] || '매우 약함'}
          </span>
        </div>
        <div className="flex space-x-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`h-1 flex-1 rounded ${
                level < score ? strengthColors[score] : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        {feedback.length > 0 && (
          <ul className="mt-1 text-xs text-gray-500 space-y-0.5">
            {feedback.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // 검증 상태 아이콘
  const getValidationIcon = () => {
    if (!value || !isFocused) return null

    if (validationResult.isValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else {
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  }

  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center">
            <Shield className="w-3 h-3 mr-1 text-gray-400" />
            {label}
          </div>
        </label>
      )}
      
      <div className="relative">
        <Input
          {...props}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`pr-10 ${
            validationResult.isValid ? 'border-gray-300' : 'border-red-300'
          } ${props.className || ''}`}
          maxLength={maxLength}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {getValidationIcon()}
          
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 오류 메시지 */}
      {(error || (!validationResult.isValid && validationResult.message)) && (
        <div className="flex items-center text-sm text-red-600">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {error || validationResult.message}
        </div>
      )}

      {/* 비밀번호 강도 표시 */}
      {renderPasswordStrength()}

      {/* 문자 수 표시 */}
      {maxLength && (
        <div className="text-xs text-gray-500 text-right">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  )
}

// 보안 텍스트 영역 컴포넌트
interface SecureTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string
  onChange: (value: string, isValid: boolean) => void
  sanitize?: boolean
  maxLength?: number
  label?: string
  error?: string
  className?: string
}

export function SecureTextarea({
  value,
  onChange,
  sanitize = true,
  maxLength,
  label,
  error,
  className = '',
  ...props
}: SecureTextareaProps) {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message?: string
  }>({ isValid: true })

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let inputValue = e.target.value

    // 최대 길이 제한
    if (maxLength && inputValue.length > maxLength) {
      inputValue = inputValue.slice(0, maxLength)
    }

    // XSS 보호를 위한 입력값 정화
    if (sanitize) {
      inputValue = XSSProtection.sanitizeHTML(inputValue)
    }

    // SQL 인젝션 패턴 감지
    if (XSSProtection.detectSQLInjection(inputValue)) {
      setValidationResult({
        isValid: false,
        message: '허용되지 않는 문자가 포함되어 있습니다'
      })
      return
    }

    setValidationResult({ isValid: true })
    onChange(inputValue, true)
  }, [maxLength, sanitize, onChange])

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center">
            <Shield className="w-3 h-3 mr-1 text-gray-400" />
            {label}
          </div>
        </label>
      )}
      
      <textarea
        {...props}
        value={value}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          validationResult.isValid ? 'border-gray-300' : 'border-red-300'
        } ${props.className || ''}`}
        maxLength={maxLength}
      />

      {/* 오류 메시지 */}
      {(error || (!validationResult.isValid && validationResult.message)) && (
        <div className="flex items-center text-sm text-red-600">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {error || validationResult.message}
        </div>
      )}

      {/* 문자 수 표시 */}
      {maxLength && (
        <div className="text-xs text-gray-500 text-right">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  )
}