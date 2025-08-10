'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { validateComponentHTML, ValidationResult } from '@/lib/hydration/htmlValidator'

interface UseHTMLValidationOptions {
  componentName?: string
  enabled?: boolean
  onValidationError?: (result: ValidationResult) => void
}

/**
 * 컴포넌트의 HTML 구조를 검증하는 Hook
 */
export function useHTMLValidation(options: UseHTMLValidationOptions = {}) {
  const {
    componentName = 'Unknown Component',
    enabled = process.env.NODE_ENV === 'development',
    onValidationError
  } = options
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!enabled || !containerRef.current) return
    
    // 컴포넌트가 렌더링된 후 HTML 구조 검증
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        const html = containerRef.current.innerHTML
        const result = validateComponentHTML(html, componentName)
        
        if (!result.isValid && onValidationError) {
          onValidationError(result)
        }
      }
    }, 100) // 렌더링 완료를 위한 짧은 지연
    
    return () => clearTimeout(timeoutId)
  }, [enabled, componentName, onValidationError])
  
  return containerRef
}

/**
 * 실시간 HTML 구조 검증을 위한 Hook
 */
export function useRealtimeHTMLValidation(options: UseHTMLValidationOptions = {}) {
  const {
    componentName = 'Unknown Component',
    enabled = process.env.NODE_ENV === 'development',
    onValidationError
  } = options
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!enabled || !containerRef.current) return
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          if (containerRef.current) {
            const html = containerRef.current.innerHTML
            const result = validateComponentHTML(html, componentName)
            
            if (!result.isValid && onValidationError) {
              onValidationError(result)
            }
          }
        }
      })
    })
    
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    })
    
    return () => observer.disconnect()
  }, [enabled, componentName, onValidationError])
  
  return containerRef
}

/**
 * HTML 구조 검증 결과를 상태로 관리하는 Hook
 */
export function useHTMLValidationState(options: UseHTMLValidationOptions = {}) {
  const {
    componentName = 'Unknown Component',
    enabled = process.env.NODE_ENV === 'development'
  } = options
  
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const validateNow = useCallback(() => {
    if (!enabled || !containerRef.current) return
    
    const html = containerRef.current.innerHTML
    const result = validateComponentHTML(html, componentName)
    setValidationResult(result)
    
    return result
  }, [enabled, componentName])
  
  useEffect(() => {
    const timeoutId = setTimeout(validateNow, 100)
    return () => clearTimeout(timeoutId)
  }, [validateNow])
  
  return {
    containerRef,
    validationResult,
    validateNow,
    isValid: validationResult?.isValid ?? true,
    errors: validationResult?.errors ?? []
  }
}