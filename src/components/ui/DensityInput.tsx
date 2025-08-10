import React from 'react'
import { cn } from '@/lib/utils'
import { useDensity } from '@/contexts/DensityContext'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  density?: 'compact' | 'comfortable' | 'spacious'
}

const DensityInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, density, ...props }, ref) => {
    const { density: contextDensity, getDensityClass } = useDensity()
    const activeDensity = density || contextDensity

    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          getDensityClass('input'),
          `input-${activeDensity}`,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
DensityInput.displayName = 'DensityInput'

export { DensityInput }