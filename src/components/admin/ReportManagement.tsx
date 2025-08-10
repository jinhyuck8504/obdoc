'use client'
import React, { useState, useEffect } from 'react'
import { Flag, Eye, CheckCircle, XCircle, AlertTriangle, MessageSquare, Info, Shield, Clock, User } from 'lucide-react'
import { Report } from '@/types/moderation'
import { moderationService } from '@/lib/moderationService'

interface ReportManagementProps {
  onStatsUpdate: () => void
}

export default function ReportManagement({ onStatsUpdate }: ReportManagementProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [reviewNote, setReviewNote] = useState('')
  const [selectedAction, setSelectedAction] = useState<'none' | 'warning' | 'content_removed' | 'user_suspended' | 'user_banned'>('none')
  const [isReviewing, setIsReviewing] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  useEffect(() => {
    filterReports()
  }, [reports, statusFilter])

  const loadReports = async () => {
    try {
      setLoading(true)
      const data = await moderationService.getReports()
      setReports(data)
    } catch (error) {
      console.error('신고 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterReports = () => {
    let filtered = [...reports]
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter)
    }
    setFilteredReports(filtered)
  }

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'spam': return Flag
      case 'inappropriate': return AlertTriangle
      case 'harassment': return MessageSquare
      case 'misinformation': return Info
      default: return Shield
    }
  }

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'spam': return '스팸/광고'
      case 'inappropriate': return '부적절한 내용'
      case 'harassment': return '괴롭힘/욕설'
      case 'misinformation': return '허위 정보'
      default: return '기타'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewed': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기 중'
      case 'reviewed': return '검토 중'
      case 'resolved': return '처리 완료'
      case 'dismissed': return '기각'
      default: return '알 수 없음'
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'none': return '조치 없음'
      case 'warning': return '경고 발송'
      case 'content_removed': return '콘텐츠 삭제'
      case 'user_suspended': return '사용자 정지'
      case 'user_banned': return '사용자 차단'
      default: return '알 수 없음'
    }
  }

  const handleReviewReport = async (status: 'reviewed' | 'resolved' | 'dismissed') => {
    if (!selectedReport || !reviewNote.trim()) return

    setIsReviewing(true)
    try {
      const updatedReport = await moderationService.reviewReport(selectedReport.id, {
        reviewerId: 'admin-1', // 실제로는 현재 관리자 ID
        reviewerName: '관리자', // 실제로는 현재 관리자 이름
        reviewNote,
        action: selectedAction,
        status
      })

      setReports(prev => prev.map(r => r.id === selectedReport.id ? updatedReport : r))
      setSelectedReport(null)
      setReviewNote('')
      setSelectedAction('none')
      onStatsUpdate()
      alert('신고 처리가 완료되었습니다.')
    } catch (error) {
      console.error('신고 처리 실패:', error)
      alert('신고 처리에 실패했습니다.')
    } finally {
      setIsReviewing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">신고 목록을 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기 중</option>
            <option value="reviewed">검토 중</option>
            <option value="resolved">처리 완료</option>
            <option value="dismissed">기각</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          총 {filteredReports.length}건의 신고
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">신고가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => {
              const ReasonIcon = getReasonIcon(report.reason)
              return (
                <div
                  key={report.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <ReasonIcon className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-gray-900">
                          {getReasonText(report.reason)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(report.status)}`}>
                          {getStatusText(report.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {report.targetType === 'post' ? '게시글' : '댓글'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">신고자:</span> {report.reporterName} • 
                        <span className="font-medium ml-2">대상:</span> {report.targetAuthorName}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {report.description || '상세 설명 없음'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(report.createdAt).toLocaleString('ko-KR')}</span>
                        {report.reviewedAt && (
                          <span>처리: {new Date(report.reviewedAt).toLocaleString('ko-KR')}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        상세 보기
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 신고 상세 모달 */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">신고 상세 정보</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 신고 정보 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">신고 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">신고 사유:</span>
                    <span className="text-sm font-medium">{getReasonText(selectedReport.reason)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">신고자:</span>
                    <span className="text-sm font-medium">{selectedReport.reporterName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">신고 일시:</span>
                    <span className="text-sm font-medium">
                      {new Date(selectedReport.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">상태:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedReport.status)}`}>
                      {getStatusText(selectedReport.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 신고 대상 콘텐츠 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">신고 대상 콘텐츠</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">{selectedReport.targetAuthorName}</span>
                    <span className="text-xs text-gray-500">
                      ({selectedReport.targetType === 'post' ? '게시글' : '댓글'})
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {selectedReport.targetContent}
                  </p>
                </div>
              </div>

              {/* 신고 상세 설명 */}
              {selectedReport.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">신고 상세 설명</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedReport.description}</p>
                  </div>
                </div>
              )}

              {/* 기존 처리 내역 */}
              {selectedReport.reviewNote && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">처리 내역</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedReport.reviewerName}
                      </span>
                      <span className="text-xs text-blue-700">
                        {selectedReport.reviewedAt && new Date(selectedReport.reviewedAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 mb-2">{selectedReport.reviewNote}</p>
                    {selectedReport.action && (
                      <div className="text-xs text-blue-700">
                        조치: {getActionText(selectedReport.action)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 신고 처리 (대기 중인 경우만) */}
              {selectedReport.status === 'pending' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">신고 처리</h3>
                  <div className="space-y-4">
                    {/* 조치 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        조치 선택
                      </label>
                      <select
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value as any)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">조치 없음</option>
                        <option value="warning">경고 발송</option>
                        <option value="content_removed">콘텐츠 삭제</option>
                        <option value="user_suspended">사용자 정지</option>
                        <option value="user_banned">사용자 차단</option>
                      </select>
                    </div>

                    {/* 처리 메모 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        처리 메모
                      </label>
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="처리 사유와 내용을 입력해주세요..."
                      />
                    </div>

                    {/* 처리 버튼 */}
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => handleReviewReport('dismissed')}
                        disabled={isReviewing || !reviewNote.trim()}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded-lg transition-colors"
                      >
                        기각
                      </button>
                      <button
                        onClick={() => handleReviewReport('resolved')}
                        disabled={isReviewing || !reviewNote.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        {isReviewing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>처리 중...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>처리 완료</span>
                          </>
                        )}
                      </button>
                    </div>
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