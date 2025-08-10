import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft, LogIn, Heart, Users, BarChart3 } from 'lucide-react'
import Logo from '@/components/common/Logo'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23e2e8f0%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Benefits */}
            <div className="hidden lg:block">
              <div className="text-center lg:text-left">
                <Logo size="lg" showText={true} showSlogan={false} className="mb-6" />
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Obdoc과 함께
                  <br />
                  <span className="text-blue-600">새로운 시작</span>을 하세요
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  비만 관리의 흐름을 설계하는 혁신적인 플랫폼에 참여하세요
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">통합 고객 관리</h3>
                      <p className="text-gray-600">원장님과 고객이 함께 사용하는 플랫폼으로 지속적인 관리가 가능합니다.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">데이터 기반 분석</h3>
                      <p className="text-gray-600">실시간 감량 데이터와 진행 상황을 시각적으로 확인하고 분석할 수 있습니다.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100">
                        <Heart className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">동기부여 커뮤니티</h3>
                      <p className="text-gray-600">성공 다이어트 챌린지를 통해 고객들의 지속적인 동기부여를 제공합니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              {/* Mobile Header */}
              <div className="text-center mb-8 lg:hidden">
                <Logo size="lg" showText={true} showSlogan={false} className="mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Obdoc 회원가입
                </h1>
                <p className="text-gray-600">
                  비만 관리의 새로운 패러다임에 참여하세요
                </p>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  계정 만들기
                </h2>
                <p className="text-gray-600">
                  몇 분만 투자하여 Obdoc의 모든 기능을 이용하세요
                </p>
              </div>

              {/* Signup Form Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                <Suspense fallback={<div className="text-center py-4">로딩 중...</div>}>
                  <SignupForm />
                </Suspense>
                
                {/* Additional Actions */}
                <div className="mt-6 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">이미 계정이 있으신가요?</span>
                    </div>
                  </div>
                  
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    로그인하기
                  </Link>
                </div>
              </div>

              {/* Back to Home */}
              <div className="text-center mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  홈으로 돌아가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}