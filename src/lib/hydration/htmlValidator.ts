/**
 * HTML 구조 검증을 위한 유틸리티
 */

import React from "react"

interface ValidationRule {
  name: string
  test: (html: string) => boolean
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    rule: string
    message: string
    severity: 'error' | 'warning'
    line?: number
  }>
}

/**
 * HTML 구조 검증 규칙들
 */
const HTML_VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'no-nested-buttons',
    test: (html: string) => !/<button[^>]*>[\s\S]*<button/i.test(html),
    message: '버튼 요소 내부에 다른 버튼 요소가 중첩되어 있습니다.',
    severity: 'error'
  },
  {
    name: 'no-nested-links',
    test: (html: string) => !/<a[^>]*>[\s\S]*<a/i.test(html),
    message: '링크 요소 내부에 다른 링크 요소가 중첩되어 있습니다.',
    severity: 'error'
  },
  {
    name: 'no-nested-forms',
    test: (html: string) => !/<form[^>]*>[\s\S]*<form/i.test(html),
    message: '폼 요소 내부에 다른 폼 요소가 중첩되어 있습니다.',
    severity: 'error'
  },
  {
    name: 'no-div-in-p',
    test: (html: string) => !/<p[^>]*>[\s\S]*<div/i.test(html),
    message: 'p 요소 내부에 div 요소가 있습니다. 이는 유효하지 않은 HTML입니다.',
    severity: 'error'
  },
  {
    name: 'no-block-in-inline',
    test: (html: string) => {
      const blockElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'section', 'article', 'header', 'footer', 'nav']
      const inlineElements = ['span', 'a', 'strong', 'em', 'code', 'small']
      
      for (const inline of inlineElements) {
        for (const block of blockElements) {
          const pattern = new RegExp(`<${inline}[^>]*>[\\s\\S]*<${block}`, 'i')
          if (pattern.test(html)) {
            return false
          }
        }
      }
      return true
    },
    message: '인라인 요소 내부에 블록 요소가 있습니다.',
    severity: 'error'
  },
  {
    name: 'proper-heading-hierarchy',
    test: (html: string) => {
      const headings = html.match(/<h[1-6]/gi)
      if (!headings) return true
      
      const levels = headings.map(h => parseInt(h.charAt(2)))
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i-1] + 1) {
          return false
        }
      }
      return true
    },
    message: '제목 요소의 계층 구조가 올바르지 않습니다. (h1 다음에 h3가 오는 등)',
    severity: 'warning'
  },
  {
    name: 'no-empty-elements',
    test: (html: string) => !/<(div|span|p|h[1-6])[^>]*>\s*<\/\1>/i.test(html),
    message: '빈 요소가 있습니다.',
    severity: 'warning'
  },
  {
    name: 'proper-table-structure',
    test: (html: string) => {
      if (!html.includes('<table')) return true
      
      // 테이블 내부에 올바른 구조가 있는지 확인
      const tablePattern = /<table[^>]*>([\s\S]*?)<\/table>/gi
      const tables = html.match(tablePattern)
      
      if (!tables) return true
      
      for (const table of tables) {
        // tr이 thead, tbody, tfoot 외부에 직접 있는지 확인
        const directTr = /<table[^>]*>[\s\S]*?<tr(?![^>]*>[\s\S]*<\/thead>|[^>]*>[\s\S]*<\/tbody>|[^>]*>[\s\S]*<\/tfoot>)/i
        if (directTr.test(table)) {
          return false
        }
      }
      return true
    },
    message: '테이블 구조가 올바르지 않습니다. tr은 thead, tbody, tfoot 내부에 있어야 합니다.',
    severity: 'error'
  }
]

/**
 * HTML 문자열의 구조를 검증합니다.
 */
export function validateHTMLStructure(html: string): ValidationResult {
  const errors: ValidationResult['errors'] = []
  
  for (const rule of HTML_VALIDATION_RULES) {
    if (!rule.test(html)) {
      errors.push({
        rule: rule.name,
        message: rule.message,
        severity: rule.severity
      })
    }
  }
  
  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  }
}

/**
 * React 컴포넌트의 렌더링 결과를 검증합니다.
 */
export function validateComponentHTML(componentHTML: string, componentName?: string): ValidationResult {
  const result = validateHTMLStructure(componentHTML)
  
  if (!result.isValid && componentName) {
    console.group(`🚨 HTML Validation Errors in ${componentName}`)
    result.errors.forEach(error => {
      if (error.severity === 'error') {
        console.error(`❌ ${error.message}`)
      } else {
        console.warn(`⚠️ ${error.message}`)
      }
    })
    console.groupEnd()
  }
  
  return result
}

/**
 * 개발 환경에서 컴포넌트 HTML 구조를 자동으로 검증하는 HOC
 */
export function withHTMLValidation<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  if (process.env.NODE_ENV !== 'development') {
    return Component
  }
  
  return function ValidatedComponent(props: P) {
    const ref = React.useRef<HTMLDivElement>(null)
    
    React.useEffect(() => {
      if (ref.current) {
        const html = ref.current.innerHTML
        validateComponentHTML(html, componentName || Component.name)
      }
    })
    
    return React.createElement('div', 
      { ref, style: { display: 'contents' } },
      React.createElement(Component, props)
    )
  }
}

/**
 * DOM 요소의 HTML 구조를 실시간으로 검증합니다.
 */
export function validateDOMStructure(element: Element): ValidationResult {
  return validateHTMLStructure(element.outerHTML)
}

/**
 * 페이지 전체의 HTML 구조를 검증합니다.
 */
export function validatePageStructure(): ValidationResult {
  if (typeof document === 'undefined') {
    return { isValid: true, errors: [] }
  }
  
  return validateHTMLStructure(document.documentElement.outerHTML)
}

/**
 * HTML 구조 검증을 위한 개발 도구
 */
export const HTMLValidationDevTools = {
  /**
   * 현재 페이지의 HTML 구조를 검증하고 콘솔에 출력합니다.
   */
  validateCurrentPage(): void {
    if (process.env.NODE_ENV !== 'development') return
    
    const result = validatePageStructure()
    
    if (result.errors.length === 0) {
      console.log('✅ HTML 구조 검증 통과')
    } else {
      console.group('🚨 HTML 구조 검증 결과')
      result.errors.forEach(error => {
        if (error.severity === 'error') {
          console.error(`❌ ${error.message}`)
        } else {
          console.warn(`⚠️ ${error.message}`)
        }
      })
      console.groupEnd()
    }
  },
  
  /**
   * 특정 요소의 HTML 구조를 검증합니다.
   */
  validateElement(selector: string): void {
    if (process.env.NODE_ENV !== 'development') return
    
    const element = document.querySelector(selector)
    if (!element) {
      console.error(`요소를 찾을 수 없습니다: ${selector}`)
      return
    }
    
    const result = validateDOMStructure(element)
    
    if (result.errors.length === 0) {
      console.log(`✅ ${selector} HTML 구조 검증 통과`)
    } else {
      console.group(`🚨 ${selector} HTML 구조 검증 결과`)
      result.errors.forEach(error => {
        if (error.severity === 'error') {
          console.error(`❌ ${error.message}`)
        } else {
          console.warn(`⚠️ ${error.message}`)
        }
      })
      console.groupEnd()
    }
  },
  
  /**
   * 자동 검증을 활성화합니다.
   */
  enableAutoValidation(): void {
    if (process.env.NODE_ENV !== 'development') return
    
    // MutationObserver를 사용하여 DOM 변경 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const result = validateDOMStructure(node as Element)
              if (!result.isValid) {
                console.group('🚨 새로 추가된 요소의 HTML 구조 오류')
                result.errors.forEach(error => {
                  console.error(`❌ ${error.message}`)
                })
                console.groupEnd()
              }
            }
          })
        }
      })
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    console.log('🔍 HTML 구조 자동 검증이 활성화되었습니다.')
  }
}

// 개발 환경에서 전역 객체에 추가
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).HTMLValidationDevTools = HTMLValidationDevTools
}