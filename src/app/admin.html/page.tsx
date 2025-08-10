'use client'

import AuthGuard from '@/components/auth/AuthGuard'
import { Users, Hospital, CreditCard, BarChart3, Settings, Shield } from 'lucide-react'

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Obdoc 관리자</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">시스템 관리자</span>
                <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 필터 섹션 */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">병원 유형별 필터:</label>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="all">전체</option>
                <option value="clinic">의원</option>
                <option value="oriental_clinic">한의원</option>
                <option value="hospital">병원</option>
              </select>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="all">전체 기간</option>
                <option value="today">오늘</option>
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
                <option value="year">올해</option>
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                적용
              </button>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 사용자</p>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Hospital className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">등록 병원</p>
                  <p className="text-2xl font-bold text-gray-900">89</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">활성 구독</p>
                  <p className="text-2xl font-bold text-gray-900">67</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">월 매출</p>
                  <p className="text-2xl font-bold text-gray-900">₩7,380,000</p>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 승인 대기 병원 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">승인 대기 병원</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">강남한의원</h3>
                      <p className="text-sm text-gray-600">한의원 • doctor2@clinic.com</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                        승인
                      </button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                        거절
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">부산다이어트병원</h3>
                      <p className="text-sm text-gray-600">병원 • doctor3@hospital.com</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                        승인
                      </button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                        거절
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 구독 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">최근 구독</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">서울비만클리닉</h3>
                      <p className="text-sm text-gray-600">6개월 플랜 • ₩1,015,000</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      결제완료
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">대구한의원</h3>
                      <p className="text-sm text-gray-600">1개월 플랜 • ₩199,000</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      결제대기
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">인천다이어트병원</h3>
                      <p className="text-sm text-gray-600">12개월 플랜 • ₩1,791,000</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      결제완료
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 세금계산서 관리 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">세금계산서 관리</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">서울비만클리닉</h3>
                      <p className="text-sm text-gray-600">6개월 플랜 • ₩1,015,000</p>
                    </div>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      발행
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">인천다이어트병원</h3>
                      <p className="text-sm text-gray-600">12개월 플랜 • ₩1,791,000</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      발행완료
                    </span>
                  </div>
                  
                  <div className="text-center pt-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      전체 세금계산서 관리 →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 관리 메뉴 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <Users className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">사용자 관리</h3>
              <p className="text-sm text-gray-600">의사, 고객 계정 관리 및 권한 설정</p>
            </button>

            <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <CreditCard className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">구독 관리</h3>
              <p className="text-sm text-gray-600">구독 플랜, 결제 내역 및 승인 처리</p>
            </button>

            <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <BarChart3 className="h-8 w-8 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">통계 분석</h3>
              <p className="text-sm text-gray-600">병원 유형별 필터링 및 매출 분석</p>
            </button>

            <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <Settings className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">시스템 관리</h3>
              <p className="text-sm text-gray-600">공지사항, 세금계산서 및 시스템 설정</p>
            </button>
          </div>

          {/* 공지사항 관리 */}
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">공지사항 관리</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                새 공지사항 작성
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">서비스 점검 안내</h3>
                    <p className="text-sm text-gray-600">2024년 1월 30일 02:00 ~ 04:00 서비스 점검 예정</p>
                    <p className="text-xs text-gray-500 mt-1">우선 표시 • 2024-01-25 작성</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">수정</button>
                    <button className="text-red-600 hover:text-red-800 text-sm">삭제</button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">새로운 기능 업데이트</h3>
                    <p className="text-sm text-gray-600">체중 기록 차트 기능이 추가되었습니다</p>
                    <p className="text-xs text-gray-500 mt-1">2024-01-20 작성</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">수정</button>
                    <button className="text-red-600 hover:text-red-800 text-sm">삭제</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}