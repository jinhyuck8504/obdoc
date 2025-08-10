'use client'
import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Clock, XCircle, User, Plus, Calendar } from 'lucide-react'
import { UserPenalty, PenaltyFormData } from '@/types/moderation'
import { moderationService } from '@/lib/moderationService'

interface PenaltyManagementProps {
  onStatsUpdate: () => void
}

export default function PenaltyManagement({ onStatsUpdate }: PenaltyManagementProps) {
  const [penalties, setPenalties] = useState<UserPenalty[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState<PenaltyFormData>({
    userId: '',
    type: 'warning',
    reason: '',
    description: '',
    duration: undefined
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadPenalties()
  }, [])

  const loadPenalties = async () => {
    try {
      setLoading(true)
      const data = await moderationService.getPenalties()
      setPenalties(data)
    } catch (error) {
      console.error('제재 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPenaltyTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'suspension': return 'bg-orange-100 text-orange-800'
      case 'ban': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPenaltyTypeText = (type: string) => {
    switch (type) {
      case 'warning': return '경고'
      case 'suspension': return '정지'
      case 'ban': return '차단'
      default: return '알 수 없음'
    }
  }

  const getPenaltyIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle
      case 'suspension': return Clock
      case 'ban': return XCircle
      default: return Shield
    }
  }

  const handleCreatePenalty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId || !formData.reason) return

    setIsSubmitting(true)
    try {
      const newPenalty = await moderationService.createPenalty({
        ...formData,
        issuedBy: 'admin-1', // 실제로는 현재 관리자 ID
        issuedByName: '관리자' // 실제로는 현재 관리자 이름
      })

      setPenalties(prev => [newPenalty, ...prev])
      setShowCreateModal(false)
      setFormData({
        userId: '',
        type: 'warning',
        reason: '',
        description: '',
        duration: undefined
      })
      onStatsUpdate()
      alert('제재가 생성되었습니다.')
    } catch (error) {
      console.error('제재 생성 실패:', error)
      alert('제재 생성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isExpired = (penalty: UserPenalty) => {
    if (!penalty.expiresAt) return false
    return new Date(penalty.expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">제재 목록을 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">사용자 제재 관리</h3>
          <p className="text-sm text-gray-600">총 {penalties.length}건의 제재</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>제재 추가</span>
        </button>
      </div>

      {/* 제재 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {penalties.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">제재 내역이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {penalties.map((penalty) => {
              const PenaltyIcon = getPenaltyIcon(penalty.type)
              const expired = isExpired(penalty)
              
              return (
                <div key={penalty.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <PenaltyIcon className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-gray-900">
                          {penalty.userName}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPenaltyTypeColor(penalty.type)}`}>
                          {getPenaltyTypeText(penalty.type)}
                        </span>
                        {expired && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                            만료됨
                          </span>
                        )}
                        {penalty.isActive && !expired && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            활성
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">사유:</span> {penalty.reason}
                      </div>
                      
                      {penalty.description && (
                        <p className="text-sm text-gray-700 mb-2">
                          {penalty.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>발행자: {penalty.issuedByName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>발행일: {new Date(penalty.createdAt).toLocaleString('ko-KR')}</span>
                        </div>
                        {penalty.expiresAt && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>만료일: {new Date(penalty.expiresAt).toLocaleString('ko-KR')}</span>
                          </div>
                        )}
                        {penalty.duration && (
                          <span>기간: {penalty.duration}일</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 제재 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">새 제재 추가</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePenalty} className="p-6">
              {/* 사용자 ID */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용자 ID
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="제재할 사용자 ID를 입력하세요"
                  required
                />
              </div>

              {/* 제재 유형 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제재 유형
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="warning">경고</option>
                  <option value="suspension">정지</option>
                  <option value="ban">차단</option>
                </select>
              </div>

              {/* 제재 사유 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제재 사유
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="제재 사유를 입력하세요"
                  required
                />
              </div>

              {/* 상세 설명 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상세 설명 (선택사항)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="제재에 대한 자세한 설명을 입력하세요"
                />
              </div>

              {/* 제재 기간 (정지인 경우만) */}
              {formData.type === 'suspension' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    정지 기간 (일)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      duration: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="정지 기간을 일 단위로 입력하세요"
                  />
                </div>
              )}

              {/* 버튼 */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.userId || !formData.reason}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>생성 중...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>제재 추가</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}