'use client'

import React, { useState, useEffect } from 'react'

interface SafeTimeDisplayProps {
  format?: 'date' | 'time' | 'datetime'
  locale?: string
  options?: Intl.DateTimeFormatOptions
  updateInterval?: number
  className?: string
  placeholder?: string
}

/**
 * SafeTimeDisplay는 시간 표시를 위한 Hydration-safe 컴포넌트입니다.
 * 서버에서는 정적 placeholder를 렌더링하고, 클라이언트에서 실시간 업데이트를 제공하여
 * hydration 불일치를 방지합니다.
 */
export default function SafeTimeDisplay({
  format = 'datetime',
  locale = 'ko-KR',
  options,
  updateInterval = 1000,
  className = '',
  placeholder
}: SafeTimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)

  // 클라이언트에서만 실행되도록 보장
  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
  }, [])

  // 실시간 업데이트 (클라이언트에서만)
  useEffect(() => {
    if (!isClient) return

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, updateInterval)

    return () => clearInterval(timer)
  }, [isClient, updateInterval])

  const formatTime = (date: Date) => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
    return date.toLocaleTimeString(locale, options || defaultOptions)
  }

  const formatDate = (date: Date) => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }
    return date.toLocaleDateString(locale, options || defaultOptions)
  }

  const formatDateTime = (date: Date) => {
    const dateStr = formatDate(date)
    const timeStr = formatTime(date)
    return `${dateStr} • ${timeStr}`
  }

  const getDefaultPlaceholder = () => {
    switch (format) {
      case 'date':
        return '날짜 로딩 중...'
      case 'time':
        return '시간 로딩 중...'
      case 'datetime':
        return '날짜 및 시간 로딩 중...'
      default:
        return '로딩 중...'
    }
  }

  // 서버에서는 placeholder 표시, 클라이언트에서는 실제 시간 표시
  if (!isClient || !currentTime) {
    return (
      <span className={className} suppressHydrationWarning>
        {placeholder || getDefaultPlaceholder()}
      </span>
    )
  }

  return (
    <span className={className} data-testid="time-display">
      {format === 'date' && formatDate(currentTime)}
      {format === 'time' && formatTime(currentTime)}
      {format === 'datetime' && formatDateTime(currentTime)}
    </span>
  )
}