'use client'

import React, { useState, useEffect } from 'react'
import { HospitalData, HospitalCodeGenerationRequest, HospitalType } from '@/types/hospital'
import { generateHospitalCodeForDoctor } from '@/lib/hospitalCodeService'
import { useHospitalCodeErrorHandler } from '@/hooks/useErrorHandler'
import { userFeedbackSystem } from '@/lib/feedback/userFeedbackSystem'
import ErrorFeedbackModal from '@/components/feedback/ErrorFeedbackModal'
// LoadingSpinner 컴포넌트 (인라인)
const LoadingSpinner = ({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-6 h-6'
  }
  
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
  hospitalName: string
  hospitalType: HospitalType
  region: string
  address?: string
  phoneNumber?: string
  registrationNumber?: string
  medicalLicenseNumber?: string
  doctorId: string
  onCodeGenerated: (code: string, hospitalData: HospitalData) => void
  onGenerationError: (error: string) => void
  className?: string
}

export default function HospitalCodeGenerator({
  hospitalName,
  hospitalType,
  region,
  address,
  phoneNumber,
  registrationNumber,
  medicalLicenseNumber,
  doctorId,
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
  const [uniquenessCheck, setUniquenessCheck] = useState<{
    isChecking: boolean
    isUnique: boolean | null
    conflictCode?: string
  }>({ isChecking: false, isUnique: null })
  const [generationAttempts, setGenerationAttempts] = useState(0)
  const [maxAttempts] = useState(3)
  
  // 에러 처리 훅
  const { 
    error: processedError, 
    showErrorModal, 
    handleError, 
    closeErrorModal 
  } = useHospitalCodeErrorHandler()

  // 코드 미리보기 생성
  useEffect(() => {
    if (hospitalName && hospitalType && region) {
      // 미리보기용 코드 생성 (실제 순번은 ???로 표시)
      const regionCode = getRegionDisplayCode(region)
      const typeCode = getHospitalTypeDisplayCode(hospitalType)
      setPreviewCode(`OB-${regionCode}-${typeCode}-???`)
    } else {
      setPreviewCode('')
    }
  }, [hospitalName, hospitalType, region])

  const getRegionDisplayCode = (region: string): string => {
    const regionMap: Record<string, string> = {
      '서울': 'SEOUL',
      '부산': 'BUSAN',
      '대구': 'DAEGU',
      '인천': 'INCHEON',
      '광주': 'GWANGJU',
      '대전': 'DAEJEON',
      '울산': 'ULSAN',
      '세종': 'SEJONG',
      '경기': 'GYEONGGI',
      '강원': 'GANGWON',
      '충북': 'CHUNGBUK',
      '충남': 'CHUNGNAM',
      '전북': 'JEONBUK',
      '전남': 'JEONNAM',
      '경북': 'GYEONGBUK',
      '경남': 'GYEONGNAM',
      '제주': 'JEJU'
    }
    return regionMap[region] || 'SEOUL'
  }

  const getHospitalTypeDisplayCode = (type: HospitalType): string => {
    const typeMap: Record<HospitalType, string> = {
      'clinic': 'CLINIC',
      'oriental_clinic': 'ORIENTAL',
      'hospital': 'HOSPITAL'
    }
    return typeMap[type]
  }

  const getHospitalTypeDisplayName = (type: HospitalType): string => {
    const typeMap: Record<HospitalType, string> = {
      'clinic': '의원',
      'oriental_clinic': '한의원',
      'hospital': '병원'
    }
    return typeMap[type]
  }

  const handleGenerateCode = async () => {
    if (!hospitalName || !hospitalType || !region) {
      setError('병원 정보가 완전하지 않습니다.')
      onGenerationError('병원 정보가 완전하지 않습니다.')
      return
    }

    if (generationAttempts >= maxAttempts) {
      setError(`최대 생성 시도 횟수(${maxAttempts}회)를 초과했습니다. 잠시 후 다시 시도해주세요.`)
      onGenerationError('최대 생성 시도 횟수를 초과했습니다.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationProgress({ step: 'preparing', progress: 10, message: '병원 정보 검증 중...' })
    setGenerationAttempts(prev => prev + 1)

    try {
      // 1단계: 병원 정보 검증
      setGenerationProgress({ step: 'validating', progress: 25, message: '병원 정보 유효성 검사 중...' })
      
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
      setGenerationProgress({ step: 'security', progress: 40, message: '보안 정보 수집 중...' })
      
      const ipAddress = await fetch('/api/client-info')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => '')

      const userAgent = navigator.userAgent

      // 3단계: 코드 생성 시도
      setGenerationProgress({ step: 'generating', progress: 60, message: '고유 병원 코드 생성 중...' })
      
      const result = await generateHospitalCodeForDoctor(
        request,
        doctorId,
        ipAddress,
        userAgent
      )

      if (result.success && result.hospitalCode && result.hospitalData) {
        // 4단계: 고유성 검증
        setGenerationProgress({ step: 'verifying', progress: 80, message: '코드 고유성 검증 중...' })
        
        await new Promise(resolve => setTimeout(resolve, 500)) // 시각적 피드백을 위한 지연
        
        // 5단계: 완료
        setGenerationProgress({ step: 'completed', progress: 100, message: '병원 코드 생성 완료!' })
        
        setGeneratedCode(result.hospitalCode)
        setHospitalData(result.hospitalData)
        setError(null)
        setValidationResults({
          uniqueness: true,
          format: true,
          security: true
        })
        
        // 성공 시 진행 상황을 잠시 보여준 후 제거
        setTimeout(() => {
          setGenerationProgress(null)
        }, 1500)
        
        onCodeGenerated(result.hospitalCode, result.hospitalData)
      } else {
        // 코드 충돌 처리
        if (result.error?.includes('중복') || result.error?.includes('충돌')) {
          setUniquenessCheck({
            isChecking: false,
            isUnique: false,
            conflictCode: result.conflictCode
          })
          
          if (generationAttempts < maxAttempts) {
            setError(`코드 충돌이 발생했습니다. 자동으로 다른 코드를 생성합니다. (${generationAttempts}/${maxAttempts})`)
            // 자동 재시도
            setTimeout(() => {
              handleGenerateCode()
            }, 1000)
            return
          } else {
            setError('코드 생성 중 충돌이 계속 발생합니다. 병원 정보를 확인하거나 잠시 후 다시 시도해주세요.')
          }
        } else {
          const errorMessage = result.error || '병원 코드 생성에 실패했습니다.'
          setError(errorMessage)
          onGenerationError(errorMessage)
        }
        
        setGenerationProgress(null)
      }
    } catch (error) {
      console.error('병원 코드 생성 중 오류:', error)
      
      // 고급 에러 처리
      await handleError(error, 'hospital_code_generation', {
        hospitalName,
        hospitalType,
        region,
        generationAttempts,
        retryCount
      })
      
      // 사용자 피드백 수집
      const timeToComplete = Date.now() - (generationProgress?.startTime || Date.now())
      await userFeedbackSystem.collectHospitalCodeFeedback(
        false,
        timeToComplete,
        [error instanceof Error ? error.message : '알 수 없는 오류'],
        doctorId
      )
      
      const errorMessage = error instanceof Error ? error.message : '병원 코드 생성 중 오류가 발생했습니다.'
      setError(errorMessage)
      onGenerationError(errorMessage)
      setGenerationProgress(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setGeneratedCode(null)
    setHospitalData(null)
    setError(null)
    setValidationResults(null)
    setUniquenessCheck({ isChecking: false, isUnique: null })
    setGenerationProgress(null)
    setGenerationAttempts(0)
    setRetryCount(prev => prev + 1)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 병원 정보 요약 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-3">병원 코드 생성 정보</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-blue-700 font-medium">병원명:</span>
            <p className="text-blue-900">{hospitalName}</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">병원 유형:</span>
            <p className="text-blue-900">{getHospitalTypeDisplayName(hospitalType)}</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">지역:</span>
            <p className="text-blue-900">{region}</p>
          </div>
          {address && (
            <div>
              <span className="text-blue-700 font-medium">주소:</span>
              <p className="text-blue-900">{address}</p>
            </div>
          )}
        </div>

        {/* 코드 미리보기 */}
        {previewCode && !generatedCode && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <span className="text-blue-700 font-medium text-sm">예상 코드 형식:</span>
            <p className="font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded mt-1">
              {previewCode}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              실제 순번은 생성 시 자동으로 할당됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 생성 진행 상황 */}
      {generationProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-900">병원 코드 생성 중</span>
            <span className="text-xs text-blue-600">{generationProgress.progress}%</span>
          </div>
          
          {/* 진행률 바 */}
          <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${generationProgress.progress}%` }}
            />
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <LoadingSpinner size="xs" />
            <span>{generationProgress.message}</span>
          </div>
          
          {/* 단계별 체크리스트 */}
          <div className="mt-3 space-y-1 text-xs">
            <div className={`flex items-center space-x-2 ${
              generationProgress.progress >= 25 ? 'text-blue-700' : 'text-blue-400'
            }`}>
              {generationProgress.progress >= 25 ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-3 h-3 border border-current rounded-full" />
              )}
              <span>병원 정보 검증</span>
            </div>
            
            <div className={`flex items-center space-x-2 ${
              generationProgress.progress >= 60 ? 'text-blue-700' : 'text-blue-400'
            }`}>
              {generationProgress.progress >= 60 ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-3 h-3 border border-current rounded-full" />
              )}
              <span>고유 코드 생성</span>
            </div>
            
            <div className={`flex items-center space-x-2 ${
              generationProgress.progress >= 80 ? 'text-blue-700' : 'text-blue-400'
            }`}>
              {generationProgress.progress >= 80 ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-3 h-3 border border-current rounded-full" />
              )}
              <span>고유성 검증</span>
            </div>
            
            <div className={`flex items-center space-x-2 ${
              generationProgress.progress >= 100 ? 'text-green-600' : 'text-blue-400'
            }`}>
              {generationProgress.progress >= 100 ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-3 h-3 border border-current rounded-full" />
              )}
              <span>생성 완료</span>
            </div>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          
          {/* 재시도 정보 */}
          {generationAttempts > 0 && generationAttempts < maxAttempts && (
            <div className="mt-2 text-xs text-red-500">
              시도 횟수: {generationAttempts}/{maxAttempts}
            </div>
          )}
          
          {/* 충돌 정보 */}
          {uniquenessCheck.conflictCode && (
            <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
              <p className="font-medium">코드 충돌 감지:</p>
              <p className="font-mono">{uniquenessCheck.conflictCode}</p>
              <p>자동으로 새로운 코드를 생성합니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 생성된 병원 코드 표시 */}
      {generatedCode && hospitalData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">병원 코드가 생성되었습니다</span>
            </div>
            
            <button
              onClick={handleRegenerate}
              className="text-xs text-green-600 hover:text-green-800 underline"
              disabled={isGenerating}
            >
              다시 생성
            </button>
          </div>

          {/* 생성된 코드 */}
          <div className="space-y-2">
            <div>
              <span className="text-green-700 font-medium text-sm">생성된 병원 코드:</span>
              <div className="flex items-center space-x-2 mt-1">
                <p className="font-mono text-lg font-bold text-green-900 bg-green-100 px-3 py-2 rounded">
                  {generatedCode}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedCode)}
                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                  title="코드 복사"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 코드 구성 설명 */}
            <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
              <p className="font-medium mb-1">코드 구성:</p>
              <div className="space-y-1 font-mono">
                <p>OB: ObDoc 서비스 식별자</p>
                <p>{getRegionDisplayCode(region)}: {region} 지역 코드</p>
                <p>{getHospitalTypeDisplayCode(hospitalType)}: {getHospitalTypeDisplayName(hospitalType)} 유형 코드</p>
                <p>{generatedCode.split('-')[3]}: 순번</p>
              </div>
            </div>

            {/* 검증 결과 */}
            {validationResults && (
              <div className="text-xs bg-green-100 p-2 rounded">
                <p className="font-medium text-green-800 mb-2">✅ 검증 완료</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`flex items-center space-x-1 ${
                    validationResults.uniqueness ? 'text-green-700' : 'text-red-600'
                  }`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>고유성</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    validationResults.format ? 'text-green-700' : 'text-red-600'
                  }`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>형식</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    validationResults.security ? 'text-green-700' : 'text-red-600'
                  }`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>보안</span>
                  </div>
                </div>
              </div>
            )}

            {/* 중요 안내 */}
            <div className="text-xs text-green-800 bg-green-200 p-2 rounded">
              <p className="font-medium">⚠️ 중요 안내</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>이 코드는 귀하의 병원 고유 식별자입니다.</li>
                <li>고객 가입 코드 생성 시 이 코드가 사용됩니다.</li>
                <li>코드를 안전하게 보관해주세요.</li>
                <li>필요시 대시보드에서 언제든 확인할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 생성 버튼 */}
      {!generatedCode && (
        <button
          onClick={handleGenerateCode}
          disabled={!hospitalName || !hospitalType || !region || isGenerating}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-colors
            ${!hospitalName || !hospitalType || !region || isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>병원 코드 생성 중...</span>
            </div>
          ) : (
            '병원 코드 생성'
          )}
        </button>
      )}

      {/* 고급 정보 토글 */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowAdvancedInfo(!showAdvancedInfo)}
          className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>고급 정보 및 도움말</span>
          <svg 
            className={`w-4 h-4 transition-transform ${showAdvancedInfo ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showAdvancedInfo && (
          <div className="mt-3 space-y-3 text-xs text-gray-600">
            {/* 기본 도움말 */}
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium text-gray-700 mb-2">기본 정보</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>병원 코드는 한 번 생성되면 변경할 수 없습니다.</li>
                <li>생성된 코드는 고객 가입 코드 생성에 사용됩니다.</li>
                <li>코드 생성 후 구독 플랜을 선택하실 수 있습니다.</li>
              </ul>
            </div>

            {/* 보안 정보 */}
            <div className="bg-blue-50 p-3 rounded">
              <p className="font-medium text-blue-700 mb-2">보안 및 개인정보</p>
              <ul className="space-y-1 list-disc list-inside text-blue-600">
                <li>코드 생성 시 IP 주소와 브라우저 정보가 보안 목적으로 기록됩니다.</li>
                <li>병원 정보는 암호화되어 안전하게 저장됩니다.</li>
                <li>생성 과정은 실시간으로 모니터링되어 이상 활동을 감지합니다.</li>
              </ul>
            </div>

            {/* 기술 정보 */}
            <div className="bg-yellow-50 p-3 rounded">
              <p className="font-medium text-yellow-700 mb-2">기술 정보</p>
              <ul className="space-y-1 list-disc list-inside text-yellow-600">
                <li>코드 형식: OB-{getRegionDisplayCode(region)}-{getHospitalTypeDisplayCode(hospitalType)}-XXX</li>
                <li>최대 생성 시도: {maxAttempts}회</li>
                <li>현재 시도 횟수: {generationAttempts}회</li>
                <li>재생성 횟수: {retryCount}회</li>
              </ul>
            </div>

            {/* 문제 해결 */}
            <div className="bg-red-50 p-3 rounded">
              <p className="font-medium text-red-700 mb-2">문제 해결</p>
              <ul className="space-y-1 list-disc list-inside text-red-600">
                <li>코드 생성이 실패하는 경우 병원 정보를 다시 확인해주세요.</li>
                <li>네트워크 오류 시 잠시 후 다시 시도해주세요.</li>
                <li>지속적인 문제 발생 시 고객센터로 문의해주세요.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* 에러 피드백 모달 */}
      <ErrorFeedbackModal
        error={processedError}
        isOpen={showErrorModal}
        onClose={closeErrorModal}
      />
    </div>
  )
}