#!/usr/bin/env node

/**
 * 성능 및 보안 검증 스크립트
 * 배포된 사이트의 성능과 보안 설정을 자동으로 검증합니다.
 */

const https = require('https');
const { performance } = require('perf_hooks');

class DeploymentValidator {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {
      performance: {},
      security: {},
      functionality: {},
      errors: []
    };
  }

  async validateDeployment() {
    console.log('🚀 배포 검증을 시작합니다...\n');
    
    try {
      await this.checkBasicConnectivity();
      await this.checkPerformance();
      await this.checkSecurity();
      await this.checkFunctionality();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ 검증 중 오류 발생:', error.message);
      this.results.errors.push(error.message);
    }
  }

  async checkBasicConnectivity() {
    console.log('📡 기본 연결성 확인...');
    
    const start = performance.now();
    
    try {
      const response = await this.makeRequest('/');
      const end = performance.now();
      
      this.results.performance.initialLoad = end - start;
      
      if (response.statusCode === 200) {
        console.log('✅ 메인 페이지 로딩 성공');
      } else {
        throw new Error(`HTTP ${response.statusCode} 응답`);
      }
    } catch (error) {
      console.log('❌ 메인 페이지 로딩 실패');
      this.results.errors.push(`기본 연결성: ${error.message}`);
    }
  }

  async checkPerformance() {
    console.log('⚡ 성능 검증...');
    
    const endpoints = [
      '/',
      '/login',
      '/signup',
      '/api/health'
    ];

    for (const endpoint of endpoints) {
      try {
        const start = performance.now();
        const response = await this.makeRequest(endpoint);
        const end = performance.now();
        
        const loadTime = end - start;
        this.results.performance[endpoint] = loadTime;
        
        if (loadTime < 3000) {
          console.log(`✅ ${endpoint}: ${loadTime.toFixed(2)}ms`);
        } else {
          console.log(`⚠️ ${endpoint}: ${loadTime.toFixed(2)}ms (느림)`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: 로딩 실패`);
        this.results.errors.push(`성능 테스트 ${endpoint}: ${error.message}`);
      }
    }
  }

  async checkSecurity() {
    console.log('🔒 보안 설정 확인...');
    
    try {
      const response = await this.makeRequest('/');
      const headers = response.headers;
      
      // 보안 헤더 확인
      const securityHeaders = {
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'strict-transport-security': true,
        'x-xss-protection': '1; mode=block'
      };

      for (const [header, expectedValue] of Object.entries(securityHeaders)) {
        if (headers[header]) {
          if (typeof expectedValue === 'boolean' || headers[header].includes(expectedValue)) {
            console.log(`✅ ${header}: 설정됨`);
            this.results.security[header] = true;
          } else {
            console.log(`⚠️ ${header}: 값이 다름`);
            this.results.security[header] = false;
          }
        } else {
          console.log(`❌ ${header}: 누락`);
          this.results.security[header] = false;
        }
      }

      // HTTPS 확인
      if (this.baseUrl.startsWith('https://')) {
        console.log('✅ HTTPS 사용');
        this.results.security.https = true;
      } else {
        console.log('❌ HTTPS 미사용');
        this.results.security.https = false;
      }

    } catch (error) {
      console.log('❌ 보안 검증 실패');
      this.results.errors.push(`보안 검증: ${error.message}`);
    }
  }

  async checkFunctionality() {
    console.log('🔧 기능 확인...');
    
    const apiEndpoints = [
      '/api/health',
      '/api/hospital-codes'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        
        if (response.statusCode === 200 || response.statusCode === 401) {
          console.log(`✅ ${endpoint}: 응답 정상`);
          this.results.functionality[endpoint] = true;
        } else {
          console.log(`⚠️ ${endpoint}: HTTP ${response.statusCode}`);
          this.results.functionality[endpoint] = false;
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: 오류`);
        this.results.functionality[endpoint] = false;
        this.results.errors.push(`기능 테스트 ${endpoint}: ${error.message}`);
      }
    }
  }

  makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('요청 시간 초과'));
      });

      req.end();
    });
  }

  generateReport() {
    console.log('\n📊 검증 결과 리포트');
    console.log('='.repeat(50));
    
    // 성능 결과
    console.log('\n⚡ 성능 결과:');
    for (const [endpoint, time] of Object.entries(this.results.performance)) {
      const status = time < 3000 ? '✅' : '⚠️';
      console.log(`${status} ${endpoint}: ${time.toFixed(2)}ms`);
    }
    
    // 보안 결과
    console.log('\n🔒 보안 결과:');
    for (const [header, status] of Object.entries(this.results.security)) {
      const icon = status ? '✅' : '❌';
      console.log(`${icon} ${header}: ${status ? '설정됨' : '누락'}`);
    }
    
    // 기능 결과
    console.log('\n🔧 기능 결과:');
    for (const [endpoint, status] of Object.entries(this.results.functionality)) {
      const icon = status ? '✅' : '❌';
      console.log(`${icon} ${endpoint}: ${status ? '정상' : '오류'}`);
    }
    
    // 오류 목록
    if (this.results.errors.length > 0) {
      console.log('\n❌ 발견된 오류:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 전체 점수
    const totalChecks = Object.keys(this.results.performance).length + 
                       Object.keys(this.results.security).length + 
                       Object.keys(this.results.functionality).length;
    
    const passedChecks = Object.values(this.results.performance).filter(t => t < 3000).length +
                        Object.values(this.results.security).filter(s => s).length +
                        Object.values(this.results.functionality).filter(f => f).length;
    
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    console.log(`\n🎯 전체 점수: ${score}% (${passedChecks}/${totalChecks})`);
    
    if (score >= 90) {
      console.log('🎉 배포 품질이 우수합니다!');
    } else if (score >= 70) {
      console.log('👍 배포 품질이 양호합니다.');
    } else {
      console.log('⚠️ 개선이 필요합니다.');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    console.error('사용법: node performance-check.js <배포된_사이트_URL>');
    console.error('예시: node performance-check.js https://your-site.netlify.app');
    process.exit(1);
  }
  
  const validator = new DeploymentValidator(baseUrl);
  validator.validateDeployment();
}

module.exports = DeploymentValidator;