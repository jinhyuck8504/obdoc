import React from 'react'
import { FileX, Plus, Users, Calendar, MessageCircle } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
  variant?: 'default' | 'patients' | 'appointments' | 'community' | 'data'
  className?: string
}

export default function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  icon,
  variant = 'default',
  className = ''
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    switch (variant) {
      case 'patients':
        return <Users className="h-20 w-20 text-gray-300" />
      case 'appointments':
        return <Calendar className="h-20 w-20 text-gray-300" />
      case 'community':
        return <MessageCircle className="h-20 w-20 text-gray-300" />
      case 'data':
        return <FileX className="h-20 w-20 text-gray-300" />
      default:
        return <FileX className="h-20 w-20 text-gray-300" />
    }
  }

  const getBackgroundPattern = () => {
    switch (variant) {
      case 'patients':
        return 'bg-blue-50 border-blue-100'
      case 'appointments':
        return 'bg-green-50 border-green-100'
      case 'community':
        return 'bg-purple-50 border-purple-100'
      case 'data':
        return 'bg-gray-50 border-gray-100'
      default:
        return 'bg-gray-50 border-gray-100'
    }
  }

  return (
    <div className={`text-center py-16 px-8 rounded-lg border-2 border-dashed ${getBackgroundPattern()} ${className}`}>
      <div className="mx-auto mb-6 flex justify-center">
        {icon || getDefaultIcon()}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
        >
          <Plus className="h-5 w-5 mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}