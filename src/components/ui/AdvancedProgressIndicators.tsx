'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, AlertCircle, Clock, Zap, TrendingUp, Activity } from 'lucide-react'

// 프로그레스 타입 정의
export type ProgressVariant = 'linear' | 'circular' | 'step' | 'radial' | 'wave'
export type ProgressSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ProgressProps {
  value: number
  max?: number
  variant?: ProgressVariant
  size?: ProgressSize
  color?: string
  showLabel?: boolean
  showPercentage?: boolean
  animated?: boolean
  striped?: boolean
  className?: string
  children?: React.ReactNode
}

// 기본 프로그레스 컴포넌트
export function AdvancedProgress({
  value,
  max = 100,
  variant = 'linear',
  size = 'md',
  color = 'blue',
  showLabel = false,
  showPercentage = false,
  animated = false,
  striped = false,
  className = '',
  children
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-1'
      case 'md': return 'h-2'
      case 'lg': return 'h-3'
      case 'xl': return 'h-4'
      default: return 'h-2'
    }
  }

  const getColorClasses = () => {
    const colors = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      red: 'bg-red-600',
      yellow: 'bg-yellow-600',
      purple: 'bg-purple-600',
      indigo: 'bg-indigo-600'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  switch (variant) {
    case 'circular':
      return <CircularProgress value={percentage} size={size} color={color} className={className} />
    case 'step':
      return <StepProgress value={percentage} size={size} color={color} className={className} />
    case 'radial':
      return <RadialProgress value={percentage} size={size} color={color} className={className} />
    case 'wave':
      return <WaveProgress value={percentage} size={size} color={color} className={className} />
    default:
      return (
        <div className={`w-full ${className}`}>
          {(showLabel || showPercentage) && (
            <div className="flex justify-between items-center mb-1">
              {showLabel && children && (
                <span className="text-sm font-medium text-gray-700">{children}</span>
              )}
              {showPercentage && (
                <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
              )}
            </div>
          )}
          <div className={`w-full bg-gray-200 rounded-full ${getSizeClasses()}`}>
            <div
              className={`
                ${getSizeClasses()} rounded-full transition-all duration-300 ease-out
                ${getColorClasses()}
                ${animated ? 'animate-pulse' : ''}
                ${striped ? 'bg-gradient-to-r from-current via-transparent to-current bg-[length:20px_20px] animate-[stripe_1s_linear_infinite]' : ''}
              `}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )
  }
}

// 원형 프로그레스
function CircularProgress({ 
  value, 
  size = 'md', 
  color = 'blue', 
  className = '' 
}: {
  value: number
  size: ProgressSize
  color: string
  className?: string
}) {
  const getSizeValue = () => {
    switch (size) {
      case 'sm': return 40
      case 'md': return 60
      case 'lg': return 80
      case 'xl': return 100
      default: return 60
    }
  }

  const sizeValue = getSizeValue()
  const radius = (sizeValue - 8) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getStrokeColor = () => {
    const colors = {
      blue: '#2563eb',
      green: '#16a34a',
      red: '#dc2626',
      yellow: '#ca8a04',
      purple: '#9333ea',
      indigo: '#4f46e5'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={sizeValue}
        height={sizeValue}
        className="transform -rotate-90"
      >
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-700">
          {Math.round(value)}%
        </span>
      </div>
    </div>
  )
}

// 단계별 프로그레스
function StepProgress({ 
  value, 
  size = 'md', 
  color = 'blue', 
  className = '',
  steps = 5 
}: {
  value: number
  size: ProgressSize
  color: string
  className?: string
  steps?: number
}) {
  const currentStep = Math.ceil((value / 100) * steps)

  const getStepSize = () => {
    switch (size) {
      case 'sm': return 'w-6 h-6'
      case 'md': return 'w-8 h-8'
      case 'lg': return 'w-10 h-10'
      case 'xl': return 'w-12 h-12'
      default: return 'w-8 h-8'
    }
  }

  const getColorClasses = (stepIndex: number) => {
    const isCompleted = stepIndex < currentStep
    const isCurrent = stepIndex === currentStep - 1
    
    if (isCompleted) {
      return `bg-${color}-600 text-white`
    } else if (isCurrent) {
      return `bg-${color}-100 border-2 border-${color}-600 text-${color}-600`
    } else {
      return 'bg-gray-200 text-gray-400'
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {Array.from({ length: steps }).map((_, index) => (
        <React.Fragment key={index}>
          <div
            className={`
              ${getStepSize()} rounded-full flex items-center justify-center
              text-sm font-semibold transition-all duration-300
              ${getColorClasses(index + 1)}
            `}
          >
            {index < currentStep - 1 ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
          {index < steps - 1 && (
            <div
              className={`
                flex-1 h-1 rounded-full transition-all duration-300
                ${index < currentStep - 1 ? `bg-${color}-600` : 'bg-gray-200'}
              `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// 방사형 프로그레스
function RadialProgress({ 
  value, 
  size = 'md', 
  color = 'blue', 
  className = '' 
}: {
  value: number
  size: ProgressSize
  color: string
  className?: string
}) {
  const getSizeValue = () => {
    switch (size) {
      case 'sm': return 60
      case 'md': return 80
      case 'lg': return 100
      case 'xl': return 120
      default: return 80
    }
  }

  const sizeValue = getSizeValue()

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: sizeValue, height: sizeValue }}
    >
      <svg
        width={sizeValue}
        height={sizeValue}
        className="absolute inset-0"
      >
        <defs>
          <radialGradient id={`gradient-${color}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`var(--${color}-400)`} stopOpacity="0.8" />
            <stop offset="100%" stopColor={`var(--${color}-600)`} stopOpacity="0.2" />
          </radialGradient>
        </defs>
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={(sizeValue / 2) * (value / 100)}
          fill={`url(#gradient-${color})`}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">
            {Math.round(value)}%
          </div>
          <div className="text-xs text-gray-500">완료</div>
        </div>
      </div>
    </div>
  )
}

// 웨이브 프로그레스
function WaveProgress({ 
  value, 
  size = 'md', 
  color = 'blue', 
  className = '' 
}: {
  value: number
  size: ProgressSize
  color: string
  className?: string
}) {
  const [animationOffset, setAnimationOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationOffset(prev => (prev + 1) % 100)
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const getSizeValue = () => {
    switch (size) {
      case 'sm': return 60
      case 'md': return 80
      case 'lg': return 100
      case 'xl': return 120
      default: return 80
    }
  }

  const sizeValue = getSizeValue()
  const waveHeight = sizeValue * (value / 100)

  return (
    <div 
      className={`relative overflow-hidden rounded-full bg-gray-200 ${className}`}
      style={{ width: sizeValue, height: sizeValue }}
    >
      <div
        className={`absolute bottom-0 left-0 right-0 bg-${color}-500 transition-all duration-300`}
        style={{ height: `${waveHeight}px` }}
      >
        <svg
          width="100%"
          height="20"
          className="absolute top-0 left-0"
          style={{ transform: `translateX(${animationOffset}%)` }}
        >
          <path
            d="M0,10 Q25,0 50,10 T100,10 V20 H0 Z"
            fill="currentColor"
            className={`text-${color}-400`}
          />
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white mix-blend-difference">
          {Math.round(value)}%
        </span>
      </div>
    </div>
  )
}

// 스마트 프로그레스 (자동 타입 감지)
export function SmartProgress({
  value,
  max = 100,
  className = '',
  showETA = false,
  startTime,
  ...props
}: ProgressProps & {
  showETA?: boolean
  startTime?: number
}) {
  const percentage = (value / max) * 100
  const [eta, setEta] = useState<number | null>(null)

  useEffect(() => {
    if (showETA && startTime && value > 0) {
      const elapsed = Date.now() - startTime
      const rate = value / elapsed
      const remaining = max - value
      const estimatedTime = remaining / rate
      setEta(estimatedTime)
    }
  }, [value, max, startTime, showETA])

  const getVariant = (): ProgressVariant => {
    if (percentage < 25) return 'linear'
    if (percentage < 50) return 'step'
    if (percentage < 75) return 'circular'
    return 'radial'
  }

  const getColor = () => {
    if (percentage < 30) return 'red'
    if (percentage < 60) return 'yellow'
    if (percentage < 90) return 'blue'
    return 'green'
  }

  return (
    <div className={className}>
      <AdvancedProgress
        value={value}
        max={max}
        variant={getVariant()}
        color={getColor()}
        animated={percentage > 0 && percentage < 100}
        showPercentage
        {...props}
      />
      {showETA && eta && (
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          예상 완료: {Math.ceil(eta / 1000)}초 후
        </div>
      )}
    </div>
  )
}

// 멀티 프로그레스 (여러 작업 동시 표시)
export function MultiProgress({
  tasks,
  className = ''
}: {
  tasks: Array<{
    id: string
    name: string
    progress: number
    color?: string
  }>
  className?: string
}) {
  const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">전체 진행률</h4>
        <span className="text-sm text-gray-500">{Math.round(totalProgress)}%</span>
      </div>
      
      <AdvancedProgress
        value={totalProgress}
        variant="linear"
        size="md"
        color="blue"
        animated
      />

      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center space-x-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{task.name}</span>
                <span className="text-xs text-gray-500">{Math.round(task.progress)}%</span>
              </div>
              <AdvancedProgress
                value={task.progress}
                variant="linear"
                size="sm"
                color={task.color || 'blue'}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 실시간 활동 인디케이터
export function ActivityIndicator({
  active = false,
  size = 'md',
  color = 'blue',
  className = ''
}: {
  active?: boolean
  size?: ProgressSize
  color?: string
  className?: string
}) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-2 h-2'
      case 'md': return 'w-3 h-3'
      case 'lg': return 'w-4 h-4'
      case 'xl': return 'w-5 h-5'
      default: return 'w-3 h-3'
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`
          ${getSizeClasses()} rounded-full
          ${active ? `bg-${color}-500 animate-pulse` : 'bg-gray-300'}
          transition-colors duration-200
        `}
      />
      <span className={`text-sm ${active ? 'text-gray-900' : 'text-gray-500'}`}>
        {active ? '활성' : '비활성'}
      </span>
    </div>
  )
}

export default AdvancedProgress