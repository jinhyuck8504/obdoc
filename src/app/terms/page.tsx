import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>
          
          <div className="prose prose-slate max-w-none">
            <h2>제1조 (목적)</h2>
            <p>
              이 약관은 브랜뉴메디(이하 "회사")가 제공하는 오비닥(Obdoc) 비만 관리 플랫폼 서비스(이하 "서비스")의 
              이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>

            <h2>제2조 (정의)</h2>
            <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
            <ol>
              <li>"서비스"란 회사가 제공하는 비만 관리 플랫폼을 의미합니다.</li>
              <li>"이용자"란 이 약관에 따라 회사와 이용계약을 체결하고 서비스를 이용하는 자를 의미합니다.</li>
              <li>"원장"이란 의료기관을 운영하며 서비스를 이용하는 의료진을 의미합니다.</li>
              <li>"고객"이란 의료기관의 환자로서 서비스를 이용하는 자를 의미합니다.</li>
            </ol>

            <h2>제3조 (약관의 효력 및 변경)</h2>
            <p>
              이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
              회사는 필요한 경우 이 약관을 변경할 수 있으며, 변경된 약관은 제1항과 같은 방법으로 
              공지 또는 통지함으로써 효력이 발생합니다.
            </p>

            <h2>제4조 (서비스의 제공)</h2>
            <p>회사는 다음과 같은 서비스를 제공합니다:</p>
            <ol>
              <li>비만 관리 플랫폼 서비스</li>
              <li>의료진과 환자 간의 소통 도구</li>
              <li>건강 데이터 관리 및 분석</li>
              <li>커뮤니티 서비스</li>
              <li>기타 회사가 정하는 서비스</li>
            </ol>

            <h2>제5조 (이용계약의 성립)</h2>
            <p>
              이용계약은 이용자가 약관의 내용에 대하여 동의를 하고 이용신청을 한 후 
              회사가 이러한 신청에 대하여 승낙함으로써 성립합니다.
            </p>

            <h2>제6조 (개인정보보호)</h2>
            <p>
              회사는 이용자의 개인정보를 보호하기 위해 개인정보처리방침을 수립하여 시행하고 있으며,
              관련 법령에 따라 이용자의 개인정보를 보호합니다.
            </p>

            <h2>제7조 (이용자의 의무)</h2>
            <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
            <ol>
              <li>신청 또는 변경 시 허위내용의 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
              <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
            </ol>

            <h2>제8조 (서비스 이용의 제한)</h2>
            <p>
              회사는 이용자가 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우,
              경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.
            </p>

            <h2>제9조 (면책조항)</h2>
            <p>
              회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 
              서비스 제공에 관한 책임이 면제됩니다.
            </p>

            <h2>제10조 (준거법 및 관할법원)</h2>
            <p>
              이 약관과 관련된 법적 분쟁에 대해서는 대한민국 법을 적용하며,
              서울중앙지방법원을 관할 법원으로 합니다.
            </p>

            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>시행일:</strong> 2025년 8월 1일<br />
                <strong>회사명:</strong> 브랜뉴메디<br />
                <strong>서비스명:</strong> 오비닥(Obdoc)<br />
                <strong>문의:</strong> brandnewmedi@naver.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}