'use client'

import React, { useState, useEffect } from 'react'
import { X, BarChart3, TrendingUp, Users, Building, DollarSign, Calendar, Activity, Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { useToast } from '@/hooks/use-toast'

interface AnalyticsData {
  overview: {
    total_hospitals: number
    total_users: number
    monthly_revenue: number
    growth_rate: number
  }
  monthly_stats: {
    month: string
    hospitals: number
    users: number
    revenue: number
  }[]
  hospital_types: {
    type: string
    count: number
    percentage: number
  }[]
  subscription_plans: {
    plan: string
    count: number
    revenue: number
  }[]
  recent_trends: {
    date: string
    new_hospitals: number
    new_users: number
    revenue: number
  }[]
}

interface AnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('30days')

  // 분석 데이터 조회
  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      console.log('Fetching analytics from API...')
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`)
      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API Result:', result)
      
      if (result.success) {
        setAnalytics(result.data)
      } else {
        throw new Error(result.error || 'API returned error')
      }
    } catch (error) {
      console.error('분석 데이터 조회 오류:', error)
      toast({
        title: '오류 발생',
        description: '분석 데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 데이터 내보내기
  const handleExportData = () => {
    if (!analytics) return
    
    const csvData = [
      ['구분', '값'],
      ['총 병원 수', analytics.overview.total_hospitals],
      ['총 사용자 수', analytics.overview.total_users],
      ['월 매출', analytics.overview.monthly_revenue],
      ['성장률', `${analytics.overview.growth_rate}%`],
      [''],
      ['병원 유형별 분포'],
      ...analytics.hospital_types.map(item => [item.type, `${item.count}개 (${item.percentage}%)`]),
      [''],
      ['구독 플랜별 현황'],
      ...analytics.subscription_plans.map(item => [item.plan, `${item.count}개 (₩${item.revenue.toLocaleString()})`])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `obdoc_analytics_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    toast({
      title: '내보내기 완료',
      description: '분석 데이터가 CSV 파일로 다운로드되었습니다.'
    })
  }

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics()
    }
  }, [isOpen, selectedPeriod])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">통계 분석</h2>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7days">최근 7일</option>
              <option value="30days">최근 30일</option>
              <option value="90days">최근 90일</option>
              <option value="1year">최근 1년</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleExportData} disabled={!analytics}>
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">분석 데이터를 불러오는 중...</p>
            </div>
          ) : !analytics ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">분석 데이터를 불러올 수 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardBody className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">총 병원 수</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.overview.total_hospitals}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">총 사용자 수</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.overview.total_users.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-yellow-100">
                        <DollarSign className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">월 매출</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₩{(analytics.overview.monthly_revenue / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-purple-100">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">성장률</p>
                        <p className="text-2xl font-bold text-green-600">+{analytics.overview.growth_rate}%</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trends */}
                <Card>
                  <CardBody className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 성장 추이</h3>
                    <div className="space-y-4">
                      {analytics.monthly_stats && analytics.monthly_stats.length > 0 ? (
                        analytics.monthly_stats.map((stat, index) => (
                          <div key={stat.month} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">{stat.month}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                병원 {stat.hospitals}개 | 사용자 {stat.users}명
                              </div>
                              <div className="text-sm font-medium text-green-600">
                                ₩{(stat.revenue / 1000000).toFixed(1)}M
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">월별 통계 데이터가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Hospital Types */}
                <Card>
                  <CardBody className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">병원 유형별 분포</h3>
                    <div className="space-y-4">
                      {analytics.hospital_types && analytics.hospital_types.length > 0 ? (
                        analytics.hospital_types.map((type) => (
                          <div key={type.type} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">
                                {type.type === 'clinic' ? '일반의원' :
                                 type.type === 'korean_medicine' ? '한의원' :
                                 type.type === 'hospital' ? '종합병원' : type.type}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{type.count}개</div>
                              <div className="text-xs text-gray-500">{type.percentage}%</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">병원 유형 데이터가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Subscription Plans */}
                <Card>
                  <CardBody className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">구독 플랜별 현황</h3>
                    <div className="space-y-4">
                      {analytics.subscription_plans && analytics.subscription_plans.length > 0 ? (
                        analytics.subscription_plans.map((plan) => (
                          <div key={plan.plan} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">
                                {plan.plan === '1month' ? '1개월' :
                                 plan.plan === '6months' ? '6개월' :
                                 plan.plan === '12months' ? '12개월' : plan.plan} 플랜
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{plan.count}개</div>
                              <div className="text-xs text-green-600">₩{plan.revenue.toLocaleString()}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">구독 플랜 데이터가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Recent Trends */}
                <Card>
                  <CardBody className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동 추이</h3>
                    <div className="space-y-4">
                      {analytics.recent_trends && analytics.recent_trends.length > 0 ? (
                        analytics.recent_trends.map((trend) => (
                          <div key={trend.date} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Activity className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">
                                {new Date(trend.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">
                                병원 +{trend.new_hospitals} | 사용자 +{trend.new_users}
                              </div>
                              <div className="text-xs text-green-600">
                                ₩{trend.revenue.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">최근 활동 데이터가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Summary */}
              <Card>
                <CardBody className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">분석 요약</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">성장 현황</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• 월 성장률: {analytics.overview.growth_rate}%</li>
                        <li>• 신규 병원: 월 평균 6개</li>
                        <li>• 신규 사용자: 월 평균 184명</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">수익 분석</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• 월 총 매출: ₩{(analytics.overview.monthly_revenue / 1000000).toFixed(1)}M</li>
                        <li>• 병원당 평균: ₩{Math.round(analytics.overview.monthly_revenue / analytics.overview.total_hospitals / 1000)}K</li>
                        <li>• 가장 인기 플랜: 6개월</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">시장 분포</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• 일반의원: 59.6% (주력)</li>
                        <li>• 한의원: 25.5%</li>
                        <li>• 종합병원: 14.9%</li>
                      </ul>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              데이터 기준: {selectedPeriod === '7days' ? '최근 7일' : 
                         selectedPeriod === '30days' ? '최근 30일' :
                         selectedPeriod === '90days' ? '최근 90일' : '최근 1년'}
            </p>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
                새로고침
              </Button>
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsModal