'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import Logo from '@/components/common/Logo'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    hospitalName: '',
    hospitalType: 'clinic',
    subscriptionPlan: '1month'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { signUp } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.name) {
      addToast('필수 정보를 모두 입력해주세요.', 'error')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      addToast('비밀번호가 일치하지 않습니다.', 'error')
      return
    }

    if (formData.password.length < 6) {
      addToast('비밀번호는 6자 이상이어야 합니다.', 'error')
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await signUp(formData.email, formData.password, {
        name: formData.name,
        hospital_name: formData.hospitalName,
        hospital_type: formData.hospitalType,
        subscription_plan: formData.subscriptionPlan,
        role: 'doctor'
      })
      
      if (error) {
        addToast(error.message || '회원가입에 실패했습니다.', 'error')
      } else {
        addToast('회원가입이 완료되었습니다. 관리자 승인 후 서비스를 이용할 수 있습니다.', 'success')
        router.push('/login')
      }
    } catch (error) {
      addToast('회원가입 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" showText={true} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            원장님 회원가입
          </h2>
          <p className="text-gray-600">
            Obdoc과 함께 비만 클리닉의 새로운 가능성을 발견하세요
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  성명 *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="성명을 입력하세요"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="이메일을 입력하세요"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="비밀번호 (6자 이상)"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인 *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Hospital Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-2">
                  병원명
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="hospitalName"
                    name="hospitalName"
                    type="text"
                    value={formData.hospitalName}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="병원명을 입력하세요"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hospitalType" className="block text-sm font-medium text-gray-700 mb-2">
                  병원 유형
                </label>
                <select
                  id="hospitalType"
                  name="hospitalType"
                  value={formData.hospitalType}
                  onChange={handleInputChange}
                  className="block w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                >
                  <option value="clinic">일반의원</option>
                  <option value="korean_medicine">한의원</option>
                  <option value="hospital">병원</option>
                </select>
              </div>
            </div>

            {/* Subscription Plan */}
            <div>
              <label htmlFor="subscriptionPlan" className="block text-sm font-medium text-gray-700 mb-2">
                구독 플랜
              </label>
              <select
                id="subscriptionPlan"
                name="subscriptionPlan"
                value={formData.subscriptionPlan}
                onChange={handleInputChange}
                className="block w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              >
                <option value="1month">1개월 플랜 (199,000원)</option>
                <option value="6months">6개월 플랜 (1,015,000원) - 15% 할인</option>
                <option value="12months">12개월 플랜 (1,791,000원) - 25% 할인</option>
              </select>
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
                  회원가입
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link 
                href="/login" 
                className="font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>

        {/* Terms Notice */}
        <div className="mt-6 text-center text-xs text-gray-500">
          회원가입 시 <Link href="/terms" className="underline">이용약관</Link> 및{' '}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의하는 것으로 간주됩니다.
        </div>
      </div>
    </div>
  )
}