'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Check, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

const subscriptionPlans = [
  {
    id: '1month' as const,
    name: '1개월 플랜',
    duration: '1개월',
    price: 199000,
    originalPrice: 199000,
    discount: 0,
    features: ['기본 기능', '고객 관리', '예약 시스템']
  },
  {
    id: '6months' as const,
    name: '6개월 플랜',
    duration: '6개월',
    price: 1015000,
    originalPrice: 1194000,
    discount: 15,
    features: ['기본 기능', '고객 관리', '예약 시스템', '통계 분석'],
    recommended: true
  },
  {
    id: '12months' as const,
    name: '12개월 플랜',
    duration: '12개월',
    price: 1791000,
    originalPrice: 2388000,
    discount: 25,
    features: ['기본 기능', '고객 관리', '예약 시스템', '통계 분석', '우선 지원']
  }
]

export default function SubscriptionPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePlanSelect = async () => {
    if (!selectedPlan) return

    setIsSubmitting(true)
    try {
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // 의사 프로필에 구독 플랜 업데이트
        const { error } = await supabase
          .from('doctors')
          .update({
            subscription_plan: selectedPlan,
            subscription_status: 'pending'
          })
          .eq('user_id', user.id)

        if (error) {
          console.error('구독 플랜 업데이트 실패:', error)
          alert('구독 플랜 선택에 실패했습니다.')
          return
        }

        // 의사 대시보드로 이동
        router.push('/dashboard/doctor')
      }
    } catch (error) {
      console.error('구독 플랜 선택 오류:', error)
      alert('오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    // 나중에 선택하고 대시보드로 이동
    router.push('/dashboard/doctor')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">구독 플랜 선택</h1>
          <p className="text-gray-600">ObDoc 서비스를 이용하기 위한 구독 플랜을 선택해주세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${plan.recommended ? 'ring-2 ring-green-200' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    추천
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ₩{plan.price.toLocaleString()}
                  </span>
                  {plan.discount > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="line-through">₩{plan.originalPrice.toLocaleString()}</span>
                      <span className="ml-2 text-red-600 font-medium">{plan.discount}% 할인</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 mb-6">{plan.duration} 이용권</p>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {selectedPlan === plan.id && (
                  <div className="absolute top-4 right-4">
                    <Check className="h-6 w-6 text-blue-600" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            나중에 선택하기
          </button>

          <Button
            onClick={handlePlanSelect}
            disabled={!selectedPlan || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                처리 중...
              </div>
            ) : (
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                선택 완료
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}