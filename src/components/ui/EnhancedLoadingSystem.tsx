'use client'

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { Loader2, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react'

// 로딩 상태 타입 정의
export type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'timeout'

export interface LoadingConfig {
  timeout?: number
  showProgress?: boolean
  showEstimatedTime?: boolean
  enableOptimisticUI?: boolean
  retryable?: boolean
  priority?: 'low' | 'normal' | 'high' | 'critical'
}

export interface LoadingContextType {
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
  addLoadingTask: (id: string, config?: LoadingConfig) => void
  removeLoadingTask: (id: string) => void
  updateTaskProgress: (id: string, progress: number) => void
  completeTask: (id: string, success?: boolean) => void
}

// 로딩 컨텍스트
const LoadingContext = createContext<LoadingContextType | null>(null)

// 로딩 태스크 인터페이스
interface LoadingTask {
  id: string
  startTime: number
  progress: number
  state: LoadingState
  config: LoadingConfig
  estimatedDuration?: number
}

// 로딩 프로바이더
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [globalLoading, setGlobalLoading] = useState(false)
  const [tasks, setTasks] = useState<Map<string, LoadingTask>>(new Map())

  const addLoadingTask = useCallback((id: string, config: LoadingConfig = {}) => {
    const task: LoadingTask = {
      id,
      startTime: Date.now(),
      progress: 0,
      state: 'loading',
      config: {
        timeout: 30000,
        showProgress: false,
        showEstimatedTime: false,
        enableOptimisticUI: false,
        retryable: true,
        priority: 'normal',
        ...config
      }
    }

    setTasks(prev => new Map(prev.set(id, task)))
    
    // 글로벌 로딩 상태 업데이트
    setGlobalLoading(true)

    // 타임아웃 설정
    if (task.config.timeout) {
      setTimeout(() => {
        setTasks(prev => {
          const updated = new Map(prev)
          const currentTask = updated.get(id)
          if (currentTask && currentTask.state === 'loading') {
            updated.set(id, { ...currentTask, state: 'timeout' })
          }
          return updated
        })
      }, task.config.timeout)
    }
  }, [])

  const removeLoadingTask = useCallback((id: string) => {
    setTasks(prev => {
      const updated = new Map(prev)
      updated.delete(id)
      
      // 모든 태스크가 완료되면 글로벌 로딩 해제
      if (updated.size === 0) {
        setGlobalLoading(false)
      }
      
      return updated
    })
  }, [])

  const updateTaskProgress = useCallback((id: string, progress: number) => {
    setTasks(prev => {
      const updated = new Map(prev)
      const task = updated.get(id)
      if (task) {
        const elapsed = Date.now() - task.startTime
        const estimatedDuration = progress > 0 ? (elapsed / progress) * 100 : undefined
        
        updated.set(id, {
          ...task,
          progress: Math.min(100, Math.max(0, progress)),
          estimatedDuration
        })
      }
      return updated
    })
  }, [])

  const completeTask = useCallback((id: string, success: boolean = true) => {
    setTasks(prev => {
      const updated = new Map(prev)
      const task = updated.get(id)
      if (task) {
        updated.set(id, {
          ...task,
          progress: 100,
          state: success ? 'success' : 'error'
        })
        
        // 1초 후 태스크 제거
        setTimeout(() => removeLoadingTask(id), 1000)
      }
      return updated
    })
  }, [removeLoadingTask])

  const contextValue: LoadingContextType = {
    globalLoading,
    setGlobalLoading,
    addLoadingTask,
    removeLoadingTask,
    updateTaskProgress,
    completeTask
  }

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <GlobalLoadingIndicator tasks={tasks} />
    </LoadingContext.Provider>
  )
}

// 로딩 컨텍스트 훅
export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}

// 글로벌 로딩 인디케이터
function GlobalLoadingIndicator({ tasks }: { tasks: Map<string, LoadingTask> }) {
  const activeTasks = Array.from(tasks.values()).filter(task => 
    task.state === 'loading' || task.state === 'success' || task.state === 'error'
  )

  if (activeTasks.length === 0) return null

  const criticalTasks = activeTasks.filter(task => task.config.priority === 'critical')
  const highPriorityTasks = activeTasks.filter(task => task.config.priority === 'high')
  
  // 중요한 태스크가 있으면 전체 화면 로딩
  if (criticalTasks.length > 0) {
    return <FullScreenLoader tasks={criticalTasks} />
  }

  // 높은 우선순위 태스크가 있으면 상단 바 로딩
  if (highPriorityTasks.length > 0) {
    return <TopBarLoader tasks={highPriorityTasks} />
  }

  // 일반 태스크는 우측 하단 인디케이터
  return <CornerIndicator tasks={activeTasks} />
}

// 전체 화면 로더
function FullScreenLoader({ tasks }: { tasks: LoadingTask[] }) {
  const mainTask = tasks[0]
  const progress = mainTask.progress
  const estimatedTime = mainTask.estimatedDuration ? 
    Math.max(0, mainTask.estimatedDuration - (Date.now() - mainTask.startTime)) : null

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto">
            {mainTask.state === 'loading' && (
              <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
            )}
            {mainTask.state === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-600" />
            )}
            {mainTask.state === 'error' && (
              <AlertCircle className="w-16 h-16 text-red-600" />
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {mainTask.state === 'loading' && '처리 중입니다...'}
          {mainTask.state === 'success' && '완료되었습니다!'}
          {mainTask.state === 'error' && '오류가 발생했습니다'}
        </h3>

        {mainTask.config.showProgress && mainTask.state === 'loading' && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {mainTask.config.showEstimatedTime && estimatedTime && mainTask.state === 'loading' && (
          <p className="text-sm text-gray-600 flex items-center justify-center">
            <Clock className="w-4 h-4 mr-1" />
            약 {Math.ceil(estimatedTime / 1000)}초 남음
          </p>
        )}

        {mainTask.state === 'error' && mainTask.config.retryable && (
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            다시 시도
          </button>
        )}
      </div>
    </div>
  )
}

// 상단 바 로더
function TopBarLoader({ tasks }: { tasks: LoadingTask[] }) {
  const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className="bg-blue-600 h-1">
        <div 
          className="bg-blue-400 h-full transition-all duration-300"
          style={{ width: `${totalProgress}%` }}
        />
      </div>
      <div className="bg-blue-600 text-white px-4 py-2 text-sm flex items-center justify-between">
        <div className="flex items-center">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span>{tasks.length}개 작업 진행 중...</span>
        </div>
        <div className="text-blue-200">
          {Math.round(totalProgress)}%
        </div>
      </div>
    </div>
  )
}

// 우측 하단 인디케이터
function CornerIndicator({ tasks }: { tasks: LoadingTask[] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div className={`bg-white rounded-lg shadow-lg border transition-all duration-300 ${
        expanded ? 'w-80' : 'w-auto'
      }`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center space-x-2 p-3 w-full text-left"
        >
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm font-medium">
            {tasks.length}개 작업 중
          </span>
          {!expanded && (
            <div className="w-8 h-1 bg-gray-200 rounded-full ml-2">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length}%` 
                }}
              />
            </div>
          )}
        </button>

        {expanded && (
          <div className="border-t border-gray-200 p-3 space-y-2 max-h-60 overflow-y-auto">
            {tasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 개별 태스크 아이템
function TaskItem({ task }: { task: LoadingTask }) {
  const getStatusIcon = () => {
    switch (task.state) {
      case 'loading':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-600" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-600" />
      case 'timeout':
        return <Clock className="w-3 h-3 text-orange-600" />
      default:
        return <div className="w-3 h-3 bg-gray-300 rounded-full" />
    }
  }

  return (
    <div className="flex items-center space-x-2 text-xs">
      {getStatusIcon()}
      <span className="flex-1 truncate">{task.id}</span>
      <span className="text-gray-500">{Math.round(task.progress)}%</span>
    </div>
  )
}

// 스마트 로딩 래퍼 컴포넌트
export function SmartLoader({
  loading,
  children,
  fallback,
  config = {},
  taskId
}: {
  loading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  config?: LoadingConfig
  taskId?: string
}) {
  const { addLoadingTask, removeLoadingTask } = useLoading()

  useEffect(() => {
    if (loading && taskId) {
      addLoadingTask(taskId, config)
    } else if (!loading && taskId) {
      removeLoadingTask(taskId)
    }

    return () => {
      if (taskId) {
        removeLoadingTask(taskId)
      }
    }
  }, [loading, taskId, addLoadingTask, removeLoadingTask, config])

  if (loading) {
    return fallback || <DefaultLoadingFallback config={config} />
  }

  return <>{children}</>
}

// 기본 로딩 폴백
function DefaultLoadingFallback({ config }: { config: LoadingConfig }) {
  if (config.enableOptimisticUI) {
    return <OptimisticSkeleton />
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-gray-600">로딩 중...</p>
      </div>
    </div>
  )
}

// 낙관적 UI 스켈레톤
function OptimisticSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  )
}

// 성능 최적화된 로딩 훅
export function useOptimizedLoading(
  asyncFn: () => Promise<any>,
  deps: React.DependencyList = [],
  config: LoadingConfig = {}
) {
  const [state, setState] = useState<LoadingState>('idle')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const { addLoadingTask, removeLoadingTask, updateTaskProgress, completeTask } = useLoading()

  const execute = useCallback(async () => {
    const taskId = `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      setState('loading')
      setError(null)
      addLoadingTask(taskId, config)

      // 진행률 시뮬레이션 (실제로는 API에서 제공해야 함)
      if (config.showProgress) {
        const progressInterval = setInterval(() => {
          updateTaskProgress(taskId, Math.random() * 80)
        }, 500)

        setTimeout(() => clearInterval(progressInterval), 2000)
      }

      const result = await asyncFn()
      
      setData(result)
      setState('success')
      completeTask(taskId, true)
      
      return result
    } catch (err) {
      setError(err as Error)
      setState('error')
      completeTask(taskId, false)
      throw err
    }
  }, [asyncFn, addLoadingTask, updateTaskProgress, completeTask, config, ...deps])

  return {
    state,
    data,
    error,
    execute,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error'
  }
}

export default SmartLoader