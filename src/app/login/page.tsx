'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import Logo from '@/components/common/Logo'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { signIn } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      addToast('이메일과 비밀번호를 입력해주세요.', 'error')
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        addToast(error.message || '로그인에 실패했습니다.', 'error')
      } else {
        addToast('로그인되었습니다.', 'success')
        // AuthContext에서 자동 리다이렉트가 처리되므로 여기서는 제거
        // 만약 자동 리다이렉트가 안 되면 수동으로 처리
        setTimeout(() => {
          const currentPath = window.location.pathname
          if (currentPath === '/login') {
            // 여전히 로그인 페이지에 있으면 강제로 홈으로 이동
            router.push('/')
          }
        }, 1000)
      }
    } catch (error) {
      addToast('로그인 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" showText={true} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            로그인
          </h2>
          <p className="text-gray-600">
            Obdoc 계정으로 로그인하세요
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full flex items-center justify-center"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  로그인
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              아직 계정이 없으신가요?{' '}
              <Link 
                href="/signup" 
                className="font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-800 mb-2">서비스 문의</h3>
          <div className="text-xs text-slate-700 space-y-1">
            <p>계정 생성 및 서비스 이용 문의</p>
            <p>📧 brandnewmedi@naver.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}