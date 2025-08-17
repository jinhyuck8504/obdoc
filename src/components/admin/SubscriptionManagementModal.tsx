'use client'

import React, { useState, useEffect } from 'react'
import { X, CreditCard, Search, Calendar, DollarSign, AlertTriangle, Clock, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'

interface Subscription {
  id: string
  hospital_id: string
  hospital_name: string
  owner_name: string
  email: string
  plan: '1month' | '6months' | '12months'
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  start_date: string
  end_date: string
  amount: number
  payment_method: string
  auto_renewal: boolean
  created_at: string
  last_payment_date?: string
  next_payment_date?: string
}

interface SubscriptionManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // 구독 목록 조회
  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      console.log('Fetching subscriptions from API...')
      const response = await fetch('/api/admin/subscriptions')
      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API Result:', result)
      
      if (result.success) {
        setSubscriptions(result.data)
      } else {
        throw new Error(result.error || 'API returned error')
      }
    } catch (error) {
      console.error('구독 목록 조회 오류:', error)
      toast({
        title: '오류 발생',
        description: '구독 목록을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 구독 갱신
  const handleRenewSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: '갱신 완료',
          description: '구독이 성공적으로 갱신되었습니다.'
        })
        fetchSubscriptions() // 목록 새로고침
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '구독 갱신 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  // 구독 취소
  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('정말로 이 구독을 취소하시겠습니까?')) return
    
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: '취소 완료',
          description: '구독이 취소되었습니다.'
        })
        fetchSubscriptions() // 목록 새로고침
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '구독 취소 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  // 필터링된 구독 목록
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = selectedPlan === 'all' || subscription.plan === selectedPlan
    const matchesStatus = selectedStatus === 'all' || subscription.status === selectedStatus
    
    return matchesSearch && matchesPlan && matchesStatus
  })

  // 상태 배지 색상
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'expired': return 'destructive'
      case 'cancelled': return 'secondary'
      case 'pending': return 'outline'
      default: return 'outline'
    }
  }

  // 만료일까지 남은 일수 계산
  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date()
    const expiry = new Date(endDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptions()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">구독 관리</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="병원명, 원장명, 이메일 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Plan Filter */}
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 플랜</option>
              <option value="1month">1개월</option>
              <option value="6months">6개월</option>
              <option value="12months">12개월</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 상태</option>
              <option value="active">활성</option>
              <option value="expired">만료</option>
              <option value="cancelled">취소</option>
              <option value="pending">대기</option>
            </select>

            {/* Refresh Button */}
            <Button
              onClick={fetchSubscriptions}
              disabled={loading}
              variant="outline"
              className="flex items-center justify-center"
            >
              {loading ? '로딩...' : '새로고침'}
            </Button>
          </div>
        </div>

        {/* Subscription List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">구독 목록을 불러오는 중...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">조건에 맞는 구독이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubscriptions.map((subscription) => {
                const daysUntilExpiry = getDaysUntilExpiry(subscription.end_date)
                const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0
                const isExpired = daysUntilExpiry <= 0
                
                return (
                  <Card key={subscription.id}>
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-medium text-gray-900">{subscription.hospital_name}</h3>
                            <Badge variant={getStatusBadgeVariant(subscription.status)}>
                              {subscription.status === 'active' ? '활성' :
                               subscription.status === 'expired' ? '만료' :
                               subscription.status === 'cancelled' ? '취소' : '대기'}
                            </Badge>
                            {isExpiringSoon && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                곧 만료
                              </Badge>
                            )}
                            {isExpired && subscription.status === 'active' && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                만료됨
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="text-gray-500">원장: </span>
                                <span className="text-gray-900">{subscription.owner_name}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">이메일: </span>
                                <span className="text-gray-900">{subscription.email}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">결제 방법: </span>
                                <span className="text-gray-900">{subscription.payment_method}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="text-gray-500">플랜: </span>
                                <span className="text-gray-900">
                                  {subscription.plan === '1month' ? '1개월' :
                                   subscription.plan === '6months' ? '6개월' : '12개월'}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">금액: </span>
                                <span className="text-gray-900 font-medium">
                                  ₩{subscription.amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">자동 갱신: </span>
                                <span className={subscription.auto_renewal ? 'text-green-600' : 'text-gray-600'}>
                                  {subscription.auto_renewal ? '활성' : '비활성'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              <div>
                                <div className="text-gray-500">시작일</div>
                                <div>{new Date(subscription.start_date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              <div>
                                <div className="text-gray-500">만료일</div>
                                <div className={isExpired ? 'text-red-600 font-medium' : ''}>
                                  {new Date(subscription.end_date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            {subscription.next_payment_date && (
                              <div className="flex items-center text-sm text-gray-600">
                                <DollarSign className="h-4 w-4 mr-2" />
                                <div>
                                  <div className="text-gray-500">다음 결제일</div>
                                  <div>{new Date(subscription.next_payment_date).toLocaleDateString()}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                            <div className="text-sm text-gray-600">
                              <Clock className="h-4 w-4 inline mr-1" />
                              만료까지 {daysUntilExpiry}일 남음
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          {subscription.status === 'expired' && (
                            <Button
                              size="sm"
                              onClick={() => handleRenewSubscription(subscription.id)}
                              className="flex items-center"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              갱신
                            </Button>
                          )}
                          
                          {subscription.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelSubscription(subscription.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              취소
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>총 {filteredSubscriptions.length}개의 구독</p>
              <p className="text-xs mt-1">
                활성: {filteredSubscriptions.filter(s => s.status === 'active').length}개 | 
                만료: {filteredSubscriptions.filter(s => s.status === 'expired').length}개 | 
                취소: {filteredSubscriptions.filter(s => s.status === 'cancelled').length}개
              </p>
            </div>
            <Button onClick={onClose} variant="outline">
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionManagementModal