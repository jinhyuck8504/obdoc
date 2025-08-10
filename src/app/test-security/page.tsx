'use client'
import React, { useState } from 'react'
import { XSSProtection, InputValidator, SessionSecurity, AuditLogger, SecurityUtils } from '@/lib/security'
import SecureInput, { SecureTextarea } from '@/components/security/SecureInput'
import SessionManager, { SessionDashboard } from '@/components/security/SessionManager'
import AuditLogDashboard from '@/components/admin/AuditLogDashboard'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Key,
  FileText,
  Activity,
  Clock
} from 'lucide-react'

export default function TestSecurityPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    url: '',
    businessNumber: '',
    content: ''
  })
  const [validationStates, setValidationStates] = useState<Record<string, boolean>>({})

  // 보안 테스트 함수들
  const runSecurityTest = async (testName: string, testFn: () => any) => {
    try {
      const result = await testFn()
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          result,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }))
    }
  }

  // XSS 보호 테스트
  const testXSSProtection = () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')" />',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      'onclick="alert(\'XSS\')"'
    ]

    const results = maliciousInputs.map(input => ({
      input,
      sanitized: XSSProtection.sanitizeHTML(input),
      textSanitized: XSSProtection.sanitizeText(input)
    }))

    return results
  }

  // 입력 검증 테스트
  const testInputValidation = () => {
    const testCases = [
      {
        type: 'email',
        inputs: ['test@example.com', 'invalid-email', 'test@', '@example.com', 'test<script>@example.com'],
        validator: XSSProtection.validateEmail
      },
      {
        type: 'phone',
        inputs: ['010-1234-5678', '01012345678', '02-1234-5678', '123-456-7890', '010-1234-567'],
        validator: XSSProtection.validatePhoneNumber
      },
      {
        type: 'url',
        inputs: ['https://example.com', 'http://example.com', 'ftp://example.com', 'javascript:alert(1)', 'invalid-url'],
        validator: XSSProtection.validateURL
      },
      {
        type: 'business-number',
        inputs: ['123-45-67890', '1234567890', '000-00-00000', '123-45-6789', 'abc-de-fghij'],
        validator: InputValidator.validateBusinessNumber
      }
    ]

    return testCases.map(testCase => ({
      type: testCase.type,
      results: testCase.inputs.map(input => ({
        input,
        isValid: testCase.validator(input)
      }))
    }))
  }

  // 비밀번호 강도 테스트
  const testPasswordStrength = () => {
    const passwords = [
      '123456',
      'password',
      'Password1',
      'Password1!',
      'MyStr0ng!P@ssw0rd',
      'aaaaaa',
      'Aa1!',
      'ComplexP@ssw0rd123!'
    ]

    return passwords.map(password => ({
      password,
      ...InputValidator.validatePasswordStrength(password)
    }))
  }

  // 세션 보안 테스트
  const testSessionSecurity = () => {
    // 테스트 세션 생성
    const sessionToken = SessionSecurity.createSession('test-user', 'doctor')
    
    // 세션 검증
    const validation = SessionSecurity.validateSession(sessionToken)
    
    // CSRF 토큰 생성 및 검증
    const csrfToken = SessionSecurity.generateCSRFToken()
    const csrfValidation = SessionSecurity.validateCSRFToken(csrfToken)

    return {
      sessionToken: sessionToken.substring(0, 20) + '...',
      sessionValidation: validation,
      csrfToken: csrfToken.substring(0, 20) + '...',
      csrfValidation
    }
  }

  // SQL 인젝션 감지 테스트
  const testSQLInjectionDetection = () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "1; DELETE FROM users WHERE 1=1",
      "UNION SELECT * FROM users",
      "normal input",
      "user@example.com"
    ]

    return maliciousInputs.map(input => ({
      input,
      isMalicious: XSSProtection.detectSQLInjection(input)
    }))
  }

  // 보안 유틸리티 테스트
  const testSecurityUtils = () => {
    const randomString = SecurityUtils.generateSecureRandom(32)
    const hash = SecurityUtils.generateHash('test-data', 'salt')
    const timeBasedToken = SecurityUtils.generateTimeBasedToken('secret-key')
    const rateLimitTest = SecurityUtils.checkRateLimit('test-key', 5, 60000)

    return {
      randomString,
      hash,
      timeBasedToken,
      rateLimitTest
    }
  }

  // 감사 로그 테스트
  const testAuditLogging = () => {
    // 테스트 로그 생성
    AuditLogger.logLoginAttempt('test@example.com', true)
    AuditLogger.logDataAccess('test-user', 'patient-data', 'view')
    AuditLogger.logSensitiveAction('test-user', 'password-change', { timestamp: Date.now() })
    AuditLogger.logSecurityEvent('test-user', 'suspicious-activity', { reason: 'multiple-failed-logins' })

    // 로그 조회
    const logs = AuditLogger.getLogs()
    
    return {
      totalLogs: logs.length,
      recentLogs: logs.slice(0, 5)
    }
  }

  // 폼 입력 핸들러
  const handleInputChange = (field: string) => (value: string, isValid: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationStates(prev => ({ ...prev, [field]: isValid }))
  }

  // 테스트 케이스들
  const securityTests = [
    {
      id: 'xss-protection',
      name: 'XSS 보호 테스트',
      description: 'HTML 및 JavaScript 인젝션 공격 차단 테스트',
      icon: Shield,
      test: testXSSProtection
    },
    {
      id: 'input-validation',
      name: '입력 검증 테스트',
      description: '이메일, 전화번호, URL, 사업자번호 검증 테스트',
      icon: CheckCircle,
      test: testInputValidation
    },
    {
      id: 'password-strength',
      name: '비밀번호 강도 테스트',
      description: '비밀번호 복잡성 및 보안 강도 평가',
      icon: Lock,
      test: testPasswordStrength
    },
    {
      id: 'session-security',
      name: '세션 보안 테스트',
      description: '세션 토큰 생성, 검증 및 CSRF 보호 테스트',
      icon: Key,
      test: testSessionSecurity
    },
    {
      id: 'sql-injection',
      name: 'SQL 인젝션 감지 테스트',
      description: 'SQL 인젝션 공격 패턴 감지 및 차단',
      icon: AlertTriangle,
      test: testSQLInjectionDetection
    },
    {
      id: 'security-utils',
      name: '보안 유틸리티 테스트',
      description: '랜덤 문자열, 해시, 토큰 생성 및 레이트 리미팅',
      icon: Activity,
      test: testSecurityUtils
    },
    {
      id: 'audit-logging',
      name: '감사 로깅 테스트',
      description: '보안 이벤트 로깅 및 추적 시스템',
      icon: FileText,
      test: testAuditLogging
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <Shield className="w-8 h-8 mr-3 text-blue-600" />
          보안 시스템 테스트
        </h1>

        {/* 보안 테스트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {securityTests.map(test => {
            const Icon = test.icon
            const result = testResults[test.id]

            return (
              <Card key={test.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {test.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {test.description}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => runSecurityTest(test.id, test.test)}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    테스트 실행
                  </Button>
                </div>

                {result && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.success ? '테스트 완료' : '테스트 실패'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString('ko-KR')}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(result.success ? result.result : result.error, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* 보안 입력 컴포넌트 테스트 */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            보안 입력 컴포넌트 테스트
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SecureInput
                label="이메일"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                validation="email"
                placeholder="example@obdoc.co.kr"
              />
              
              <SecureInput
                label="비밀번호"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                validation="password"
                showStrength={true}
                placeholder="안전한 비밀번호를 입력하세요"
              />
              
              <SecureInput
                label="전화번호"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                validation="phone"
                placeholder="010-1234-5678"
              />
            </div>
            
            <div className="space-y-4">
              <SecureInput
                label="웹사이트 URL"
                type="url"
                value={formData.url}
                onChange={handleInputChange('url')}
                validation="url"
                placeholder="https://example.com"
              />
              
              <SecureInput
                label="사업자등록번호"
                type="text"
                value={formData.businessNumber}
                onChange={handleInputChange('businessNumber')}
                validation="business-number"
                placeholder="123-45-67890"
              />
              
              <SecureTextarea
                label="내용"
                value={formData.content}
                onChange={handleInputChange('content')}
                maxLength={500}
                placeholder="안전한 텍스트를 입력하세요..."
                rows={4}
              />
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">검증 상태</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {Object.entries(validationStates).map(([field, isValid]) => (
                <div key={field} className="flex items-center">
                  {isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  <span className={isValid ? 'text-green-700' : 'text-red-700'}>
                    {field}: {isValid ? '유효' : '무효'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 세션 관리 테스트 */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            세션 관리 시스템
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">세션 매니저</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <SessionManager />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">세션 대시보드</h4>
              <SessionDashboard />
            </div>
          </div>
        </Card>

        {/* 감사 로그 대시보드 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            감사 로그 시스템
          </h3>
          <AuditLogDashboard />
        </Card>

        {/* 보안 가이드라인 */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            보안 가이드라인
          </h3>
          
          <div className="prose prose-sm max-w-none">
            <h4>구현된 보안 기능</h4>
            <ul>
              <li><strong>XSS 보호:</strong> HTML 및 JavaScript 인젝션 공격 차단</li>
              <li><strong>입력 검증:</strong> 이메일, 전화번호, URL, 사업자번호 등 형식 검증</li>
              <li><strong>비밀번호 보안:</strong> 강도 검사 및 복잡성 요구사항</li>
              <li><strong>세션 관리:</strong> 자동 타임아웃 및 CSRF 보호</li>
              <li><strong>SQL 인젝션 방지:</strong> 의심스러운 패턴 감지 및 차단</li>
              <li><strong>감사 로깅:</strong> 모든 보안 이벤트 추적 및 기록</li>
              <li><strong>레이트 리미팅:</strong> 무차별 대입 공격 방지</li>
            </ul>
            
            <h4>보안 모범 사례</h4>
            <ul>
              <li>모든 사용자 입력은 검증 및 정화 처리</li>
              <li>민감한 작업은 감사 로그에 기록</li>
              <li>세션은 정기적으로 갱신 및 만료 처리</li>
              <li>HTTPS를 통한 모든 데이터 전송 암호화</li>
              <li>정기적인 보안 테스트 및 모니터링</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}