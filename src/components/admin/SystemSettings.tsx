'use client'

import React, { useState } from 'react'
import { 
  Database, 
  Mail, 
  Shield, 
  Bell, 
  Globe, 
  Server,
  Save,
  RefreshCw,
  AlertTriangle,
  Download,
  Upload,
  TestTube
} from 'lucide-react'

interface SystemSettings {
  siteName: string
  siteDescription: string
  adminEmail: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  maxFileSize: number
  sessionTimeout: number
  passwordMinLength: number
  backupFrequency: string
  logLevel: string
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'OBDOC - 비만 전문 의료진 매칭 플랫폼',
    siteDescription: '비만 치료 전문의와 환자를 연결하는 헬스케어 플랫폼',
    adminEmail: 'admin@obdoc.co.kr',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    maxFileSize: 5,
    sessionTimeout: 30,
    passwordMinLength: 6,
    backupFrequency: 'daily',
    logLevel: 'info'
  })
  
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      // 로컬 스토리지에 설정 저장 (실제로는 서버 API 호출)
      localStorage.setItem('systemSettings', JSON.stringify(settings))
      setSaved(true)
      alert('설정이 저장되었습니다.')
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('설정 저장 실패:', error)
      alert('설정 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('systemSettings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error('설정 로드 실패:', error)
    }
  }

  // 컴포넌트 마운트 시 설정 로드
  React.useEffect(() => {
    loadSettings()
  }, [])

  const handleReset = () => {
    if (confirm('설정을 기본값으로 초기화하시겠습니까?')) {
      const defaultSettings = {
        siteName: 'OBDOC - 비만 전문 의료진 매칭 플랫폼',
        siteDescription: '비만 치료 전문의와 환자를 연결하는 헬스케어 플랫폼',
        adminEmail: 'admin@obdoc.co.kr',
        maintenanceMode: false,
        registrationEnabled: true,
        emailNotifications: true,
        smsNotifications: false,
        maxFileSize: 5,
        sessionTimeout: 30,
        passwordMinLength: 6,
        backupFrequency: 'daily',
        logLevel: 'info'
      }
      setSettings(defaultSettings)
      localStorage.removeItem('systemSettings')
      alert('설정이 초기화되었습니다.')
    }
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `obdoc-settings-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    alert('설정이 내보내기되었습니다.')
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          setSettings(importedSettings)
          alert('설정이 가져오기되었습니다.')
        } catch (error) {
          alert('잘못된 설정 파일입니다.')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleTestEmail = () => {
    if (settings.emailNotifications) {
      alert(`테스트 이메일이 ${settings.adminEmail}로 발송되었습니다.`)
    } else {
      alert('이메일 알림이 비활성화되어 있습니다.')
    }
  }

  const handleTestSMS = () => {
    if (settings.smsNotifications) {
      alert('테스트 SMS가 발송되었습니다.')
    } else {
      alert('SMS 알림이 비활성화되어 있습니다.')
    }
  }

  const handleBackupNow = () => {
    alert('백업이 시작되었습니다. 완료되면 알림을 받으실 수 있습니다.')
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">시스템 설정</h2>
        <p className="text-gray-600">OBDOC 플랫폼의 전체 시스템 설정을 관리합니다</p>
      </div>

      <div className="space-y-6">
        {/* 기본 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">기본 설정</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사이트 이름</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">관리자 이메일</label>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">사이트 설명</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 보안 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">보안 설정</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">세션 타임아웃 (분)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                min="5"
                max="120"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">최소 비밀번호 길이</label>
              <input
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => setSettings(prev => ({ ...prev, passwordMinLength: Number(e.target.value) }))}
                min="4"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.registrationEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, registrationEnabled: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">회원가입 허용</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">유지보수 모드</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">알림 설정</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">이메일 알림 활성화</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">SMS 알림 활성화</span>
            </label>
          </div>
        </div>

        {/* 시스템 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Server className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">시스템 설정</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">최대 파일 크기 (MB)</label>
              <input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: Number(e.target.value) }))}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">백업 주기</label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => setSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hourly">매시간</option>
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">로그 레벨</label>
              <select
                value={settings.logLevel}
                onChange={(e) => setSettings(prev => ({ ...prev, logLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
          </div>
        </div>

        {/* 유지보수 모드 경고 */}
        {settings.maintenanceMode && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="text-sm font-medium text-red-800">유지보수 모드 활성화됨</h4>
            </div>
            <p className="text-sm text-red-700 mt-1">
              유지보수 모드가 활성화되면 관리자를 제외한 모든 사용자의 접근이 차단됩니다.
            </p>
          </div>
        )}

        {/* 고급 기능 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">고급 기능</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">백업 및 복원</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBackupNow}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg text-sm transition-colors"
                >
                  <Database className="w-4 h-4" />
                  <span>지금 백업</span>
                </button>
                <button
                  onClick={handleExportSettings}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>설정 내보내기</span>
                </button>
              </div>
              <div>
                <label className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg text-sm transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>설정 가져오기</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">알림 테스트</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTestEmail}
                  className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-lg text-sm transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>이메일 테스트</span>
                </button>
                <button
                  onClick={handleTestSMS}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-lg text-sm transition-colors"
                >
                  <TestTube className="w-4 h-4" />
                  <span>SMS 테스트</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            {saved && (
              <span className="text-green-600 text-sm font-medium">✓ 설정이 저장되었습니다</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>초기화</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? '저장 중...' : '설정 저장'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}