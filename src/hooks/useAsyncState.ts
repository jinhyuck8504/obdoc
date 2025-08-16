import { useState, useCallback, useRef, useEffect } from 'react'
import { withRetry, ApiCallOptions, GlobalErrorHandler } from '@/lib/apiUtils'
import { withTimeout, getErrorMessage } from '../lib/timeoutUtils'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export interface UseAsyncStateOptions extends ApiCallOptions {
  initialData?: any
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  autoExecute?: boolean
}

export interface UseAsyncStateReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  execute: () => Promise<void>
  reset: () => void
  retry: () => Promise<void>
}

/**
 * 비동기 상태를 관리하는 커스텀 훅
 */
export function useAsyncState<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncStateOptions = {}
): UseAsyncStateReturn<T> {
  const {
    initialData = null,
    timeout = 10000,
    retryCount = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    autoExecute = false
  } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
    lastUpdated: null
  })

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const execute = useCallback(async () => {
    // 이미 로딩 중이면 중복 실행 방지
    if (state.loading) {
      console.warn('Already loading, skipping duplicate execution')
      return
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    try {
      const result = await withRetry(asyncFn, {
        timeout,
        retryCount,
        retryDelay,
        onError: (error) => {
          console.error('Async state error:', error)
          onError?.(error)
        }
      })

      // 컴포넌트가 언마운트되었으면 상태 업데이트 하지 않음
      if (!isMountedRef.current) {
        return
      }

      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date()
      })

      onSuccess?.(result)
    } catch (error) {
      // 컴포넌트가 언마운트되었으면 상태 업데이트 하지 않음
      if (!isMountedRef.current) {
        return
      }

      const errorMessage = GlobalErrorHandler.handleApiError(error)
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
    } finally {
      abortControllerRef.current = null
    }
  }, [asyncFn, timeout, retryCount, retryDelay, onSuccess, onError, state.loading])

  const reset = useCallback(() => {
    // 진행 중인 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setState({
      data: initialData,
      loading: false,
      error: null,
      lastUpdated: null
    })
  }, [initialData])

  const retry = useCallback(async () => {
    await execute()
  }, [execute])

  // 자동 실행
  useEffect(() => {
    if (autoExecute) {
      execute()
    }
  }, [autoExecute, execute])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    execute,
    reset,
    retry
  }
}

/**
 * 여러 비동기 작업을 병렬로 실행하는 훅
 */
export function useAsyncParallel<T extends Record<string, () => Promise<any>>>(
  asyncFunctions: T,
  options: UseAsyncStateOptions = {}
): {
  data: { [K in keyof T]: Awaited<ReturnType<T[K]>> | null }
  loading: boolean
  error: string | null
  execute: () => Promise<void>
  reset: () => void
} {
  const [state, setState] = useState<{
    data: { [K in keyof T]: Awaited<ReturnType<T[K]>> | null }
    loading: boolean
    error: string | null
  }>({
    data: Object.keys(asyncFunctions).reduce((acc, key) => {
      acc[key as keyof T] = null
      return acc
    }, {} as any),
    loading: false,
    error: null
  })

  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const execute = useCallback(async () => {
    if (state.loading) return

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    try {
      const promises = Object.entries(asyncFunctions).map(async ([key, fn]) => {
        const result = await withRetry(fn, options)
        return [key, result]
      })

      const results = await Promise.all(promises)
      
      if (!isMountedRef.current) return

      const data = results.reduce((acc, [key, value]) => {
        acc[key as keyof T] = value
        return acc
      }, {} as any)

      setState({
        data,
        loading: false,
        error: null
      })
    } catch (error) {
      if (!isMountedRef.current) return

      const errorMessage = GlobalErrorHandler.handleApiError(error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
    }
  }, [asyncFunctions, options, state.loading])

  const reset = useCallback(() => {
    setState({
      data: Object.keys(asyncFunctions).reduce((acc, key) => {
        acc[key as keyof T] = null
        return acc
      }, {} as any),
      loading: false,
      error: null
    })
  }, [asyncFunctions])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset
  }
}

/**
 * 무한 스크롤을 위한 비동기 상태 훅
 */
export function useAsyncInfinite<T>(
  asyncFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: UseAsyncStateOptions = {}
) {
  const [state, setState] = useState<{
    data: T[]
    loading: boolean
    loadingMore: boolean
    error: string | null
    hasMore: boolean
    page: number
  }>({
    data: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: true,
    page: 0
  })

  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (state.loading || state.loadingMore || !state.hasMore) return

    const isFirstLoad = state.page === 0
    
    setState(prev => ({
      ...prev,
      loading: isFirstLoad,
      loadingMore: !isFirstLoad,
      error: null
    }))

    try {
      const result = await withRetry(() => asyncFn(state.page + 1), options)
      
      if (!isMountedRef.current) return

      setState(prev => ({
        data: isFirstLoad ? result.data : [...prev.data, ...result.data],
        loading: false,
        loadingMore: false,
        error: null,
        hasMore: result.hasMore,
        page: prev.page + 1
      }))
    } catch (error) {
      if (!isMountedRef.current) return

      const errorMessage = GlobalErrorHandler.handleApiError(error)
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: errorMessage
      }))
    }
  }, [asyncFn, options, state.loading, state.loadingMore, state.hasMore, state.page])

  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      page: 0
    })
  }, [])

  return {
    data: state.data,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    reset
  }
}