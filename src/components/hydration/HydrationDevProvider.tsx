'use client'

import React, { useEffect } from 'react'
import HydrationDebugTools from './HydrationDebugTools'
import HTMLValidationDevTool from './HTMLValidationDevTool'
import { hydrationUtils } from '@/lib/hydration/recoveryUtils'

interface HydrationDevProviderProps {
  children: React.ReactNode
  enableDebugTools?: boolean
  enableHTMLValidation?: boolean
  enableConsoleWarnings?: boolean
}

/**
 * Hydration 개발 도구를 제공하는 Provider 컴포넌트
 * 개발 환경에서만 활성화됩니다.
 */
export default function HydrationDevProvider({
  children,
  enableDebugTools = true,
  enableHTMLValidation = true,
  enableConsoleWarnings = true
}: HydrationDevProviderProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (!isDevelopment) return

    // 콘솔 경고 설정
    if (enableConsoleWarnings) {
      setupConsoleWarnings()
    }

    // Hydration 오류 리스너 설정
    hydrationUtils.setupHydrationErrorListener()

    // 개발 도구를 전역 객체에 추가
    if (typeof window !== 'undefined') {
      (window as any).HydrationDevTools = {
        checkHydrationStatus: hydrationUtils.isHydrating,
        detectDOMInconsistency: hydrationUtils.detectDOMInconsistency,
        validateHTML: () => {
          const { HTMLValidationDevTools } = require('@/lib/hydration/htmlValidator')
          HTMLValidationDevTools.validateCurrentPage()
        },
        clearErrorLogs: () => {
          const { hydrationErrorLogger } = require('@/lib/hydration/errorLogger')
          hydrationErrorLogger.clearStoredLogs()
        },
        getErrorLogs: () => {
          const { hydrationErrorLogger } = require('@/lib/hydration/errorLogger')
          return hydrationErrorLogger.getStoredLogs()
        }
      }

      console.log('🔧 Hydration Dev Tools loaded. Use window.HydrationDevTools for manual debugging.')
    }
  }, [isDevelopment, enableConsoleWarnings])

  const setupConsoleWarnings = () => {
    // React DevTools 스타일의 경고 메시지
    const originalWarn = console.warn
    const originalError = console.error

    console.warn = (...args) => {
      const message = args[0]
      if (typeof message === 'string') {
        if (message.includes('hydration') || message.includes('Hydration')) {
          console.group('⚠️ Hydration Warning')
          originalWarn.apply(console, args)
          console.log('💡 Tip: Use HydrationBoundary or ClientOnly components to fix this issue')
          console.groupEnd()
          return
        }
      }
      originalWarn.apply(console, args)
    }

    console.error = (...args) => {
      const message = args[0]
      if (typeof message === 'string') {
        if (message.includes('hydration') || message.includes('Hydration')) {
          console.group('🚨 Hydration Error')
          originalError.apply(console, args)
          console.log('🔧 Debugging tips:')
          console.log('1. Check if server and client render the same content')
          console.log('2. Use suppressHydrationWarning for unavoidable differences')
          console.log('3. Wrap dynamic content with HydrationBoundary')
          console.log('4. Use ClientOnly for browser-specific features')
          console.groupEnd()
          return
        }
      }
      originalError.apply(console, args)
    }
  }

  if (!isDevelopment) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      {enableDebugTools && <HydrationDebugTools />}
      {enableHTMLValidation && <HTMLValidationDevTool />}
    </>
  )
}

/**
 * Hydration 디버깅을 위한 유틸리티 Hook
 */
export function useHydrationDebug() {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const logHydrationIssue = (component: string, issue: string, details?: any) => {
    if (!isDevelopment) return

    console.group(`🐛 Hydration Issue in ${component}`)
    console.warn(issue)
    if (details) {
      console.log('Details:', details)
    }
    console.log('Component:', component)
    console.log('Timestamp:', new Date().toISOString())
    console.groupEnd()
  }

  const markHydrationBoundary = (componentName: string) => {
    if (!isDevelopment) return

    console.log(`🔄 Hydration boundary: ${componentName}`)
  }

  const validateHydrationConsistency = (serverValue: any, clientValue: any, context: string) => {
    if (!isDevelopment) return

    if (JSON.stringify(serverValue) !== JSON.stringify(clientValue)) {
      console.group(`⚠️ Hydration Inconsistency: ${context}`)
      console.log('Server value:', serverValue)
      console.log('Client value:', clientValue)
      console.log('Context:', context)
      console.groupEnd()
    }
  }

  return {
    logHydrationIssue,
    markHydrationBoundary,
    validateHydrationConsistency,
    isDevelopment
  }
}