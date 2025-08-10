'use client'

import React, { useState, useEffect } from 'react'
import { HTMLValidationDevTools, ValidationResult } from '@/lib/hydration/htmlValidator'
import { ClientOnly } from '@/components/hydration'
import { AlertTriangle, CheckCircle, Eye, EyeOff, RefreshCw } from 'lucide-react'

interface HTMLValidationDevToolProps {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

/**
 * HTML 구조 검증을 위한 개발 도구 컴포넌트
 * 개발 환경에서만 표시됩니다.
 */
export default function HTMLValidationDevTool({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right'
}: HTMLValidationDevToolProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [autoValidation, setAutoValidation] = useState(false)

  useEffect(() => {
    if (autoValidation) {
      HTMLValidationDevTools.enableAutoValidation()
    }
  }, [autoValidation])

  const handleValidate = async () => {
    setIsValidating(true)
    
    // 약간의 지연을 주어 UI 업데이트를 보여줌
    setTimeout(() => {
      HTMLValidationDevTools.validateCurrentPage()
      
      // 실제 검증 결과를 가져오기 위해 페이지 구조 검증
      if (typeof document !== 'undefined') {
        const html = document.documentElement.outerHTML
        const result = require('@/lib/hydration/htmlValidator').validateHTMLStructure(html)
        setValidationResult(result)
      }
      
      setIsValidating(false)
    }, 500)
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  if (!enabled) return null

  return (
    <ClientOnly>
      <div className={`fixed ${getPositionClasses()} z-[9999]`}>
        {/* 토글 버튼 */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`
            w-12 h-12 rounded-full shadow-lg transition-all duration-200
            flex items-center justify-center text-white font-bold
            ${validationResult?.isValid === false 
              ? 'bg-red-500 hover:bg-red-600' 
              : validationResult?.isValid === true
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600'
            }
          `}
          title="HTML 구조 검증 도구"
        >
          {validationResult?.isValid === false ? (
            <AlertTriangle className="w-6 h-6" />
          ) : validationResult?.isValid === true ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <Eye className="w-6 h-6" />
          )}
        </button>

        {/* 검증 도구 패널 */}
        {isVisible && (
          <div className="absolute bottom-14 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                HTML 구조 검증
              </h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <EyeOff className="w-5 h-5" />
              </button>
            </div>

            {/* 검증 버튼 */}
            <div className="space-y-3 mb-4">
              <button
                onClick={handleValidate}
                disabled={isValidating}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md transition-colors"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    검증 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    페이지 검증
                  </>
                )}
              </button>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoValidation}
                  onChange={(e) => setAutoValidation(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">자동 검증</span>
              </label>
            </div>

            {/* 검증 결과 */}
            {validationResult && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center mb-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className={`font-medium ${
                    validationResult.isValid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {validationResult.isValid ? '검증 통과' : '구조 오류 발견'}
                  </span>
                </div>

                {validationResult.errors.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {validationResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-sm ${
                          error.severity === 'error'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                        }`}
                      >
                        <div className="font-medium">
                          {error.severity === 'error' ? '❌' : '⚠️'} {error.rule}
                        </div>
                        <div className="mt-1">{error.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 도움말 */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-xs text-gray-500">
                개발 환경에서만 표시됩니다. 콘솔에서 HTMLValidationDevTools 객체를 사용하여 더 자세한 검증을 수행할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  )
}