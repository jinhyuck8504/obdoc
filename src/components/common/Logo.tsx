'use client'
import React from 'react'
import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  showSlogan?: boolean
  className?: string
  variant?: 'default' | 'white' | 'dark'
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showSlogan = false,
  className = '',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  const sloganSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  const variantClasses = {
    default: 'text-slate-800',
    white: 'text-white',
    dark: 'text-slate-900'
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className={cn(
        'rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 p-2 shadow-lg',
        sizeClasses[size]
      )}>
        <Activity className="h-full w-full text-white" />
      </div>
      
      {showText && (
        <div className="ml-3">
          <div className={cn(
            'font-bold tracking-tight',
            textSizeClasses[size],
            variantClasses[variant]
          )}>
            Obdoc
          </div>
          {showSlogan && (
            <div className={cn(
              'text-gray-500 font-medium',
              sloganSizeClasses[size]
            )}>
              비만치료의 흐름을 설계하다
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Logo