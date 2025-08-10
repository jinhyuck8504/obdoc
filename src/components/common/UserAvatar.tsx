'use client'

import React from 'react'
import { User } from 'lucide-react'

interface UserAvatarProps {
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * 텍스트 기반 사용자 아바타 컴포넌트
 * 프로필 이미지 대신 이니셜을 사용합니다.
 */
export default function UserAvatar({ name, size = 'md', className = '' }: UserAvatarProps) {
  const getInitials = (fullName?: string) => {
    if (!fullName) return '?'
    
    const names = fullName.trim().split(/\s+/)
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase()
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  const getAvatarColor = (fullName?: string) => {
    if (!fullName) return 'bg-gray-100 text-gray-600'
    
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-yellow-100 text-yellow-700',
      'bg-red-100 text-red-700',
      'bg-teal-100 text-teal-700'
    ]
    
    const hash = fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  const initials = getInitials(name)
  const colorClasses = getAvatarColor(name)

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${colorClasses}
        rounded-full 
        flex items-center justify-center 
        font-medium 
        border border-opacity-20 border-current
        ${className}
      `}
      title={name || '사용자'}
    >
      {initials === '?' ? (
        <User className="w-1/2 h-1/2" />
      ) : (
        initials
      )}
    </div>
  )
}