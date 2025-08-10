import React from 'react'
import { cn } from '@/lib/utils'
import { useDensity } from '@/contexts/DensityContext'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: 'compact' | 'comfortable' | 'spacious'
}

const DensityCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, density, ...props }, ref) => {
    const { density: contextDensity, getDensityClass } = useDensity()
    const activeDensity = density || contextDensity

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          getDensityClass('card'),
          `card-${activeDensity}`,
          className
        )}
        {...props}
      />
    )
  }
)
DensityCard.displayName = 'DensityCard'

const DensityCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { getDensityClass } = useDensity()
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          getDensityClass('card-header'),
          className
        )}
        {...props}
      />
    )
  }
)
DensityCardHeader.displayName = 'DensityCardHeader'

const DensityCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { config } = useDensity()
    
    return (
      <h3
        ref={ref}
        className={cn(
          'text-2xl font-semibold leading-none tracking-tight',
          className
        )}
        style={{ fontSize: config.fontSize.lg }}
        {...props}
      />
    )
  }
)
DensityCardTitle.displayName = 'DensityCardTitle'

const DensityCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { config } = useDensity()
    
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        style={{ fontSize: config.fontSize.sm }}
        {...props}
      />
    )
  }
)
DensityCardDescription.displayName = 'DensityCardDescription'

const DensityCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { getDensityClass } = useDensity()
    
    return (
      <div
        ref={ref}
        className={cn(
          getDensityClass('card-content'),
          className
        )}
        {...props}
      />
    )
  }
)
DensityCardContent.displayName = 'DensityCardContent'

const DensityCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { getDensityClass } = useDensity()
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          getDensityClass('card-footer'),
          className
        )}
        {...props}
      />
    )
  }
)
DensityCardFooter.displayName = 'DensityCardFooter'

export {
  DensityCard,
  DensityCardHeader,
  DensityCardFooter,
  DensityCardTitle,
  DensityCardDescription,
  DensityCardContent,
}