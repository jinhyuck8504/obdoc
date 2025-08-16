'use client'

import React, { useState } from 'react'
import InviteCodeValidator, { AccessibleInviteCodeValidator } from './InviteCodeValidator'
import { HospitalData } from '@/types/hospital'

export default function InviteCodeValidatorDemo() {
  const [validatedHospital, setValidatedHospital] = useState<HospitalData | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState<'basic' | 'accessible'>('basic')
  const [demoSettings, setDemoSettings] = useState({
    autoFocus: false,
    showHelpText: true,
    allowManualValidation: true,
    enableQRScanner: false,
    enableVoiceInput: false,
    enableKeyboardShortcuts: false
  })

  const handleCodeValidated = (hospitalInfo: HospitalData, code: string) => {
    setValidatedHospital(hospitalInfo)
    setValidationError(null)
    console.log('코드 검증 성공:', { hospitalInfo, code })
  }

  const handleValidationError = (error: string) => {
    setValidationError(error)
    setValidatedHospital(null)
    console.log('코드 검증 실패:', error)
  }

  const handleCodeChange = (code: string, isValid: boolean) => {
    console.log('코드 변경:', { code, isValid })
  }

  const resetDemo = () => {
    setValidatedHospital(null)
    setValidationError(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          InviteCodeValidator 데모
        </h1>
        <p className="text-gray-600">
          가입 코드 검증 컴포넌트의 다양한 기능을 테스트해보세요
        </p>
      </div>

      {/* 데모 설정 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">데모 설정</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 모드 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              컴포넌트 모드
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="demoMode"
                  value="basic"
                  checked={demoMode === 'basic'}
                  onChange={(e) => setDemoMode(e.target.value as 'basic')}
                  className="mr-2"
                />
                기본 모드
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="demoMode"
                  value="accessible"
                  checked={demoMode === 'accessible'}
                  onChange={(e) => setDemoMode(e.target.value as 'accessible')}
                  className="mr-2"
                />
                접근성 강화 모드
              </label>
            </div>
          </div>

          {/* 기본 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기본 옵션
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={demoSettings.autoFocus}
                  onChange={(e) => setDemoSettings(prev => ({ ...prev, autoFocus: e.target.checked }))}
                  className="mr-2"
                />
                자동 포커스
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={demoSettings.showHelpText}
                  onChange={(e) => setDemoSettings(prev => ({ ...prev, showHelpText: e.target.checked }))}
                  className="mr-2"
                />
                도움말 표시
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={demoSettings.allowManualValidation}
                  onChange={(e) => setDemoSettings(prev => ({ ...prev, allowManualValidation: e.target.checked }))}
                  className="mr-2"
                />
                수동 검증 허용
              </label>
            </div>
          </div>

          {/* 접근성 설정 (접근성 모드일 때만) */}
          {demoMode === 'accessible' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                접근성 옵션
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={demoSettings.enableQRScanner}
                    onChange={(e) => setDemoSettings(prev => ({ ...prev, enableQRScanner: e.target.checked }))}
                    className="mr-2"
                  />
                  QR 스캐너
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={demoSettings.enableVoiceInput}
                    onChange={(e) => setDemoSettings(prev => ({ ...prev, enableVoiceInput: e.target.checked }))}
                    className="mr-2"
                  />
                  음성 입력
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={demoSettings.enableKeyboardShortcuts}
                    onChange={(e) => setDemoSettings(prev => ({ ...prev, enableKeyboardShortcuts: e.target.checked }))}
                    className="mr-2"
                  />
                  키보드 단축키
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={resetDemo}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            데모 초기화
          </button>
        </div>
      </div>

      {/* 컴포넌트 데모 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">컴포넌트 미리보기</h2>
        
        {demoMode === 'basic' ? (
          <InviteCodeValidator
            onCodeValidated={handleCodeValidated}
            onValidationError={handleValidationError}
            onCodeChange={handleCodeChange}
            autoFocus={demoSettings.autoFocus}
            showHelpText={demoSettings.showHelpText}
            allowManualValidation={demoSettings.allowManualValidation}
            className="max-w-md mx-auto"
          />
        ) : (
          <AccessibleInviteCodeValidator
            onCodeValidated={handleCodeValidated}
            onValidationError={handleValidationError}
            onCodeChange={handleCodeChange}
            autoFocus={demoSettings.autoFocus}
            showHelpText={demoSettings.showHelpText}
            allowManualValidation={demoSettings.allowManualValidation}
            enableQRScanner={demoSettings.enableQRScanner}
            enableVoiceInput={demoSettings.enableVoiceInput}
            enableKeyboardShortcuts={demoSettings.enableKeyboardShortcuts}
            className="max-w-md mx-auto"
          />
        )}
      </div>

      {/* 상태 표시 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 검증 결과 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-md font-semibold mb-3">검증 결과</h3>
          
          {validatedHospital ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">검증 성공</span>
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p><strong>병원명:</strong> {validatedHospital.hospitalName}</p>
                <p><strong>유형:</strong> {validatedHospital.hospitalType}</p>
                <p><strong>코드:</strong> {validatedHospital.hospitalCode}</p>
                {validatedHospital.address && (
                  <p><strong>주소:</strong> {validatedHospital.address}</p>
                )}
              </div>
            </div>
          ) : validationError ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">검증 실패</span>
              </div>
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p>{validationError}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              가입 코드를 입력하여 검증을 시작하세요.
            </div>
          )}
        </div>

        {/* 테스트 코드 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-md font-semibold mb-3">테스트용 코드</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-green-600 mb-1">유효한 코드 (예시):</p>
              <div className="bg-green-50 p-2 rounded border border-green-200 font-mono text-xs">
                OB-SEOUL-CLINIC-001-202401-A7B9X2K5
              </div>
            </div>
            
            <div>
              <p className="font-medium text-red-600 mb-1">잘못된 형식:</p>
              <div className="bg-red-50 p-2 rounded border border-red-200 font-mono text-xs">
                INVALID-CODE-123
              </div>
            </div>
            
            <div>
              <p className="font-medium text-yellow-600 mb-1">부분적으로 올바른 형식:</p>
              <div className="bg-yellow-50 p-2 rounded border border-yellow-200 font-mono text-xs">
                OB-SEOUL-CLINIC-001-202401-
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>참고:</strong> 실제 환경에서는 데이터베이스에서 코드를 검증합니다. 
              이 데모에서는 형식 검증과 UI 동작만 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 기능 설명 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">주요 기능</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-blue-600 mb-2">실시간 검증</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 입력 중 형식 검증</li>
              <li>• 디바운싱 적용</li>
              <li>• 보안 강도 표시</li>
              <li>• 자동 완성 제안</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-green-600 mb-2">사용자 경험</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 직관적인 UI</li>
              <li>• 상세한 오류 메시지</li>
              <li>• 키보드 단축키</li>
              <li>• 접근성 지원</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-purple-600 mb-2">보안 기능</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Rate limiting</li>
              <li>• 입력값 정제</li>
              <li>• 감사 로그</li>
              <li>• 의심 활동 감지</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}