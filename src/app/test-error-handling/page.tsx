'use client'
import React, { useState } from 'react'
import { useFeedback, useFormFeedback, useApiRequestFeedback, useDeleteConfirmation } from '@/hooks/useFeedback'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'

export default function TestErrorHandlingPage() {
  const feedback = useFeedback()
  const formFeedback = useFormFeedback()
  const apiRequestFeedback = useApiRequestFeedback()
  const deleteConfirmation = useDeleteConfirmation()
  const [counter, setCounter] = useState(0)

  // 테스트 함수들
  const testSuccessToast = () => {
    feedback.showSuccess({
      title: '성공!',
      message: '작업이 성공적으로 완료되었습니다.'
    })
  }

  const testErrorToast = () => {
    feedback.showError({
      title: '오류 발생',
      message: '예상치 못한 오류가 발생했습니다.',
      action: {
        label: '다시 시도',
        onClick: () => {
          feedback.showInfo({
            title: '재시도 중',
            message: '작업을 다시 시도하고 있습니다...'
          })
        }
      }
    })
  }

  const testWarningToast = () => {
    feedback.showWarning({
      title: '주의',
      message: '이 작업은 되돌릴 수 없습니다.'
    })
  }

  const testInfoToast = () => {
    feedback.showInfo({
      title: '정보',
      message: '새로운 업데이트가 있습니다.'
    })
  }

  const testLoading = async () => {
    await feedback.withLoading(
      'test-loading',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 3000))
        return '완료!'
      },
      {
        message: '테스트 로딩 중...',
        successMessage: '로딩 테스트 완료!'
      }
    )
  }

  const testApiRequest = async () => {
    try {
      await apiRequestFeedback.handleApiRequest(
        async () => {
          // 50% 확률로 실패
          if (Math.random() > 0.5) {
            throw new Error('API 요청 실패')
          }
          await new Promise(resolve => setTimeout(resolve, 2000))
          return { data: 'API 응답 데이터' }
        },
        {
          loadingMessage: 'API 요청 중...',
          successMessage: 'API 요청 성공!',
          errorMessage: 'API 요청에 실패했습니다.'
        }
      )
    } catch (error) {
      // 오류는 이미 피드백으로 처리됨
    }
  }

  const testFormSubmit = async () => {
    try {
      formFeedback.startLoading('form-submit', { message: '폼 제출 중...' })
      
      // 시뮬레이션: 50% 확률로 실패
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (Math.random() > 0.5) {
        throw new Error('폼 검증 실패')
      }
      
      formFeedback.handleSubmitSuccess('폼이 성공적으로 제출되었습니다.')
    } catch (error) {
      formFeedback.handleSubmitError(error as Error)
    } finally {
      formFeedback.stopLoading('form-submit')
    }
  }

  const testDeleteConfirmation = () => {
    deleteConfirmation.confirmDelete(
      '테스트 항목',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setCounter(prev => prev + 1)
      }
    )
  }

  const testErrorBoundary = () => {
    throw new Error('테스트 오류: ErrorBoundary 테스트')
  }

  const testNetworkError = () => {
    feedback.showError({
      title: '네트워크 오류',
      message: '인터넷 연결을 확인하고 다시 시도해주세요.',
      action: {
        label: '새로고침',
        onClick: () => window.location.reload()
      }
    })
  }

  const testMultipleToasts = () => {
    feedback.showSuccess({ title: '첫 번째 알림' })
    setTimeout(() => feedback.showInfo({ title: '두 번째 알림' }), 500)
    setTimeout(() => feedback.showWarning({ title: '세 번째 알림' }), 1000)
    setTimeout(() => feedback.showError({ title: '네 번째 알림' }), 1500)
  }

  const clearAllToasts = () => {
    feedback.clearAllToasts()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          오류 처리 및 피드백 시스템 테스트
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 토스트 알림 테스트 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              토스트 알림
            </h2>
            <div className="space-y-3">
              <Button onClick={testSuccessToast} variant="outline" size="sm" className="w-full">
                성공 알림
              </Button>
              <Button onClick={testErrorToast} variant="outline" size="sm" className="w-full">
                오류 알림
              </Button>
              <Button onClick={testWarningToast} variant="outline" size="sm" className="w-full">
                경고 알림
              </Button>
              <Button onClick={testInfoToast} variant="outline" size="sm" className="w-full">
                정보 알림
              </Button>
              <Button onClick={testMultipleToasts} variant="outline" size="sm" className="w-full">
                다중 알림
              </Button>
              <Button onClick={clearAllToasts} variant="secondary" size="sm" className="w-full">
                모든 알림 지우기
              </Button>
            </div>
          </Card>

          {/* 로딩 상태 테스트 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-500" />
              로딩 상태
            </h2>
            <div className="space-y-3">
              <Button 
                onClick={testLoading} 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={feedback.checkLoading('test-loading')}
              >
                {feedback.checkLoading('test-loading') ? '로딩 중...' : '로딩 테스트'}
              </Button>
              <Button 
                onClick={testApiRequest} 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={apiRequestFeedback.checkLoading('api-request')}
              >
                API 요청 테스트
              </Button>
              <Button 
                onClick={testFormSubmit} 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={formFeedback.checkLoading('form-submit')}
              >
                폼 제출 테스트
              </Button>
            </div>
          </Card>

          {/* 확인 다이얼로그 테스트 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
              확인 다이얼로그
            </h2>
            <div className="space-y-3">
              <Button onClick={testDeleteConfirmation} variant="outline" size="sm" className="w-full">
                삭제 확인 (카운터: {counter})
              </Button>
              <Button 
                onClick={() => {
                  const confirmed = feedback.showConfirm('정말로 계속하시겠습니까?')
                  if (confirmed) {
                    feedback.showSuccess({ title: '확인됨', message: '작업을 계속합니다.' })
                  } else {
                    feedback.showInfo({ title: '취소됨', message: '작업이 취소되었습니다.' })
                  }
                }}
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                일반 확인
              </Button>
              <Button 
                onClick={() => {
                  feedback.showAlert('이것은 알림 메시지입니다.')
                }}
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                알림 다이얼로그
              </Button>
            </div>
          </Card>

          {/* 오류 시나리오 테스트 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              오류 시나리오
            </h2>
            <div className="space-y-3">
              <Button onClick={testNetworkError} variant="outline" size="sm" className="w-full">
                네트워크 오류
              </Button>
              <Button onClick={testErrorBoundary} variant="danger" size="sm" className="w-full">
                ErrorBoundary 테스트
              </Button>
            </div>
          </Card>

          {/* 상태 정보 */}
          <Card className="p-6 md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">현재 상태</h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>활성 토스트:</strong> {feedback.toasts?.length || 0}개
              </div>
              <div>
                <strong>로딩 상태:</strong> {
                  Object.keys(feedback.loading || {}).filter(key => 
                    feedback.loading?.[key]?.isLoading
                  ).length
                }개 활성
              </div>
              <div>
                <strong>전역 로딩:</strong> {
                  feedback.checkLoading() ? '활성' : '비활성'
                }
              </div>
            </div>
          </Card>
        </div>

        {/* 사용법 안내 */}
        <Card className="mt-8 p-6">
          <h2 className="text-lg font-semibold mb-4">사용법 안내</h2>
          <div className="prose prose-sm max-w-none">
            <p>이 페이지는 오류 처리 및 사용자 피드백 시스템의 다양한 기능을 테스트할 수 있습니다:</p>
            <ul>
              <li><strong>토스트 알림:</strong> 성공, 오류, 경고, 정보 메시지를 표시합니다.</li>
              <li><strong>로딩 상태:</strong> 비동기 작업 중 로딩 상태를 관리합니다.</li>
              <li><strong>확인 다이얼로그:</strong> 사용자 확인이 필요한 작업을 처리합니다.</li>
              <li><strong>오류 처리:</strong> 다양한 오류 시나리오를 시뮬레이션합니다.</li>
            </ul>
            <p>각 버튼을 클릭하여 해당 기능을 테스트해보세요.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}