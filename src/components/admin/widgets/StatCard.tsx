'use client'
import React from 'react'


interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  loading?: boolean
}

export default function StatCard({ title, value, change, loading }: StatCardProps) {


  const changeColorClasses = {
    increase: 'text-green-600 bg-green-100',
    decrease: 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="text-center">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2 mx-auto"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-2">
          {typeof value === 'number' ? value.toLocaleString('ko-KR') : value}
        </p>
        {change && (
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${changeColorClasses[change.type]}`}>
              {change.type === 'increase' ? '↗' : '↘'} {Math.abs(change.value)}%
            </span>
            <span className="text-xs text-gray-500 ml-2">{change.period}</span>
          </div>
        )}
      </div>
    </div>
  )
}