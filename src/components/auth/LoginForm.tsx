'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { useFormFeedback } from '@/hooks/useFeedback'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const { 
    handleSubmitSuccess, 
    handleSubmitError,
    startLoading,
    stopLoading,
    checkLoading
  } = useFormFeedback()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const isSubmitting = checkLoading('login-form')

  const onSubmit = async (data: LoginFormData) => {
    try {
      startLoading('login-form', { message: '로그인 중...' })
      
      const { error } = await signIn(data.email, data.password)
      
      if (error) {
        handleSubmitError(error.message || '로그인에 실패했습니다.')
        return
      }

      handleSubmitSuccess('로그인되었습니다.')
      // AuthContext에서 자동으로 리다이렉트 처리됨
    } catch (error) {
      console.error('Login error:', error)
      handleSubmitError('로그인 중 오류가 발생했습니다.')
    } finally {
      stopLoading('login-form')
    }
  }

  // 개발 환경 체크
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_url_here')

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 개발 모드 안내 */}
      {isDevelopment && isDummySupabase && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">🚀 개발 모드</h4>
          <p className="text-sm text-blue-600 mb-2">
            더미 인증을 사용합니다. 아무 이메일과 6자 이상의 비밀번호로 로그인하세요.
          </p>
          <div className="text-xs text-blue-500 space-y-1">
            <div>• doctor@test.com → 의사 계정</div>
            <div>• admin@test.com → 관리자 계정</div>
            <div>• patient@test.com → 고객 계정</div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              이메일 주소
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('email')}
                type="email"
                id="email"
                placeholder="example@obdoc.co.kr"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="비밀번호를 입력하세요"
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              로그인 중...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <LogIn className="h-5 w-5 mr-2" />
              로그인
            </div>
          )}
        </Button>

      </form>
    </div>
  )
}