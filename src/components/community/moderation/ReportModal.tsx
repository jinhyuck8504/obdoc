'use client'
import React, { useState } from 'react'
import { X, AlertTriangle, Flag, MessageSquare, Shield, Info } from 'lucide-react'
import { ReportFormData } from '@/types/moderation'
import { moderationService } from '@/lib/moderationService'
import ClientOnly from '@/components/hydration/ClientOnly'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: 'post' | 'comment'
  targetId: string
  targetContent: string
  reporterId: string
  reporterName: string
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetContent,
  reporterId,
  reporterName
}: ReportModalProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    targetType,
    targetId,
    reason: 'inappropriate',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reasonOptions = [
    { value: 'spam', label: '스팸/광고', icon: Flag, description: '광고성 내용이나 반복적인 스팸' },
    { value: 'inappropriate', label: '부적절한 내용', icon: AlertTriangle, description: '건강과 관련 없거나 부적절한 내용' },
    { value: 'harassment', label: '괴롭힘/욕설', icon: MessageSquare, description: '다른 사용자에 대한 괴롭힘이나 욕설' },
    { value: 'misinformation', label: '허위 정보', icon: Info, description: '의학적으로 검증되지 않은 잘못된 정보' },
    { value: 'other', label: '기타', icon: Shield, description: '위에 해당하지 않는 기타 사유' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.reason) return

    setIsSubmitting(true)
    try {
      await moderationService.createReport({
        ...formData,
        reporterId,
        reporterName
      })
      alert('신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.')
      onClose()
    } catch (error) {
      console.error('신고 접수 실패:', error)
      alert('신고 접수에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <ClientOnly fallback={null}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {targetType === 'post' ? '게시글' : '댓글'} 신고
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* 신고 대상 내용 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">신고 대상 내용</h3>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 line-clamp-3">
                {targetContent}
              </p>
            </div>
          </div>

          {/* 신고 사유 선택 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">신고 사유</h3>
            <div className="space-y-2">
              {reasonOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <label
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.reason === option.value
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={option.value}
                      checked={formData.reason === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value as any }))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{option.label}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* 상세 설명 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상세 설명 (선택사항)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="신고 사유에 대한 자세한 설명을 입력해주세요..."
            />
          </div>

          {/* 안내 메시지 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">신고 처리 안내</p>
                <ul className="text-xs space-y-1">
                  <li>• 신고는 관리자가 검토 후 적절한 조치를 취합니다</li>
                  <li>• 허위 신고 시 제재를 받을 수 있습니다</li>
                  <li>• 처리 결과는 별도로 안내드리지 않습니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.reason}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>신고 중...</span>
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  <span>신고하기</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ClientOnly>
  )
}