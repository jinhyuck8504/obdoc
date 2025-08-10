'use client'
import { useCallback } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { useLoading } from '@/contexts/LoadingContext'

// 피드백 타입 정의
export type FeedbackType = 'success' | 'error' | 'warning' | 'info'

export interface FeedbackOptions {
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface LoadingOptions {
  message?: string
  progress?: number
  cancelable?: boolean
  onCancel?: () => void
}

// 통합 피드백 훅
export function useFeedback() {
  const { toasts, showToast, hideToast, clearAllToasts } = useToast()
  const { loading, setLoading, clearLoading, isLoading } = useLoading()

  // 성공 피드백
  const showSuccess = useCallback((options: FeedbackOptions) => {
    showToast({
      type: 'success',
      ...options
    })
  }, [showToast])

  // 오류 피드백
  const showError = useCallback((options: FeedbackOptions) => {
    showToast({
      type: 'error',
      duration: 0, // 오류는 수동으로 닫기
      ...options
    })
  }, [showToast])

  // 경고 피드백
  const showWarning = useCallback((options: FeedbackOptions) => {
    showToast({
      type: 'warning',
      ...options
    })
  }, [showToast])

  // 정보 피드백
  const showInfo = useCallback((options: FeedbackOptions) => {
    showToast({
      type: 'info',
      ...options
    })
  }, [showToast])

  // 로딩 시작
  const startLoading = useCallback((key: string, options?: LoadingOptions) => {
    setLoading(key, {
      isLoading: true,
      ...options
    })
  }, [setLoading])

  // 로딩 종료
  const stopLoading = useCallback((key: string) => {
    clearLoading(key)
  }, [clearLoading])

  // 로딩 상태 확인
  const checkLoading = useCallback((key?: string) => {
    return isLoading(key)
  }, [isLoading])

  // 비동기 작업 래퍼
  const withLoading = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>,
    options?: LoadingOptions & {
      successMessage?: string
      errorMessage?: string
    }
  ): Promise<T> => {
    try {
      startLoading(key, options)
      const result = await asyncFn()
      
      if (options?.successMessage) {
        showSuccess({
          title: options.successMessage
        })
      }
      
      return result
    } catch (error) {
      const errorMessage = options?.errorMessage || '작업 중 오류가 발생했습니다.'
      showError({
        title: errorMessage,
        message: error instanceof Error ? error.message : undefined
      })
      throw error
    } finally {
      stopLoading(key)
    }
  }, [startLoading, stopLoading, showSuccess, showError])

  // 확인 다이얼로그 (브라우저 기본)
  const showConfirm = useCallback((message: string): boolean => {
    return window.confirm(message)
  }, [])

  // 알림 다이얼로그 (브라우저 기본)
  const showAlert = useCallback((message: string): void => {
    window.alert(message)
  }, [])

  return {
    // 상태
    toasts,
    loading,
    
    // 토스트 피드백
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    clearAllToasts,
    
    // 로딩 관리
    startLoading,
    stopLoading,
    checkLoading,
    withLoading,
    
    // 다이얼로그
    showConfirm,
    showAlert
  }
}

// 특정 작업을 위한 피드백 훅들
export function useFormFeedback() {
  const feedback = useFeedback()

  const handleSubmitSuccess = useCallback((message = '저장되었습니다.') => {
    feedback.showSuccess({
      title: message
    })
  }, [feedback])

  const handleSubmitError = useCallback((error: Error | string) => {
    const message = error instanceof Error ? error.message : error
    feedback.showError({
      title: '저장 실패',
      message
    })
  }, [feedback])

  const handleValidationError = useCallback((message = '입력 정보를 확인해주세요.') => {
    feedback.showWarning({
      title: message
    })
  }, [feedback])

  return {
    ...feedback,
    handleSubmitSuccess,
    handleSubmitError,
    handleValidationError
  }
}

export function useApiRequestFeedback() {
  const feedback = useFeedback()

  const handleApiRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    options?: {
      loadingKey?: string
      loadingMessage?: string
      successMessage?: string
      errorMessage?: string
    }
  ): Promise<T> => {
    const loadingKey = options?.loadingKey || 'api-request'
    
    return feedback.withLoading(
      loadingKey,
      requestFn,
      {
        message: options?.loadingMessage || '처리 중...',
        successMessage: options?.successMessage,
        errorMessage: options?.errorMessage || 'API 요청 중 오류가 발생했습니다.'
      }
    )
  }, [feedback])

  return {
    ...feedback,
    handleApiRequest
  }
}

export function useDeleteConfirmation() {
  const feedback = useFeedback()

  const confirmDelete = useCallback((
    itemName: string,
    onConfirm: () => void | Promise<void>
  ) => {
    const confirmed = feedback.showConfirm(
      `정말로 "${itemName}"을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    )

    if (confirmed) {
      if (onConfirm instanceof Promise) {
        feedback.withLoading('delete-operation', () => onConfirm, {
          message: '삭제 중...',
          successMessage: '삭제되었습니다.',
          errorMessage: '삭제 중 오류가 발생했습니다.'
        })
      } else {
        onConfirm()
        feedback.showSuccess({
          title: '삭제되었습니다.'
        })
      }
    }
  }, [feedback])

  return {
    ...feedback,
    confirmDelete
  }
}

// 네트워크 상태 피드백
export function useNetworkFeedback() {
  const feedback = useFeedback()

  const handleNetworkError = useCallback(() => {
    feedback.showError({
      title: '네트워크 오류',
      message: '인터넷 연결을 확인하고 다시 시도해주세요.',
      action: {
        label: '다시 시도',
        onClick: () => window.location.reload()
      }
    })
  }, [feedback])

  const handleOffline = useCallback(() => {
    feedback.showWarning({
      title: '오프라인 상태',
      message: '인터넷 연결이 끊어졌습니다.',
      duration: 0
    })
  }, [feedback])

  const handleOnline = useCallback(() => {
    feedback.showSuccess({
      title: '온라인 상태',
      message: '인터넷 연결이 복구되었습니다.'
    })
  }, [feedback])

  return {
    ...feedback,
    handleNetworkError,
    handleOffline,
    handleOnline
  }
}

// 파일 업로드 피드백
export function useFileUploadFeedback() {
  const feedback = useFeedback()

  const handleUploadStart = useCallback((fileName: string) => {
    feedback.startLoading('file-upload', {
      message: `"${fileName}" 업로드 중...`,
      progress: 0
    })
  }, [feedback])

  const handleUploadProgress = useCallback((progress: number) => {
    feedback.startLoading('file-upload', {
      message: '파일 업로드 중...',
      progress
    })
  }, [feedback])

  const handleUploadSuccess = useCallback((fileName: string) => {
    feedback.stopLoading('file-upload')
    feedback.showSuccess({
      title: '업로드 완료',
      message: `"${fileName}"이(가) 성공적으로 업로드되었습니다.`
    })
  }, [feedback])

  const handleUploadError = useCallback((error: Error | string) => {
    feedback.stopLoading('file-upload')
    const message = error instanceof Error ? error.message : error
    feedback.showError({
      title: '업로드 실패',
      message
    })
  }, [feedback])

  return {
    ...feedback,
    handleUploadStart,
    handleUploadProgress,
    handleUploadSuccess,
    handleUploadError
  }
}

export default useFeedback