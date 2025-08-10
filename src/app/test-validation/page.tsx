'use client'
import React, { useState } from 'react'
import { validationSchemas } from '@/lib/validation/schemas'
import ValidatedInput, { ValidatedTextarea, ValidatedSelect } from '@/components/validation/ValidatedInput'
import ValidatedForm from '@/components/validation/ValidatedForm'
import { useValidation } from '@/hooks/useValidation'

export default function ValidationTestPage() {
  const [testData, setTestData] = useState({
    email: '',
    phone: '',
    businessNumber: '',
    password: '',
    name: '',
    hospitalType: '',
    description: ''
  })

  const [testResults, setTestResults] = useState<any[]>([])

  // 개별 스키마 테스트
  const testIndividualSchemas = () => {
    const results: any[] = []

    // 이메일 테스트
    const emailTests = [
      { value: 'test@example.com', expected: true },
      { value: 'invalid-email', expected: false },
      { value: '', expected: false },
      { value: 'test@', expected: false }
    ]

    emailTests.forEach(test => {
      const result = validationSchemas.common.email.safeParse(test.value)
      results.push({
        type: 'Email',
        value: test.value,
        expected: test.expected,
        actual: result.success,
        passed: result.success === test.expected,
        error: result.success ? null : result.error?.issues?.[0]?.message || 'Unknown error'
      })
    })

    // 전화번호 테스트
    const phoneTests = [
      { value: '010-1234-5678', expected: true },
      { value: '010-123-4567', expected: false },
      { value: '02-1234-5678', expected: false },
      { value: '010-12345-678', expected: false }
    ]

    phoneTests.forEach(test => {
      const result = validationSchemas.common.phoneNumber.safeParse(test.value)
      results.push({
        type: 'Phone',
        value: test.value,
        expected: test.expected,
        actual: result.success,
        passed: result.success === test.expected,
        error: result.success ? null : result.error?.issues?.[0]?.message || 'Unknown error'
      })
    })

    // 사업자등록번호 테스트
    const businessTests = [
      { value: '123-45-67890', expected: true },
      { value: '123-4-67890', expected: false },
      { value: '1234567890', expected: false },
      { value: '123-45-6789', expected: false }
    ]

    businessTests.forEach(test => {
      const result = validationSchemas.common.businessNumber.safeParse(test.value)
      results.push({
        type: 'Business Number',
        value: test.value,
        expected: test.expected,
        actual: result.success,
        passed: result.success === test.expected,
        error: result.success ? null : result.error?.issues?.[0]?.message || 'Unknown error'
      })
    })

    setTestResults(results)
  }

  // 폼 제출 테스트
  const handleFormSubmit = async (data: any) => {
    console.log('Form submitted with data:', data)
    alert('폼 제출 성공! 콘솔을 확인하세요.')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">데이터 검증 테스트</h1>
        <p className="text-gray-600">Zod 스키마와 검증 컴포넌트를 테스트해보세요</p>
      </div>

      {/* 개별 스키마 테스트 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">1. 개별 스키마 테스트</h2>
        <button
          onClick={testIndividualSchemas}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          스키마 테스트 실행
        </button>

        {testResults.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">테스트 결과</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">값</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">예상</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">실제</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">결과</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">오류</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testResults.map((result, index) => (
                    <tr key={index} className={result.passed ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{result.type}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">{result.value || '(empty)'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{result.expected ? '✅' : '❌'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{result.actual ? '✅' : '❌'}</td>
                      <td className="px-4 py-2 text-sm font-medium">
                        {result.passed ? (
                          <span className="text-green-600">PASS</span>
                        ) : (
                          <span className="text-red-600">FAIL</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-red-600">{result.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 실시간 검증 테스트 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">2. 실시간 검증 테스트</h2>
        <p className="text-gray-600 mb-6">아래 필드에 값을 입력하면서 실시간 검증을 확인해보세요</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ValidatedInput
            name="testEmail"
            label="이메일"
            type="email"
            value={testData.email}
            onChange={(value) => setTestData(prev => ({ ...prev, email: value as string }))}
            schema={validationSchemas.common.email}
            placeholder="test@example.com"
            helpText="올바른 이메일 형식을 입력하세요"
            required
          />

          <ValidatedInput
            name="testPhone"
            label="전화번호"
            type="tel"
            value={testData.phone}
            onChange={(value) => setTestData(prev => ({ ...prev, phone: value as string }))}
            schema={validationSchemas.common.phoneNumber}
            placeholder="010-1234-5678"
            helpText="한국 휴대폰 번호 형식"
            required
          />

          <ValidatedInput
            name="testBusinessNumber"
            label="사업자등록번호"
            value={testData.businessNumber}
            onChange={(value) => setTestData(prev => ({ ...prev, businessNumber: value as string }))}
            schema={validationSchemas.common.businessNumber}
            placeholder="123-45-67890"
            helpText="사업자등록번호 형식"
            required
          />

          <ValidatedInput
            name="testPassword"
            label="비밀번호"
            type="password"
            value={testData.password}
            onChange={(value) => setTestData(prev => ({ ...prev, password: value as string }))}
            schema={validationSchemas.common.password}
            placeholder="영문+숫자 8자 이상"
            helpText="영문과 숫자를 포함한 8자 이상"
            required
          />

          <ValidatedInput
            name="testName"
            label="이름"
            value={testData.name}
            onChange={(value) => setTestData(prev => ({ ...prev, name: value as string }))}
            schema={validationSchemas.common.name}
            placeholder="홍길동"
            helpText="한글 또는 영문 2-20자"
            required
          />

          <ValidatedSelect
            name="testHospitalType"
            label="병원 유형"
            value={testData.hospitalType}
            onChange={(value) => setTestData(prev => ({ ...prev, hospitalType: value }))}
            schema={validationSchemas.auth.doctorSignup.shape.hospitalType}
            options={[
              { value: '종합병원', label: '종합병원' },
              { value: '병원', label: '병원' },
              { value: '의원', label: '의원' },
              { value: '치과병원', label: '치과병원' },
              { value: '치과의원', label: '치과의원' },
              { value: '한방병원', label: '한방병원' },
              { value: '한의원', label: '한의원' },
              { value: '기타', label: '기타' }
            ]}
            emptyOption="병원 유형을 선택하세요"
            required
          />
        </div>

        <div className="mt-6">
          <ValidatedTextarea
            name="testDescription"
            label="설명"
            value={testData.description}
            onChange={(value) => setTestData(prev => ({ ...prev, description: value as string }))}
            schema={validationSchemas.community.postCreate.shape.content}
            placeholder="설명을 입력하세요..."
            helpText="10-5000자 사이로 입력하세요"
            rows={4}
            maxLength={5000}
            showCharCount
          />
        </div>
      </div>

      {/* 전체 폼 검증 테스트 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">3. 전체 폼 검증 테스트</h2>
        <p className="text-gray-600 mb-6">의사 회원가입 폼으로 전체 검증을 테스트해보세요</p>
        
        <ValidatedForm
          schema={validationSchemas.auth.doctorSignup}
          onSubmit={handleFormSubmit}
          submitButtonText="회원가입 테스트"
          showErrorSummary={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ValidatedInput
              name="email"
              label="이메일"
              type="email"
              value=""
              onChange={() => {}}
              schema={validationSchemas.common.email}
              placeholder="doctor@hospital.com"
              required
            />

            <ValidatedInput
              name="password"
              label="비밀번호"
              type="password"
              value=""
              onChange={() => {}}
              schema={validationSchemas.common.password}
              required
            />

            <ValidatedInput
              name="confirmPassword"
              label="비밀번호 확인"
              type="password"
              value=""
              onChange={() => {}}
              schema={validationSchemas.common.password}
              required
            />

            <ValidatedInput
              name="name"
              label="이름"
              value=""
              onChange={() => {}}
              schema={validationSchemas.common.name}
              required
            />

            <ValidatedInput
              name="phone"
              label="전화번호"
              type="tel"
              value=""
              onChange={() => {}}
              schema={validationSchemas.common.phoneNumber}
              required
            />

            <ValidatedInput
              name="hospitalName"
              label="병원명"
              value=""
              onChange={() => {}}
              schema={validationSchemas.auth.doctorSignup.shape.hospitalName}
              required
            />

            <ValidatedSelect
              name="hospitalType"
              label="병원 유형"
              value=""
              onChange={() => {}}
              schema={validationSchemas.auth.doctorSignup.shape.hospitalType}
              options={[
                { value: '종합병원', label: '종합병원' },
                { value: '병원', label: '병원' },
                { value: '의원', label: '의원' },
                { value: '치과병원', label: '치과병원' },
                { value: '치과의원', label: '치과의원' },
                { value: '한방병원', label: '한방병원' },
                { value: '한의원', label: '한의원' },
                { value: '기타', label: '기타' }
              ]}
              emptyOption="선택하세요"
              required
            />

            <ValidatedSelect
              name="subscriptionPlan"
              label="구독 플랜"
              value=""
              onChange={() => {}}
              schema={validationSchemas.auth.doctorSignup.shape.subscriptionPlan}
              options={[
                { value: '1month', label: '1개월' },
                { value: '6months', label: '6개월' },
                { value: '12months', label: '12개월' }
              ]}
              emptyOption="선택하세요"
              required
            />
          </div>

          <ValidatedInput
            name="hospitalAddress"
            label="병원 주소"
            value=""
            onChange={() => {}}
            schema={validationSchemas.common.address}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ValidatedInput
              name="businessNumber"
              label="사업자등록번호"
              value=""
              onChange={() => {}}
              schema={validationSchemas.common.businessNumber}
              required
            />

            <ValidatedInput
              name="licenseNumber"
              label="의료진 면허번호"
              value=""
              onChange={() => {}}
              schema={validationSchemas.auth.doctorSignup.shape.licenseNumber}
              placeholder="DOC-2024-001"
              required
            />
          </div>

          <ValidatedInput
            name="specialization"
            label="전문과목"
            value=""
            onChange={() => {}}
            schema={validationSchemas.auth.doctorSignup.shape.specialization}
            required
          />

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="agreeToTerms"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="ml-2 text-sm text-gray-700">이용약관에 동의합니다</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="agreeToPrivacy"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="ml-2 text-sm text-gray-700">개인정보처리방침에 동의합니다</span>
            </label>
          </div>
        </ValidatedForm>
      </div>

      {/* 브라우저 콘솔 안내 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">💡 추가 테스트 방법</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>브라우저 개발자 도구</strong>를 열어 콘솔 탭에서 검증 로그를 확인하세요</li>
          <li>• <strong>네트워크 탭</strong>에서 API 요청/응답을 확인하세요</li>
          <li>• 다양한 <strong>잘못된 값</strong>을 입력해서 오류 메시지를 확인하세요</li>
          <li>• <strong>필수 필드</strong>를 비워두고 제출해보세요</li>
          <li>• <strong>실시간 검증</strong>이 디바운스되는지 확인하세요</li>
        </ul>
      </div>
    </div>
  )
}