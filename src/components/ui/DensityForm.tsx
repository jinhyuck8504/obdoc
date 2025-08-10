import React from 'react'
import { cn } from '@/lib/utils'
import { useDensity } from '@/contexts/DensityContext'

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  density?: 'compact' | 'comfortable' | 'spacious'
}

const DensityForm = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, density, ...props }, ref) => {
    const { density: contextDensity, getDensityClass } = useDensity()
    const activeDensity = density || contextDensity

    return (
      <form
        ref={ref}
        className={cn(
          'flex flex-col',
          getDensityClass('form'),
          `form-${activeDensity}`,
          className
        )}
        {...props}
      />
    )
  }
)
DensityForm.displayName = 'DensityForm'

const DensityFormGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { getDensityClass } = useDensity()
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col',
          getDensityClass('form-group'),
          'form-group',
          className
        )}
        {...props}
      />
    )
  }
)
DensityFormGroup.displayName = 'DensityFormGroup'

const DensityFormLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    const { getDensityClass, config } = useDensity()
    
    return (
      <label
        ref={ref}
        className={cn(
          'font-medium text-gray-700',
          getDensityClass('form-label'),
          'form-label',
          className
        )}
        style={{ fontSize: config.fontSize.sm }}
        {...props}
      />
    )
  }
)
DensityFormLabel.displayName = 'DensityFormLabel'

const DensityFormError = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { config } = useDensity()
    
    return (
      <p
        ref={ref}
        className={cn('text-red-600', className)}
        style={{ fontSize: config.fontSize.xs }}
        {...props}
      />
    )
  }
)
DensityFormError.displayName = 'DensityFormError'

const DensityFormHelperText = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { config } = useDensity()
    
    return (
      <p
        ref={ref}
        className={cn('text-gray-500', className)}
        style={{ fontSize: config.fontSize.xs }}
        {...props}
      />
    )
  }
)
DensityFormHelperText.displayName = 'DensityFormHelperText'

export {
  DensityForm,
  DensityFormGroup,
  DensityFormLabel,
  DensityFormError,
  DensityFormHelperText,
}