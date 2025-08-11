// API 호출 유틸리티 함수들

export interface ApiCallOptions {
  timeout?: number
  retryCount?: number
  retryDelay?: number
  onError?: (error: Error) => void
}

export class ApiTimeoutError extends Error {
  constructor(timeout: number) {
    super(`API 요청이 ${timeout}ms 내에 완료되지 않았습니다.`)
    this.name = 'ApiTimeoutError'
  }
}

export class ApiRetryError extends Error {
  constructor(originalError: Error, retryCount: number) {
    super(`API 요청이 ${retryCount}번 재시도 후에도 실패했습니다: ${originalError.message}`)
    this.name = 'ApiRetryError'
    this.cause = originalError
  }
}

/**
 * API 호출에 타임아웃을 추가하는 함수
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeout: number = 10000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ApiTimeoutError(timeout)), timeout)
    })
  ])
}

/**
 * 재시도 로직이 포함된 API 호출 함수
 */
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  options: ApiCallOptions = {}
): Promise<T> => {
  const {
    timeout = 10000,
    retryCount = 3,
    retryDelay = 1000,
    onError
  } = options

  let lastError: Error

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const result = await withTimeout(apiCall(), timeout)
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // 마지막 시도가 아니면 재시도
      if (attempt < retryCount - 1) {
        console.warn(`API 호출 실패 (시도 ${attempt + 1}/${retryCount}):`, lastError.message)
        
        // 지수 백오프로 재시도 지연
        const delay = retryDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // 모든 재시도 실패
      const finalError = new ApiRetryError(lastError, retryCount)
      onError?.(finalError)
      throw finalError
    }
  }

  throw lastError!
}

/**
 * 안전한 API 호출 래퍼 함수
 */
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  options: ApiCallOptions = {}
): Promise<{ data: T | null; error: string | null; loading: boolean }> => {
  try {
    const data = await withRetry(apiCall, options)
    return { data, error: null, loading: false }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Safe API call failed:', error)
    return { data: null, error: errorMessage, loading: false }
  }
}

/**
 * 로딩 상태를 관리하는 API 호출 함수
 */
export const createApiCall = <T>(
  apiCall: () => Promise<T>,
  options: ApiCallOptions = {}
) => {
  let isLoading = false
  let abortController: AbortController | null = null

  return {
    execute: async (): Promise<{ data: T | null; error: string | null; loading: boolean }> => {
      // 이미 실행 중이면 중복 실행 방지
      if (isLoading) {
        return { data: null, error: 'Already loading', loading: true }
      }

      isLoading = true
      abortController = new AbortController()

      try {
        const data = await withRetry(apiCall, {
          ...options,
          timeout: options.timeout || 10000
        })
        
        return { data, error: null, loading: false }
      } catch (error) {
        if (abortController.signal.aborted) {
          return { data: null, error: 'Request was cancelled', loading: false }
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return { data: null, error: errorMessage, loading: false }
      } finally {
        isLoading = false
        abortController = null
      }
    },
    
    cancel: () => {
      if (abortController) {
        abortController.abort()
      }
    },
    
    get isLoading() {
      return isLoading
    }
  }
}

/**
 * 전역 오류 처리기
 */
export const GlobalErrorHandler = {
  handleApiError: (error: any): string => {
    console.error('API Error:', error)
    
    if (error instanceof ApiTimeoutError) {
      return '요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.'
    }
    
    if (error instanceof ApiRetryError) {
      return '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
    }
    
    if (error?.message?.includes('timeout')) {
      return '요청 시간이 초과되었습니다. 다시 시도해주세요.'
    }
    
    if (error?.status === 401 || error?.message?.includes('unauthorized')) {
      return '인증이 필요합니다. 다시 로그인해주세요.'
    }
    
    if (error?.status === 403) {
      return '접근 권한이 없습니다.'
    }
    
    if (error?.status === 404) {
      return '요청한 리소스를 찾을 수 없습니다.'
    }
    
    if (error?.status >= 500) {
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
    
    return error?.message || '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
}

/**
 * 디바운스된 API 호출 함수
 */
export const createDebouncedApiCall = <T>(
  apiCall: () => Promise<T>,
  delay: number = 300,
  options: ApiCallOptions = {}
) => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastCall: Promise<{ data: T | null; error: string | null; loading: boolean }> | null = null

  return {
    execute: (): Promise<{ data: T | null; error: string | null; loading: boolean }> => {
      // 이전 타이머 취소
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // 이미 진행 중인 호출이 있으면 반환
      if (lastCall) {
        return lastCall
      }

      return new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          lastCall = safeApiCall(apiCall, options)
          const result = await lastCall
          lastCall = null
          resolve(result)
        }, delay)
      })
    },

    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCall = null
    }
  }
}