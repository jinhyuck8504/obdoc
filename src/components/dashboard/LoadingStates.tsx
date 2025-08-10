'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

// 위젯 로딩 스켈레톤
export function WidgetSkeleton({ 
  title, 
  rows = 3 
}: { 
  title?: string
  rows?: number 
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        
        {/* 콘텐츠 행들 */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 캘린더 위젯 스켈레톤
export function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="animate-pulse">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 rounded w-20"></div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* 캘린더 그리드 */}
        <div className="grid grid-cols-7 gap-0.5 mb-4">
          {Array.from({ length: 35 }).map((_, index) => (
            <div key={index} className="h-8 bg-gray-200 rounded-sm"></div>
          ))}
        </div>
        
        {/* 오늘 예약 */}
        <div className="pt-3 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 작업 위젯 스켈레톤
export function TasksSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        
        {/* 진행률 바 */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <div className="h-3 bg-gray-200 rounded w-12"></div>
            <div className="h-3 bg-gray-200 rounded w-8"></div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full"></div>
        </div>
        
        {/* 작업 목록 */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 검색 위젯 스켈레톤
export function SearchSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse">
        {/* 헤더 */}
        <div className="h-5 bg-gray-200 rounded w-20 mb-4"></div>
        
        {/* 검색 입력 */}
        <div className="relative mb-4">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
        
        {/* 최근 검색 */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 인라인 로딩 스피너
export function InlineLoader({ 
  size = 'sm', 
  text 
}: { 
  size?: 'sm' | 'md' | 'lg'
  text?: string 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && (
        <span className="text-sm text-gray-600">{text}</span>
      )}
    </div>
  )
}

// 전체 페이지 로딩
export function PageLoader({ text = '로딩 중...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  )
}

// 데이터 없음 상태
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: {
  icon: React.ComponentType<any>
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-8">
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {action}
    </div>
  )
}

export default {
  WidgetSkeleton,
  CalendarSkeleton,
  TasksSkeleton,
  SearchSkeleton,
  InlineLoader,
  PageLoader,
  EmptyState
}