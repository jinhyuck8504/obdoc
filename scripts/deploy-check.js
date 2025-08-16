#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 배포 준비 상태 체크 중...\n')

const checks = [
  {
    name: '환경 변수 확인',
    check: () => {
      const envPath = path.join(__dirname, '../.env.local')
      if (!fs.existsSync(envPath)) {
        return { success: false, message: '.env.local 파일이 없습니다.' }
      }
      
      const envContent = fs.readFileSync(envPath, 'utf8')
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_APP_URL'
      ]
      
      const missingVars = requiredVars.filter(varName => 
        !envContent.includes(varName) || envContent.includes('your-') || envContent.includes('dummy-')
      )
      
      if (missingVars.length > 0) {
        return { 
          success: false, 
          message: `필수 환경 변수가 설정되지 않았습니다: ${missingVars.join(', ')}` 
        }
      }
      
      return { success: true, message: '모든 환경 변수가 설정되었습니다.' }
    }
  },
  {
    name: 'package.json 확인',
    check: () => {
      const packagePath = path.join(__dirname, '../package.json')
      if (!fs.existsSync(packagePath)) {
        return { success: false, message: 'package.json 파일이 없습니다.' }
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      
      if (!packageJson.scripts.build) {
        return { success: false, message: 'build 스크립트가 없습니다.' }
      }
      
      if (!packageJson.scripts.start) {
        return { success: false, message: 'start 스크립트가 없습니다.' }
      }
      
      return { success: true, message: '필수 스크립트가 모두 있습니다.' }
    }
  },
  {
    name: '핵심 파일 존재 확인',
    check: () => {
      const requiredFiles = [
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/lib/supabase.ts',
        'src/lib/config.ts',
        'next.config.js'
      ]
      
      const missingFiles = requiredFiles.filter(file => 
        !fs.existsSync(path.join(__dirname, '..', file))
      )
      
      if (missingFiles.length > 0) {
        return { 
          success: false, 
          message: `필수 파일이 없습니다: ${missingFiles.join(', ')}` 
        }
      }
      
      return { success: true, message: '모든 핵심 파일이 존재합니다.' }
    }
  },
  {
    name: 'TypeScript 설정 확인',
    check: () => {
      const tsconfigPath = path.join(__dirname, '../tsconfig.json')
      if (!fs.existsSync(tsconfigPath)) {
        return { success: false, message: 'tsconfig.json 파일이 없습니다.' }
      }
      
      return { success: true, message: 'TypeScript 설정이 있습니다.' }
    }
  }
]

let allPassed = true

checks.forEach(({ name, check }) => {
  const result = check()
  const status = result.success ? '✅' : '❌'
  console.log(`${status} ${name}: ${result.message}`)
  
  if (!result.success) {
    allPassed = false
  }
})

console.log('\n' + '='.repeat(50))

if (allPassed) {
  console.log('🎉 모든 체크를 통과했습니다! 배포 준비가 완료되었습니다.')
  console.log('\n배포 명령어:')
  console.log('  npm run build')
  console.log('  npm run start')
} else {
  console.log('⚠️  일부 체크에 실패했습니다. 위의 문제들을 해결한 후 다시 시도해주세요.')
  process.exit(1)
}

console.log('='.repeat(50))