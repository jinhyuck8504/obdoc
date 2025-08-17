import DiagnosticPanel from '@/components/diagnostic/DiagnosticPanel'

export default function DiagnosticPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DiagnosticPanel />
    </div>
  )
}

export const metadata = {
  title: '시스템 진단 - OBDoc',
  description: 'OBDoc 애플리케이션의 기본 기능 상태를 확인합니다'
}