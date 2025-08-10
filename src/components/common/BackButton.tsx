'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
// import Button from '@/components/ui/Button' // 임시 제거

interface BackButtonProps {
  label?: string
  className?: string
  fallbackPath?: string
}

export default function BackButton({ 
  label = '뒤로가기', 
  className = '',
  fallbackPath = '/dashboard/doctor'
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackPath)
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`flex items-center gap-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  )
}