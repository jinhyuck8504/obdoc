'use client'

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle, AlertCircle, Info, X, Zap, Clock, TrendingUp } from 'lucide-react'

// 피드백 타입 정의
export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'progress'

export interface FeedbackMessage {
  id: string
  type: FeedbackType
  title?: string
  message: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  progress?: number
  timestamp: number
}

export interface FeedbackContextType {
  messages: FeedbackMessage[]
  addMessage: (message: Omit<FeedbackMessage, 'id' | 'timestamp'>) => string
  removeMessage: (id: string) => void
  updateMessage: (id: string, updates: Partial<FeedbackMessage>) => void
  clearAll: () => void
}

// 피드백 컨텍스트
const FeedbackContext = createContext<FeedbackContextType | null>(null)

// 피드백 프로바이더
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<FeedbackMessage[]>([])

  const addMessage = useCallback((messageData: Omit<FeedbackMessage, 'id' | 'timestamp'>) => {
    const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const message: FeedbackMessage = {
      ...messageData,
      id,
      timestamp: Date.now(),
      duration: messageData.duration ?? (messageData.type === 'error' ? 8000 : 4000)
    }

    setMessages(prev => [...prev, message])

    // 자동 제거 (persistent가 아닌 경우)
    if (!message.persistent && message.duration) {
      setTimeout(() => {
        removeMessage(id)
      }, message.duration)
    }

    return id
  }, [])

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id))
  }, [])

  const updateMessage = useCallback((id: string, updates: Partial<FeedbackMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ))
  }, [])

  const clearAll = useCallback(() => {
    setMessages([])
  }, [])

  const contextValue: FeedbackContextType = {
    messages,
    addMessage,
    removeMessage,
    updateMessage,
    clearAll
  }

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <FeedbackContainer />
    </FeedbackContext.Provider>
  )
}

// 피드백 훅
export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider')
  }
  return context
}

// 편의 훅들
export function useToast() {
  const { addMessage } = useFeedback()

  return {
    success: (message: string, title?: string) => 
      addMessage({ type: 'success', message, title }),
    error: (message: string, title?: string) => 
      addMessage({ type: 'error', message, title }),
    warning: (message: string, title?: string) => 
      addMessage({ type: 'warning', message, title }),
    info: (message: string, title?: string) => 
      addMessage({ type: 'info', message, title }),
    loading: (message: string, title?: string) => 
      addMessage({ type: 'loading', message, title, persistent: true })
  }
}

export function useProgressFeedback() {
  const { addMessage, updateMessage, removeMessage } = useFeedback()

  const startProgress = useCallback((message: string, title?: string) => {
    return addMessage({
      type: 'progress',
      message,
      title,
      progress: 0,
      persistent: true
    })
  }, [addMessage])

  const updateProgress = useCallback((id: string, progress: number, message?: string) => {
    updateMessage(id, { 
      progress: Math.min(100, Math.max(0, progress)),
      ...(message && { message })
    })
  }, [updateMessage])

  const completeProgress = useCallback((id: string, success: boolean = true, finalMessage?: string) => {
    updateMessage(id, {
      type: success ? 'success' : 'error',
      progress: 100,
      persistent: false,
      duration: 3000,
      ...(finalMessage && { message: finalMessage })
    })

    setTimeout(() => removeMessage(id), 3000)
  }, [updateMessage, removeMessage])

  return {
    startProgress,
    updateProgress,
    completeProgress
  }
}

// 피드백 컨테이너
function FeedbackContainer() {
  const { messages } = useFeedback()

  return (
    <>
      {/* 토스트 메시지들 */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {messages
          .filter(msg => msg.type !== 'progress')
          .slice(-5) // 최대 5개만 표시
          .map(message => (
            <ToastMessage key={message.id} message={message} />
          ))}
      </div>

      {/* 진행률 표시 */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {messages
          .filter(msg => msg.type === 'progress')
          .map(message => (
            <ProgressMessage key={message.id} message={message} />
          ))}
      </div>
    </>
  )
}

// 토스트 메시지 컴포넌트
function ToastMessage({ message }: { message: FeedbackMessage }) {
  const { removeMessage } = useFeedback()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // 입장 애니메이션
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => removeMessage(message.id), 300)
  }, [message.id, removeMessage])

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
      case 'loading':
        return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      default:
        return null
    }
  }

  const getBackgroundColor = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'loading':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getBackgroundColor()}
        border rounded-lg shadow-lg p-4 max-w-sm
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {message.title && (
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {message.title}
            </h4>
          )}
          <p className="text-sm text-gray-700">
            {message.message}
          </p>
          
          {message.action && (
            <button
              onClick={message.action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {message.action.label}
            </button>
          )}
        </div>

        {!message.persistent && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// 진행률 메시지 컴포넌트
function ProgressMessage({ message }: { message: FeedbackMessage }) {
  const { removeMessage } = useFeedback()
  const progress = message.progress || 0

  const handleClose = () => {
    removeMessage(message.id)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          {message.title && (
            <h4 className="text-sm font-semibold text-gray-900">
              {message.title}
            </h4>
          )}
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-gray-700 mb-3">
        {message.message}
      </p>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>진행률</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// 즉시 피드백 컴포넌트들
export function InstantButton({
  children,
  onClick,
  successMessage = '완료되었습니다',
  errorMessage = '오류가 발생했습니다',
  loadingMessage = '처리 중...',
  className = '',
  disabled = false,
  ...props
}: {
  children: React.ReactNode
  onClick: () => Promise<void> | void
  successMessage?: string
  errorMessage?: string
  loadingMessage?: string
  className?: string
  disabled?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const { success, error, loading } = useToast()
  const { removeMessage } = useFeedback()

  const handleClick = async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    const loadingId = loading(loadingMessage)

    try {
      await onClick()
      removeMessage(loadingId)
      success(successMessage)
    } catch (err) {
      removeMessage(loadingId)
      error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        relative transition-all duration-200
        ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  )
}

export function InstantForm({
  children,
  onSubmit,
  successMessage = '저장되었습니다',
  errorMessage = '저장에 실패했습니다',
  className = ''
}: {
  children: React.ReactNode
  onSubmit: (formData: FormData) => Promise<void>
  successMessage?: string
  errorMessage?: string
  className?: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()
  const { startProgress, updateProgress, completeProgress } = useProgressFeedback()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    const progressId = startProgress('폼을 저장하는 중...')

    try {
      const formData = new FormData(e.currentTarget)
      
      // 진행률 시뮬레이션
      updateProgress(progressId, 30)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      updateProgress(progressId, 70)
      await onSubmit(formData)
      
      completeProgress(progressId, true, successMessage)
    } catch (err) {
      completeProgress(progressId, false, errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <fieldset disabled={isSubmitting}>
        {children}
      </fieldset>
    </form>
  )
}

// 실시간 상태 표시 컴포넌트
export function LiveStatusIndicator({
  status,
  messages = {
    idle: '대기 중',
    loading: '처리 중...',
    success: '완료',
    error: '오류 발생'
  },
  showIcon = true,
  className = ''
}: {
  status: 'idle' | 'loading' | 'success' | 'error'
  messages?: Record<string, string>
  showIcon?: boolean
  className?: string
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600 bg-blue-50'
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getIcon = () => {
    if (!showIcon) return null

    switch (status) {
      case 'loading':
        return <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      case 'success':
        return <CheckCircle className="w-3 h-3" />
      case 'error':
        return <AlertCircle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  return (
    <div className={`
      inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
      ${getStatusColor()} ${className}
    `}>
      {getIcon()}
      <span>{messages[status]}</span>
    </div>
  )
}

export default FeedbackProvider