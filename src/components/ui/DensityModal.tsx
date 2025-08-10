import React from 'react'
import { cn } from '@/lib/utils'
import { useDensity } from '@/contexts/DensityContext'
import { X } from 'lucide-react'

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  density?: 'compact' | 'comfortable' | 'spacious'
}

const DensityModal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, title, density, children, ...props }, ref) => {
    const { density: contextDensity, getDensityClass } = useDensity()
    const activeDensity = density || contextDensity

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          ref={ref}
          className={cn(
            'relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto',
            getDensityClass('modal'),
            `modal-${activeDensity}`,
            className
          )}
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    )
  }
)
DensityModal.displayName = 'DensityModal'

const DensityModalHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { getDensityClass } = useDensity()
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between border-b border-gray-200',
          getDensityClass('modal-header'),
          className
        )}
        {...props}
      />
    )
  }
)
DensityModalHeader.displayName = 'DensityModalHeader'

const DensityModalContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { getDensityClass } = useDensity()
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex-1',
          getDensityClass('modal-content'),
          className
        )}
        {...props}
      />
    )
  }
)
DensityModalContent.displayName = 'DensityModalContent'

const DensityModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { getDensityClass } = useDensity()
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end space-x-2 border-t border-gray-200',
          getDensityClass('modal-footer'),
          className
        )}
        {...props}
      />
    )
  }
)
DensityModalFooter.displayName = 'DensityModalFooter'

export {
  DensityModal,
  DensityModalHeader,
  DensityModalContent,
  DensityModalFooter,
}