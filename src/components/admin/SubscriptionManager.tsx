'use client'
import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Filter,
  Search,
  Eye,
  FileText,
  TrendingUp
} from 'lucide-react'
import { Subscription, SubscriptionFilters, SubscriptionStats } from '@/types/subscription'
import { subscriptionService, SUBSCRIPTION_PLANS } from '@/lib/subscriptionService'

export default function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SubscriptionFilters>({
    status: 'all',
    plan: 'all',
    paymentStatus: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean
    subscriptionId: string
    hospitalName: string
  }>({
    isOpen: false,
    subscriptionId: '',
    hospitalName: ''
  })
  const [rejectReason, setRejectReason] = useState('')
  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean
    subscriptionId: string
    hospitalName: string
  }>({
    isOpen: false,
    subscriptionId: '',
    hospitalName: ''
  })
  const [approveNote, setApproveNote] = useState('')

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const [subscriptionsData, statsData] = await Promise.all([
        subscriptionService.getSubscriptions(filters),
        subscriptionService.getSubscriptionStats()
      ])
      setSubscriptions(subscriptionsData)
      setStats(statsData)
    } catch (error) {
      console.error('구독 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (subscriptionId: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId)
    if (!subscription) return

    setApproveModal({
      isOpen: true,
      subscriptionId,
      hospitalName: subscription.hospitalName
    })
    setApproveNote('')
  }

  const handleApproveConfirm = async () => {
    const subscription = subscriptions.find(s => s.id === approveModal.subscriptionId)
    if (!subscription) return

    const startDate = new Date().toISOString().split('T')[0]
    const endDate = (() => {
      const end = new Date(startDate)
      switch (subscription.plan) {
        case '1month':
          end.setMonth(end.getMonth() + 1)
          break
        case '6months':
          end.setMonth(end.getMonth() + 6)
          break
        case '12months':
          end.setFullYear(end.getFullYear() + 1)
          break
      }
      return end.toISOString().split('T')[0]
    })()

    try {
      setProcessing(approveModal.subscriptionId)
      const updatedSubscription = await subscriptionService.approveSubscription({
        subscriptionId: approveModal.subscriptionId,
        action: 'approve',
        startDate,
        endDate,
        approvedBy: 'admin-1', // 실제로는 현재 관리자 ID
        notes: approveNote.trim() || '관리자 승인'
      })

      setSubscriptions(prev => prev.map(sub => 
        sub.id === approveModal.subscriptionId ? updatedSubscription : sub
      ))

      setApproveModal({ isOpen: false, subscriptionId: '', hospitalName: '' })
      setApproveNote('')
      alert('구독이 승인되었습니다!')
      loadData() // 통계 업데이트
    } catch (error) {
      console.error('구독 승인 실패:', error)
      alert('구독 승인에 실패했습니다.')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = (subscriptionId: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId)
    if (!subscription) return

    setRejectModal({
      isOpen: true,
      subscriptionId,
      hospitalName: subscription.hospitalName
    })
    setRejectReason('')
  }

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      alert('거절 사유를 입력해주세요.')
      return
    }

    try {
      setProcessing(rejectModal.subscriptionId)
      const updatedSubscription = await subscriptionService.approveSubscription({
        subscriptionId: rejectModal.subscriptionId,
        action: 'reject',
        approvedBy: 'admin-1', // 실제로는 현재 관리자 ID
        notes: rejectReason.trim()
      })

      setSubscriptions(prev => prev.map(sub => 
        sub.id === rejectModal.subscriptionId ? updatedSubscription : sub
      ))

      setRejectModal({ isOpen: false, subscriptionId: '', hospitalName: '' })
      setRejectReason('')
      alert('구독이 거절되었습니다.')
      loadData() // 통계 업데이트
    } catch (error) {
      console.error('구독 거절 실패:', error)
      alert('구독 거절에 실패했습니다.')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            활성
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            대기
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            만료
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            취소
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="text-green-600 text-sm">결제완료</span>
      case 'pending':
        return <span className="text-yellow-600 text-sm">결제대기</span>
      case 'failed':
        return <span className="text-red-600 text-sm">결제실패</span>
      default:
        return <span className="text-gray-600 text-sm">{status}</span>
    }
  }

  const getPlanInfo = (planId: string) => {
    return SUBSCRIPTION_PLANS.find(p => p.id === planId)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">구독 데이터를 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">구독 관리</h2>
          <p className="text-gray-600 mt-1">구독 승인, 결제 확인 및 관리</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>필터</span>
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">총 구독</p>
                <p className="text-3xl font-bold">{stats.totalSubscriptions}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">활성 구독</p>
                <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">승인 대기</p>
                <p className="text-3xl font-bold">{stats.pendingSubscriptions}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">총 수익</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>
      )}

      {/* 필터 패널 */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="pending">대기</option>
                <option value="active">활성</option>
                <option value="expired">만료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">플랜</label>
              <select
                value={filters.plan}
                onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="1month">1개월</option>
                <option value="6months">6개월</option>
                <option value="12months">12개월</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">결제 상태</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="pending">대기</option>
                <option value="paid">완료</option>
                <option value="failed">실패</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="병원명, 의사명, 이메일..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 구독 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            구독 목록 ({subscriptions.length}건)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  병원 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  플랜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결제
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.map((subscription) => {
                const planInfo = getPlanInfo(subscription.plan)
                return (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.hospitalName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscription.doctorName} • {subscription.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {subscription.hospitalType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {planInfo?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(subscription.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subscription.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(subscription.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {subscription.startDate && subscription.endDate ? (
                        <div>
                          <div>{formatDate(subscription.startDate)}</div>
                          <div className="text-xs text-gray-500">
                            ~ {formatDate(subscription.endDate)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">미설정</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {subscription.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(subscription.id)}
                              disabled={processing === subscription.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => handleReject(subscription.id)}
                              disabled={processing === subscription.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              거절
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedSubscription(subscription)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 구독 승인 모달 */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">구독 승인</h2>
              </div>
              <button
                onClick={() => setApproveModal({ isOpen: false, subscriptionId: '', hospitalName: '' })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{approveModal.hospitalName}</span>의 구독을 승인하시겠습니까?
                </p>
                <p className="text-xs text-gray-500">
                  승인 시 즉시 구독이 활성화되며, 승인 알림이 해당 병원에 전달됩니다.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  승인 메모 (선택사항)
                </label>
                <textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="승인과 함께 전달할 메시지를 입력해주세요... (선택사항)"
                  maxLength={300}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {approveNote.length}/300
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">승인 시 처리사항</p>
                    <ul className="text-xs space-y-1">
                      <li>• 구독이 즉시 활성화됩니다</li>
                      <li>• 구독 기간이 자동으로 설정됩니다</li>
                      <li>• 승인 알림이 해당 병원에 전달됩니다</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setApproveModal({ isOpen: false, subscriptionId: '', hospitalName: '' })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={processing === approveModal.subscriptionId}
                >
                  취소
                </button>
                <button
                  onClick={handleApproveConfirm}
                  disabled={processing === approveModal.subscriptionId}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {processing === approveModal.subscriptionId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>승인 중...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>승인하기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 구독 거절 모달 */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">구독 거절</h2>
              </div>
              <button
                onClick={() => setRejectModal({ isOpen: false, subscriptionId: '', hospitalName: '' })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{rejectModal.hospitalName}</span>의 구독을 거절하시겠습니까?
                </p>
                <p className="text-xs text-gray-500">
                  거절 사유는 해당 병원에 이메일로 전달됩니다.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  거절 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="구독 거절 사유를 상세히 입력해주세요..."
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {rejectReason.length}/500
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">거절 시 안내사항</p>
                    <ul className="text-xs space-y-1">
                      <li>• 거절된 구독은 다시 승인할 수 없습니다</li>
                      <li>• 거절 사유는 해당 병원에 이메일로 전달됩니다</li>
                      <li>• 병원에서 다시 구독 신청을 할 수 있습니다</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setRejectModal({ isOpen: false, subscriptionId: '', hospitalName: '' })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={processing === rejectModal.subscriptionId}
                >
                  취소
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={processing === rejectModal.subscriptionId || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {processing === rejectModal.subscriptionId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>거절 중...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>거절하기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 구독 상세 모달 */}
      {selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">구독 상세 정보</h2>
              <button
                onClick={() => setSelectedSubscription(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">기본 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">병원명:</span>
                    <span className="text-sm font-medium">{selectedSubscription.hospitalName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">의사명:</span>
                    <span className="text-sm font-medium">{selectedSubscription.doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">이메일:</span>
                    <span className="text-sm font-medium">{selectedSubscription.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">병원 유형:</span>
                    <span className="text-sm font-medium">{selectedSubscription.hospitalType}</span>
                  </div>
                </div>
              </div>

              {/* 구독 정보 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">구독 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">플랜:</span>
                    <span className="text-sm font-medium">
                      {getPlanInfo(selectedSubscription.plan)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">금액:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(selectedSubscription.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">상태:</span>
                    {getStatusBadge(selectedSubscription.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">결제 상태:</span>
                    {getPaymentStatusBadge(selectedSubscription.paymentStatus)}
                  </div>
                  {selectedSubscription.startDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">시작일:</span>
                      <span className="text-sm font-medium">
                        {formatDate(selectedSubscription.startDate)}
                      </span>
                    </div>
                  )}
                  {selectedSubscription.endDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">종료일:</span>
                      <span className="text-sm font-medium">
                        {formatDate(selectedSubscription.endDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 승인 정보 */}
              {selectedSubscription.approvedBy && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">승인 정보</h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">승인자:</span>
                      <span className="text-sm font-medium">{selectedSubscription.approvedBy}</span>
                    </div>
                    {selectedSubscription.approvedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">승인일:</span>
                        <span className="text-sm font-medium">
                          {formatDate(selectedSubscription.approvedAt)}
                        </span>
                      </div>
                    )}
                    {selectedSubscription.notes && (
                      <div>
                        <span className="text-sm text-gray-600">메모:</span>
                        <p className="text-sm font-medium mt-1">{selectedSubscription.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}