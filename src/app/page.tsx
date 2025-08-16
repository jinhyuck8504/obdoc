import Link from 'next/link'
import { ArrowRight, Users, BarChart3, MessageCircle, Activity, CheckCircle, Heart, Shield, Zap, TrendingUp, Target, Stethoscope } from 'lucide-react'
import Logo from '@/components/common/Logo'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/card'
import Badge from '@/components/ui/Badge'
import AutoRedirect from '@/components/auth/AutoRedirect'

export default function Home() {
  return (
    <AutoRedirect redirectTo="dashboard">
      <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 opacity-10">
          <Heart className="h-16 w-16 text-white animate-pulse" />
        </div>
        <div className="absolute top-40 right-20 opacity-10">
          <Activity className="h-20 w-20 text-white animate-bounce" />
        </div>
        <div className="absolute bottom-20 left-20 opacity-10">
          <TrendingUp className="h-12 w-12 text-white animate-pulse" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            {/* Logo with enhanced styling */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-110"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Logo size="lg" showText={true} showSlogan={false} className="text-white" />
                </div>
              </div>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="block">비만 관리의</span>
              <span className="block bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
                흐름을 설계하다
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed font-light">
              대한민국 모든 비만 클리닉과 고객들을 연결하는 필수적인 파트너
            </p>
            
            {/* Value Proposition */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-400/30">
                <Target className="h-5 w-5 text-blue-300 mr-2" />
                <span className="text-white text-sm font-medium">목표 달성률 향상</span>
              </div>
              <div className="flex items-center bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-green-400/30">
                <BarChart3 className="h-5 w-5 text-green-300 mr-2" />
                <span className="text-white text-sm font-medium">데이터 기반 분석</span>
              </div>
              <div className="flex items-center bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-orange-400/30">
                <Users className="h-5 w-5 text-orange-300 mr-2" />
                <span className="text-white text-sm font-medium">지속적인 관리</span>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button 
                  size="xl" 
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  <Stethoscope className="mr-2 h-5 w-5" />
                  원장님 가입하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="xl"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-slate-900 font-semibold transition-all duration-200"
                >
                  로그인
                </Button>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-16 pt-8 border-t border-white/20">
              <div className="flex justify-center items-center space-x-8 opacity-60">
                <div className="text-white text-sm">일반의원</div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="text-white text-sm">한의원</div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="text-white text-sm">병원</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-slate-100 text-slate-800 px-4 py-2">
              핵심 기능
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              왜 <span className="text-brand">Obdoc</span>을 선택해야 할까요?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              비만 관리 후 고객 관리 부재 문제를 해결하는 통합 솔루션으로
              <br className="hidden md:block" />
              병원과 고객 모두에게 최적화된 경험을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative bg-white p-8 lg:p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-slate-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl mb-6 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  통합 고객 관리
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  원장님과 고객이 함께 사용하는 플랫폼으로 지속적인 관리와 소통이 가능합니다.
                </p>
                <div className="flex items-center text-slate-600 font-medium">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-500" />
                  실시간 소통 가능
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative bg-white p-8 lg:p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl mb-6 shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  데이터 기반 분석
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  실시간 감량 데이터와 진행 상황을 시각적으로 확인하고 분석할 수 있습니다.
                </p>
                <div className="flex items-center text-gray-600 font-medium">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  진행률 시각화
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative bg-white p-8 lg:p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-slate-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-500 to-slate-600 rounded-2xl mb-6 shadow-lg">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  동기부여 커뮤니티
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  성공 다이어트 챌린지 게시판을 통해 고객들의 지속적인 동기부여를 제공합니다.
                </p>
                <div className="flex items-center text-slate-600 font-medium">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  커뮤니티 지원
                </div>
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="mt-20 bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 lg:p-12 text-center">
            <h3 className="text-3xl font-bold text-white mb-6">
              Obdoc과 함께라면
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">95%</div>
                <div className="text-gray-300">고객 만족도</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">3배</div>
                <div className="text-gray-300">목표 달성률 향상</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">24/7</div>
                <div className="text-gray-300">지속적인 관리</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-slate-100 text-slate-800 px-4 py-2">
              요금제
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              간단하고 <span className="text-brand">투명한</span> 요금제
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              병원 규모에 맞는 합리적인 가격으로 시작하세요
              <br className="hidden md:block" />
              모든 기능을 제한 없이 사용할 수 있습니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 lg:p-10 border border-gray-100">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">1개월 플랜</h3>
                <p className="text-gray-500 mb-6">단기 체험용</p>
                <div className="mb-8">
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    199,000
                    <span className="text-2xl font-normal text-gray-500">원</span>
                  </div>
                  <div className="text-gray-500 mb-2">/월</div>
                  <div className="text-sm font-medium text-gray-600">
                    할인율: 0%
                  </div>
                </div>
                <Link href="/signup?plan=1month">
                  <Button className="w-full mb-6" variant="outline">
                    시작하기
                  </Button>
                </Link>
              </div>
            </div>

            {/* Popular Plan */}
            <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 lg:p-10 transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 text-sm font-bold shadow-lg animate-bounce">
                  ⭐ 가장 인기
                </Badge>
              </div>
              <div className="absolute -top-4 right-4">
                <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 text-sm font-bold shadow-lg animate-pulse">
                  15% 할인
                </Badge>
              </div>
              <div className="text-center text-white">
                <h3 className="text-2xl font-bold mb-2">6개월 플랜</h3>
                <p className="text-gray-300 mb-6">가장 인기있는 플랜</p>
                <div className="mb-8">
                  <div className="text-5xl font-bold mb-2">
                    1,015,000
                    <span className="text-2xl font-normal text-gray-300">원</span>
                  </div>
                  <div className="text-gray-300 mb-2">/6개월</div>
                  <div className="text-sm text-gray-400 line-through mb-1">
                    정가: 1,194,000원
                  </div>
                  <div className="text-sm font-medium text-orange-300">
                    월 169,000원 (<span className="text-yellow-300 font-bold">30,000원 절약</span>)
                  </div>
                </div>
                <Link href="/signup?plan=6months">
                  <Button className="w-full mb-6 bg-white text-slate-800 hover:bg-gray-100 font-bold">
                    지금 시작하기
                  </Button>
                </Link>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 lg:p-10 border border-gray-100">
              <div className="absolute -top-4 right-4">
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-sm font-bold shadow-lg animate-pulse">
                  25% 할인
                </Badge>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">12개월 플랜</h3>
                <p className="text-gray-500 mb-6">최대 할인 혜택</p>
                <div className="mb-8">
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    1,791,000
                    <span className="text-2xl font-normal text-gray-500">원</span>
                  </div>
                  <div className="text-gray-500 mb-2">/년</div>
                  <div className="text-sm text-gray-500 line-through mb-1">
                    정가: 2,388,000원
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    월 149,000원 (<span className="text-green-700 font-bold">50,000원 절약</span>)
                  </div>
                </div>
                <Link href="/signup?plan=12months">
                  <Button className="w-full mb-6" variant="outline">
                    시작하기
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* 가격 안내 문구 */}
          <div className="mt-16 p-8 bg-gradient-to-r from-gray-50 to-slate-50 rounded-3xl max-w-5xl mx-auto border border-slate-100">
            <div className="text-center">
              <h4 className="text-xl font-bold text-gray-900 mb-6">
                투명한 가격 정책
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    모든 가격은 <span className="font-semibold text-gray-900">VAT 포함</span>
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <span className="font-semibold text-gray-900">세금계산서 발행</span> 가능
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    베타 버전 <span className="font-semibold text-slate-600">무통장 입금</span>
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-6 p-4 bg-white rounded-xl border border-gray-200">
                <Shield className="h-4 w-4 inline mr-2 text-slate-500" />
                결제 완료 후 관리자 승인을 통해 서비스가 활성화됩니다
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Obdoc과 함께 비만 클리닉의 새로운 가능성을 발견하고
            <br className="hidden md:block" />
            고객과의 지속적인 관계를 구축해보세요
          </p>
          



        </div>
      </div>
    </div>
    </AutoRedirect>
  )
}