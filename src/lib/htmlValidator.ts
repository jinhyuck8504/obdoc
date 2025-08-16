/**
 * HTML 검증 및 정리 유틸리티
 */

/**
 * HTML 태그를 제거하고 텍스트만 반환
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * 안전한 HTML 태그만 허용
 */
export function sanitizeHtml(html: string): string {
  // 허용된 태그들
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
  
  // 간단한 HTML 정리 (실제 프로덕션에서는 DOMPurify 등 사용 권장)
  let sanitized = html
  
  // 스크립트 태그 제거
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
  
  // 이벤트 핸들러 제거
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '')
  
  // 허용되지 않은 태그 제거
  const tagRegex = /<(\/?)([\w]+)[^>]*>/gi
  sanitized = sanitized.replace(tagRegex, (match, closing, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match
    }
    return ''
  })
  
  return sanitized
}

/**
 * HTML 유효성 검사
 */
export function validateHtml(html: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 기본적인 HTML 구조 검사
  const openTags = html.match(/<[^\/][^>]*>/g) || []
  const closeTags = html.match(/<\/[^>]*>/g) || []
  
  if (openTags.length !== closeTags.length) {
    errors.push('태그가 올바르게 닫히지 않았습니다.')
  }
  
  // 스크립트 태그 검사
  if (/<script/i.test(html)) {
    errors.push('스크립트 태그는 허용되지 않습니다.')
  }
  
  // 이벤트 핸들러 검사
  if (/on\w+=/i.test(html)) {
    errors.push('이벤트 핸들러는 허용되지 않습니다.')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 텍스트 길이 제한
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * 마크다운을 간단한 HTML로 변환
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown
  
  // 볼드 텍스트
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 이탤릭 텍스트
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 링크
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  
  // 줄바꿈
  html = html.replace(/\n/g, '<br>')
  
  return html
}