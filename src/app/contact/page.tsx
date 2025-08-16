'use client'

import React, { useState } from 'react'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileText,
  Users,
  Shield
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import BackButton from '@/components/common/BackButton'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // 실제 구현에서는 API 호출
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const contactMethods = [
    {
      icon: Mail,
      title: '이메일 문의',
      description: '일반 문의 및 제휴 관련',
      contact: 'brandnewmedi@naver.com',
      subContact: '영업일 기준 1-2일 내 답변',
      color: 'blue'
    }
  ]

  const faqCategories = [
    {
      icon: Users,
      title: '회원가입 및 계정',
      description: '회원가입, 로그인, 계정 관리 관련 문의',
      count: '15개 FAQ'
    },
    {
      icon: Shield,
      title: '개인정보 및 보안',
      description: '개인정보 처리, 보안, 데이터 관리 관련',
      count: '12개 FAQ'
    },
    {
      icon: FileText,
      title: '서비스 이용',
      description: '서비스 기능, 이용 방법, 요금 관련',
      count: '20개 FAQ'
    },
    {
      icon: HelpCircle,
      title: '기술 지원',
      description: '앱 오류, 접속 문제, 기술적 이슈',
      count: '18개 FAQ'
    }
  ]

  const businessHours = [
    { day: '월요일 - 금요일', hours: '09:00 - 18:00' },
    { day: '토요일', hours: '09:00 - 13:00' },
    { day: '일요일 및 공휴일', hours: '휴무' }
  ]

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">문의가 접수되었습니다</h2>
            <p className="text-gray-600 mb-6">
              소중한 의견을 보내주셔서 감사합니다.<br />
              영업일 기준 1-2일 내에 답변드리겠습니다.
            </p>
            <Button 
              onClick={() => {
                setIsSubmitted(false)
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  category: '',
                  subject: '',
                  message: ''
                })
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              새 문의하기
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton className="mb-4" />
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">고객지원</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            OBDOC 서비스 이용 중 궁금한 점이나 도움이 필요하시면 언제든지 연락해 주세요.
            전문 상담팀이 신속하고 정확하게 도움을 드리겠습니다.
          </p>
        </div>

        {/* 연락 방법 */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-md">
          {contactMethods.map((method, index) => {
            const IconComponent = method.icon
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600 border-blue-200',
              green: 'bg-green-100 text-green-600 border-green-200',
              yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
              purple: 'bg-purple-100 text-purple-600 border-purple-200'
            }
            
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-lg ${colorClasses[method.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                <p className="text-sm font-medium text-gray-900">{method.contact}</p>
                <p className="text-xs text-gray-500">{method.subContact}</p>
              </Card>
            )
          })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 문의 양식 */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="flex items-center mb-6">
                <Send className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">문의하기</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="이름을 입력해주세요"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="이메일을 입력해주세요"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연락처
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="연락처를 입력해주세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      문의 유형 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">문의 유형을 선택해주세요</option>
                      <option value="account">계정 관련</option>
                      <option value="service">서비스 이용</option>
                      <option value="technical">기술 지원</option>
                      <option value="billing">결제 및 요금</option>
                      <option value="partnership">제휴 문의</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="문의 제목을 입력해주세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문의 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="문의 내용을 자세히 입력해주세요"
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">개인정보 수집 및 이용 동의</p>
                      <p>
                        문의 처리를 위해 개인정보를 수집하며, 답변 완료 후 즉시 파기됩니다.
                        자세한 내용은 <a href="/privacy" className="underline">개인정보처리방침</a>을 참고해주세요.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      문의하기
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 운영 시간 */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <Clock className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">운영 시간</h3>
              </div>
              <div className="space-y-3">
                {businessHours.map((schedule, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{schedule.day}</span>
                    <span className="font-medium text-gray-900">{schedule.hours}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>긴급 문의:</strong> 시스템 장애나 긴급한 기술적 문제는 
                  이메일로 문의해주시면 24시간 내 답변드립니다.
                </p>
              </div>
            </Card>

            {/* FAQ 카테고리 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">자주 묻는 질문</h3>
              <div className="space-y-3">
                {faqCategories.map((category, index) => {
                  const IconComponent = category.icon
                  return (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-start">
                        <IconComponent className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{category.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                          <p className="text-xs text-blue-600 mt-1">{category.count}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* 회사 정보 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">회사 정보</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-900">상호:</span>
                  <span className="text-gray-600 ml-2">주식회사 OBDOC</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">대표이사:</span>
                  <span className="text-gray-600 ml-2">최진혁</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">사업자등록번호:</span>
                  <span className="text-gray-600 ml-2">534-05-02170</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">통신판매업신고:</span>
                  <span className="text-gray-600 ml-2">2024-서울은평-0264</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">주소:</span>
                  <span className="text-gray-600 ml-2">서울특별시 강남구 테헤란로 123, 오비독 빌딩 5층</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}