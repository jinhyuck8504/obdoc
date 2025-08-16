import React from 'react'

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
  const classes = [
    medical ? 'medical-card' : 'card',
    hover ? 'hover-glow' : '',
    onClick ? 'cursor-pointer' : '',
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`card-footer ${className}`}>
      {children}
    </div>
  )
}

// Export aliases for compatibility with shadcn/ui naming conventions
export const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)

export const CardDescription = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
)

export const CardContent = CardBody