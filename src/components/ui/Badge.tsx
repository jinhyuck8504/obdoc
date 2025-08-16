'use client'
import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  children: React.ReactNode
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors'
  
  const variantClasses = {
    default: 'bg-slate-800 text-white',
    secondary: 'bg-slate-100 text-slate-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-slate-200 text-slate-700'
  }

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge