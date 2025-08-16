import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  medical?: boolean
  onClick?: () => void
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '', hover = false, medical = false, onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-lg border border-gray-200 shadow-sm'
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow duration-200' : ''
  const medicalClasses = medical ? 'border-blue-200 bg-blue-50' : ''
  const clickableClasses = onClick ? 'cursor-pointer' : ''
  
  return (
    <div 
      className={cn(baseClasses, hoverClasses, medicalClasses, clickableClasses, className)} 
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={cn('p-6 pb-0', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={cn('p-6 pt-0', className)}>
      {children}
    </div>
  )
}

// Export aliases for compatibility with shadcn/ui naming conventions
export const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <h3 className={cn('text-lg font-semibold', className)}>{children}</h3>
)

export const CardDescription = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <p className={cn('text-sm text-gray-600', className)}>{children}</p>
)

export const CardContent = CardBody

// Default export for compatibility
export default Card