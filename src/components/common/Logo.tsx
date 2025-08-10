import React from 'react'
import Link from 'next/link'
import { Activity } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  showSlogan?: boolean
  className?: string
  href?: string
}

export default function Logo({ 
  size = 'md', 
  showText = true, 
  showSlogan = false,
  className = '',
  href = '/'
}: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: 'h-6 w-6',
      text: 'text-lg',
      slogan: 'text-xs'
    },
    md: {
      icon: 'h-8 w-8',
      text: 'text-2xl',
      slogan: 'text-sm'
    },
    lg: {
      icon: 'h-12 w-12',
      text: 'text-4xl',
      slogan: 'text-base'
    }
  }

  const LogoContent = () => (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Activity className={`${className.includes('text-white') ? 'text-white' : 'text-slate-800'} ${sizeClasses[size].icon}`} />
      {showText && (
        <div className="flex flex-col">
          <div className={`font-bold ${className.includes('text-white') ? 'text-white' : 'text-slate-800'} ${sizeClasses[size].text}`}>
            Obdoc
          </div>
          {showSlogan && (
            <div className={`${className.includes('text-white') ? 'text-white/80' : 'text-gray-500'} ${sizeClasses[size].slogan} -mt-1`}>
              비만 관리의 흐름을 설계하다
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}