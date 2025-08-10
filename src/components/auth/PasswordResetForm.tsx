'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { auth } from '@/lib/auth'
import Button from '@/components/ui/Button'

const resetSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
})

type ResetFormData = z.infer<typeof resetSchema>

interface PasswordResetFormProps {
  onBack?: () => void
}

export default function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetFormData) => {
    try {
      setResetError(null)
      
      const { error } = await auth.resetPassword(data.email)
      
      if (error) {
        setResetError(error.message || '비밀번호 재설정 이메일 발송에 실패했습니다.')
        return
      }

      setResetSuccess(true)
    } catch (error) {
      console.error('Password reset error:', error)
      setResetError('비밀번호 재설정 중 오류가 발생했습니다.')
    }
  }

  if (resetSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="p-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">이메일을 확인하세요</h3>
          <p className="text-sm text-gray-600 mb-6">
            비밀번호 재설정 링크를 이메일로 발송했습니다.
            <br />
            이메일을 확인하고 링크를 클릭해주세요.
          </p>
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              로그인으로 돌아가기
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">비밀번호 재설정</h2>
        <p className="text-gray-600">
          가입하신 이메일 주소를 입력하시면
          <br />
          비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {resetError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">재설정 실패</h4>
              <p className="text-sm text-red-600 mt-1">{resetError}</p>
            </div>
          </div>
        )}
        
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

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                발송 중...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Mail className="h-5 w-5 mr-2" />
                재설정 링크 발송
              </div>
            )}
          </Button>

          {onBack && (
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              로그인으로 돌아가기
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}