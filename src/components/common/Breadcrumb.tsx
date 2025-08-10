import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  className?: string
}

export default function Breadcrumb({ 
  items, 
  showHome = true, 
  className = '' 
}: BreadcrumbProps) {
  return (
    <nav 
      className={`flex ${className}`} 
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {showHome && (
          <li className="inline-flex items-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              홈
            </Link>
          </li>
        )}
        
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              {(showHome || index > 0) && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              )}
              
              {item.href && !item.current ? (
                <Link
                  href={item.href}
                  className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className={`ml-1 text-sm font-medium md:ml-2 ${
                    item.current 
                      ? 'text-blue-600' 
                      : 'text-gray-500'
                  }`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}