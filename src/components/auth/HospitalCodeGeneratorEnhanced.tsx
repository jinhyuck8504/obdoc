'use client'

import React, { useState, useEffect } from 'react'
import { HospitalData, HospitalCodeGenerationRequest } from '@/types/hospital'
import { generateHospitalCodeForDoctor } from '@/lib/hospitalCodeService'

// LoadingSpinner 컴포넌트
const LoadingSpinner = ({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) => {
  const sizeClasses = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-6 h-6' }
  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  )
}

interface HospitalCodeGeneratorProps {
  doctorId: string
  hospitalName: string
  hospitalType: string
  region: string
  address?: string
  phoneNumber?: string
  registrationNumber?: string
  medicalLicenseNumber?: string
  onCodeGenerated: (code: string, hospitalData: HospitalData) => void
  onGenerationError: (error: string) => void
  className?: string
}

export default function HospitalCodeGeneratorEnhanced({
  doctorId,
  hospitalName,
  hospitalType,
  region,
  address,
  phoneNumber,
  registrationNumber,
  medicalLicenseNumber,
  onCodeGenerated,
  onGenerationError,
  className = ''
}: HospitalCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [hospitalData, setHospitalData] = useState<HospitalData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewCode, setPreviewCode] = useState<string>('')
  const [generationProgress, setGenerationProgress] = useState<{
    step: string
    progress: number
    message: string
  } | null>(null)
  const [validationResults, setValidationResults] = useState<{
    uniqueness: boolean
    format: boolean
    security: boolean
  } | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false)

  // 미리보기 코드 생성
  useEffect(() => {
    if (hospitalName && hospitalType && region) {
      const preview = `OB-${region.toUpperCase()}-${hospitalType.toUpperCase()}-001`
      setPreviewCode(preview)
    } else {
      setPreviewCode('')
    }
  }, [hospitalName, hospitalType, region])

  // 진행 상황 업데이트
  const updateProgress = (step: string, progress: number, message: string) => {
    setGenerationProgress({ step, progress, message })
  }

  // 코드 검증
  const validateGeneratedCode = async (code: string) => {
    const formatValid = /^OB-[A-Z]+-[A-Z]+-\d{3}$/.test(code)
    const securityValid = !(/(.)\\1{2,}/.test(code) || /123|ABC/.test(code))
    const uniquenessValid = true // 서버에서 확인됨

    return {
      uniqueness: uniquenessValid,
      format: formatValid,
      security: securityValid,
      details: [
        formatValid ? '✓ 코드 형식 올바름' : '✗ 코드 형식 오류',
        securityValid ? '✓ 보안 요구사항 충족' : '✗ 예측 가능한 패턴',
        uniquenessValid ? '✓ 고유한 코드' : '✗ 중복된 코드'
      ]
    }
  }

  const handleGenerateCode = async () => {
    if (!hospitalName || !hospitalType || !region) {
      setError('병원 정보가 완전하지 않습니다.')
      onGenerationError('병원 정보가 완전하지 않습니다.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setValidationResults(null)
    setGenerationProgress(null)

    const maxRetries = 3
    let currentRetry = 0

    try {
      while (currentRetry <= maxRetries) {
        try {
          // 1단계: 요청 준비
          updateProgress('preparing', 20, '병원 정보 검증 중...')
          
          const request: HospitalCodeGenerationRequest = {
            hospitalName,
            hospitalType,
            region,
            address,
            phoneNumber,
            registrationNumber,
            medicalLicenseNumber
          }

          // 2단계: 보안 정보 수집
          updateProgress('security', 40, '보안 정보 수집 중...')
          
          const ipAddress = await fetch('/api/client-info')
            .then(res => res.json())
            .then(data => data.ip)
            .catch(() => '')

          // 3단계: 코드 생성
          updateProgress('generating', 60, `병원 코드 생성 중... (${currentRetry + 1}/${maxRetries + 1}회 시도)`)
          
          const result = await generateHospitalCodeForDoctor(
            request,
            doctorId,
            ipAddress,
            navigator.userAgent
          )

          if (result.success && result.hospitalCode && result.hospitalData) {
            // 4단계: 코드 검증
            updateProgress('validating', 80, '생성된 코드 검증 중...')
            
            const validation = await validateGeneratedCode(result.hospitalCode)
            setValidationResults({
              uniqueness: validation.uniqueness,
              format: validation.format,
              security: validation.security
            })

            if (validation.uniqueness && validation.format && validation.security) {
              // 5단계: 완료
              updateProgress('completed', 100, '병원 코드 생성 완료!')
              
              setTimeout(() => {
                setGeneratedCode(result.hospitalCode)
                setHospitalData(result.hospitalData)
                setError(null)
                setRetryCount(currentRetry)
                onCodeGenerated(result.hospitalCode, result.hospitalData)
                setGenerationProgress(null)
              }, 500)
              
              return
            } else {
              throw new Error('생성된 코드가 검증 기준을 충족하지 않습니다.')
            }
          } else {
            const errorMessage = result.error || '병원 코드 생성에 실패했습니다.'
            
            if (errorMessage.includes('중복') || errorMessage.includes('duplicate')) {
              currentRetry++
              if (currentRetry <= maxRetries) {
                updateProgress('retrying', 30, `코드 중복으로 재시도 중... (${currentRetry}/${maxRetries}회)`)
                await new Promise(resolve => setTimeout(resolve, 1000))
                continue
              }
            }
            
            throw new Error(errorMessage)
          }
        } catch (retryError) {
          if (currentRetry < maxRetries) {
            currentRetry++
            updateProgress('retrying', 30, `오류 발생으로 재시도 중... (${currentRetry}/${maxRetries}회)`)
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          } else {
            throw retryError
          }
        }
      }
    } catch (error) {
      console.error('병원 코드 생성 중 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '병원 코드 생성 중 오류가 발생했습니다.'
      setError(errorMessage)
      setRetryCount(currentRetry)
      onGenerationError(errorMessage)
      setGenerationProgress(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // 복사 성공 피드백 (간단한 구현)
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        const originalText = button.textContent
        button.textContent = '복사됨!'
        setTimeout(() => {
          button.textContent = originalText
        }, 2000)
      }
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 병원 정보 요약 */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">병원 정보 요약</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
          <p><strong>병원명:</strong> {hospitalName}</p>
          <p><strong>유형:</strong> {hospitalType}</p>
          <p><strong>지역:</strong> {region}</p>
          {address && <p><strong>주소:</strong> {address}</p>}
        </div>
      </div>

      {/* 미리보기 코드 */}
      {previewCode && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">예상 코드 형식</h3>
          <div className="font-mono text-lg text-gray-700 bg-white p-2 rounded border">
            {previewCode}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            실제 생성되는 코드는 고유성을 위해 다를 수 있습니다.
          </p>
        </div>
      )}

      {/* 생성 진행 상황 */}
      {generationProgress && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">생성 진행 상황</span>
            <span className="text-sm text-gray-600">{generationProgress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">{generationProgress.message}</p>
        </div>
      )}

      {/* 검증 결과 */}
      {validationResults && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">코드 검증 결과</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className={`text-center p-2 rounded ${validationResults.format ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="text-lg">{validationResults.format ? '✓' : '✗'}</div>
              <div className="text-xs">형식</div>
            </div>
            <div className={`text-center p-2 rounded ${validationResults.security ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="text-lg">{validationResults.security ? '✓' : '✗'}</div>
              <div className="text-xs">보안</div>
            </div>
            <div className={`text-center p-2 rounded ${validationResults.uniqueness ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="text-lg">{validationResults.uniqueness ? '✓' : '✗'}</div>
              <div className="text-xs">고유성</div>
            </div>
          </div>
        </div>
      )}

      {/* 생성된 코드 */}
      {generatedCode && hospitalData && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-900">병원 코드 생성 완료!</h3>
            {retryCount > 0 && (
              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                {retryCount + 1}회 시도 후 성공
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-800 mb-1">생성된 병원 코드</label>
              <div className="flex items-center space-x-2">
                <div className="font-mono text-xl text-green-900 bg-white p-3 rounded border flex-1">
                  {generatedCode}
                </div>
                <button
                  onClick={() => copyToClipboard(generatedCode)}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                >
                  복사
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>병원명:</strong> {hospitalData.hospitalName}</p>
                <p><strong>유형:</strong> {hospitalData.hospitalType}</p>
              </div>
              <div>
                <p><strong>지역:</strong> {hospitalData.region}</p>
                <p><strong>생성일:</strong> {hospitalData.createdAt.toLocaleDateString('ko-KR')}</p>
              </div>
            </div>

            <div className="bg-green-100 p-3 rounded border border-green-300">
              <p className="text-sm text-green-800">
                <strong>중요:</strong> 이 코드를 안전한 곳에 보관하세요. 
                고객 가입 시 이 코드가 필요합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-red-900">코드 생성 실패</h4>
              <p className="text-sm text-red-800 mt-1">{error}</p>
              {retryCount > 0 && (
                <p className="text-xs text-red-700 mt-2">
                  총 {retryCount + 1}회 시도했습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 생성 버튼 */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleGenerateCode}
          disabled={isGenerating || !hospitalName || !hospitalType || !region}
          className={`
            flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors
            ${isGenerating || !hospitalName || !hospitalType || !region
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isGenerating ? (
            <>
              <LoadingSpinner size="sm" />
              <span>생성 중...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>병원 코드 생성</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowAdvancedInfo(!showAdvancedInfo)}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          {showAdvancedInfo ? '간단히 보기' : '자세한 정보'}
        </button>
      </div>

      {/* 고급 정보 */}
      {showAdvancedInfo && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">병원 코드 생성 정보</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>코드 형식:</strong> OB-지역-병원유형-순번</p>
            <p><strong>보안 기능:</strong> 중복 방지, 예측 불가능한 패턴</p>
            <p><strong>유효 기간:</strong> 무제한 (비활성화 전까지)</p>
            <p><strong>사용 용도:</strong> 고객 가입 시 병원 인증</p>
            <p><strong>재시도 정책:</strong> 최대 3회 자동 재시도</p>
          </div>
        </div>
      )}
    </div>
  )
}