/**
 * 역할 기반 보안 테스터
 */

export interface SecurityTestResult {
  testName: string
  passed: boolean
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
}

export interface RoleTestConfig {
  role: 'admin' | 'doctor' | 'customer'
  endpoints: string[]
  expectedStatus: number
}

class RoleBasedSecurityTester {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  /**
   * 역할별 접근 권한 테스트
   */
  async testRoleAccess(config: RoleTestConfig, token: string): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = []

    for (const endpoint of config.endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const passed = response.status === config.expectedStatus
        
        results.push({
          testName: `Role Access Test - ${config.role} to ${endpoint}`,
          passed,
          message: passed 
            ? `Access correctly ${config.expectedStatus === 200 ? 'allowed' : 'denied'}`
            : `Expected ${config.expectedStatus}, got ${response.status}`,
          severity: passed ? 'low' : 'high',
          timestamp: new Date()
        })
      } catch (error) {
        results.push({
          testName: `Role Access Test - ${config.role} to ${endpoint}`,
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'critical',
          timestamp: new Date()
        })
      }
    }

    return results
  }

  /**
   * 권한 상승 공격 테스트
   */
  async testPrivilegeEscalation(userToken: string, adminEndpoints: string[]): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = []

    for (const endpoint of adminEndpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        })

        const passed = response.status === 403 || response.status === 401
        
        results.push({
          testName: `Privilege Escalation Test - ${endpoint}`,
          passed,
          message: passed 
            ? 'Access correctly denied for non-admin user'
            : `Potential privilege escalation vulnerability - got ${response.status}`,
          severity: passed ? 'low' : 'critical',
          timestamp: new Date()
        })
      } catch (error) {
        results.push({
          testName: `Privilege Escalation Test - ${endpoint}`,
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'medium',
          timestamp: new Date()
        })
      }
    }

    return results
  }

  /**
   * 토큰 검증 테스트
   */
  async testTokenValidation(endpoints: string[]): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = []
    const invalidTokens = [
      '', // 빈 토큰
      'invalid-token', // 잘못된 토큰
      'Bearer invalid', // 잘못된 Bearer 토큰
      'expired-token' // 만료된 토큰 (시뮬레이션)
    ]

    for (const endpoint of endpoints) {
      for (const token of invalidTokens) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json'
            }
          })

          const passed = response.status === 401 || response.status === 403
          
          results.push({
            testName: `Token Validation Test - ${endpoint} with ${token || 'no token'}`,
            passed,
            message: passed 
              ? 'Invalid token correctly rejected'
              : `Security issue: invalid token accepted - got ${response.status}`,
            severity: passed ? 'low' : 'high',
            timestamp: new Date()
          })
        } catch (error) {
          results.push({
            testName: `Token Validation Test - ${endpoint}`,
            passed: false,
            message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'medium',
            timestamp: new Date()
          })
        }
      }
    }

    return results
  }

  /**
   * CRUD 권한 테스트
   */
  async testCRUDPermissions(
    endpoint: string, 
    userToken: string, 
    expectedPermissions: { create: boolean; read: boolean; update: boolean; delete: boolean }
  ): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = []
    const testData = { test: 'data' }

    // CREATE 테스트
    try {
      const createResponse = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      const createPassed = expectedPermissions.create 
        ? createResponse.status < 400 
        : createResponse.status >= 400

      results.push({
        testName: `CRUD Test - CREATE on ${endpoint}`,
        passed: createPassed,
        message: createPassed 
          ? 'CREATE permission correctly enforced'
          : `CREATE permission mismatch - expected ${expectedPermissions.create}, got ${createResponse.status}`,
        severity: createPassed ? 'low' : 'high',
        timestamp: new Date()
      })
    } catch (error) {
      results.push({
        testName: `CRUD Test - CREATE on ${endpoint}`,
        passed: false,
        message: `CREATE test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium',
        timestamp: new Date()
      })
    }

    // READ 테스트
    try {
      const readResponse = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      })

      const readPassed = expectedPermissions.read 
        ? readResponse.status < 400 
        : readResponse.status >= 400

      results.push({
        testName: `CRUD Test - READ on ${endpoint}`,
        passed: readPassed,
        message: readPassed 
          ? 'READ permission correctly enforced'
          : `READ permission mismatch - expected ${expectedPermissions.read}, got ${readResponse.status}`,
        severity: readPassed ? 'low' : 'high',
        timestamp: new Date()
      })
    } catch (error) {
      results.push({
        testName: `CRUD Test - READ on ${endpoint}`,
        passed: false,
        message: `READ test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium',
        timestamp: new Date()
      })
    }

    return results
  }

  /**
   * 전체 보안 테스트 실행
   */
  async runFullSecurityTest(
    adminToken: string,
    doctorToken: string,
    customerToken: string
  ): Promise<SecurityTestResult[]> {
    const allResults: SecurityTestResult[] = []

    // 관리자 엔드포인트
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/system',
      '/api/admin/audit-logs'
    ]

    // 의사 엔드포인트
    const doctorEndpoints = [
      '/api/doctor/customers',
      '/api/doctor/appointments'
    ]

    // 고객 엔드포인트
    const customerEndpoints = [
      '/api/customer/profile',
      '/api/customer/appointments'
    ]

    // 역할별 접근 테스트
    const adminTests = await this.testRoleAccess(
      { role: 'admin', endpoints: adminEndpoints, expectedStatus: 200 },
      adminToken
    )
    allResults.push(...adminTests)

    const doctorTests = await this.testRoleAccess(
      { role: 'doctor', endpoints: doctorEndpoints, expectedStatus: 200 },
      doctorToken
    )
    allResults.push(...doctorTests)

    const customerTests = await this.testRoleAccess(
      { role: 'customer', endpoints: customerEndpoints, expectedStatus: 200 },
      customerToken
    )
    allResults.push(...customerTests)

    // 권한 상승 테스트
    const escalationTests = await this.testPrivilegeEscalation(customerToken, adminEndpoints)
    allResults.push(...escalationTests)

    // 토큰 검증 테스트
    const tokenTests = await this.testTokenValidation([...adminEndpoints, ...doctorEndpoints])
    allResults.push(...tokenTests)

    return allResults
  }
}

export const roleBasedSecurityTester = new RoleBasedSecurityTester()
export default roleBasedSecurityTester