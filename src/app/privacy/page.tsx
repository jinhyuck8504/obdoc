import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
          
          <div className="prose prose-slate max-w-none">
            <h2>1. 개인정보의 처리목적</h2>
            <p>
              브랜뉴메디(이하 "회사")는 오비닥(Obdoc) 서비스와 관련하여 다음의 목적을 위하여 개인정보를 처리합니다. 
              처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 
              이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 
              필요한 조치를 이행할 예정입니다.
            </p>
            <ul>
              <li>회원 가입 및 관리</li>
              <li>서비스 제공</li>
              <li>고객 상담 및 불만처리</li>
              <li>마케팅 및 광고에의 활용</li>
            </ul>

            <h2>2. 개인정보의 처리 및 보유기간</h2>
            <p>
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 
              수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul>
              <li>회원정보: 회원 탈퇴 시까지</li>
              <li>서비스 이용기록: 3년</li>
              <li>결제정보: 5년</li>
              <li>고객상담 기록: 3년</li>
            </ul>

            <h2>3. 처리하는 개인정보의 항목</h2>
            <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
            
            <h3>가. 회원가입</h3>
            <ul>
              <li>필수항목: 이름, 이메일, 비밀번호, 전화번호</li>
              <li>선택항목: 병원명, 병원 유형, 주소</li>
            </ul>

            <h3>나. 서비스 이용</h3>
            <ul>
              <li>건강정보: 체중, 신장, BMI 등</li>
              <li>이용기록: 접속 로그, 쿠키, 접속 IP 정보</li>
            </ul>

            <h2>4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 
              처리하며, 정보주체의 사전 동의 없이는 본래의 목적 범위를 초과하여 처리하거나 
              제3자에게 제공하지 않습니다.
            </p>

            <h2>5. 개인정보처리의 위탁</h2>
            <p>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
            <ul>
              <li>위탁받는 자: AWS (Amazon Web Services)</li>
              <li>위탁하는 업무의 내용: 클라우드 서비스 제공</li>
            </ul>

            <h2>6. 정보주체의 권리·의무 및 행사방법</h2>
            <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
            <ol>
              <li>개인정보 처리현황 통지요구</li>
              <li>개인정보 열람요구</li>
              <li>개인정보 정정·삭제요구</li>
              <li>개인정보 처리정지요구</li>
            </ol>

            <h2>7. 개인정보의 파기</h2>
            <p>
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
              지체없이 해당 개인정보를 파기합니다.
            </p>

            <h3>파기절차</h3>
            <p>
              이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 
              내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.
            </p>

            <h3>파기방법</h3>
            <ul>
              <li>전자적 파일 형태: 기록을 재생할 수 없도록 로우레벨포맷 등의 방법을 이용하여 파기</li>
              <li>종이 문서: 분쇄하거나 소각하여 파기</li>
            </ul>

            <h2>8. 개인정보의 안전성 확보조치</h2>
            <p>회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:</p>
            <ul>
              <li>개인정보 취급 직원의 최소화 및 교육</li>
              <li>개인정보에 대한 접근 제한</li>
              <li>개인정보를 안전하게 저장·전송할 수 있는 암호화 기술의 사용</li>
              <li>해킹 등에 대비한 기술적 대책</li>
              <li>개인정보에 대한 접근기록의 보관 및 위변조 방지</li>
            </ul>

            <h2>9. 개인정보보호책임자</h2>
            <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다:</p>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>개인정보보호책임자</strong></p>
              <ul>
                <li>성명: 최진혁</li>
                <li>직책: 대표</li>
                <li>연락처: brandnewmedi@naver.com</li>
              </ul>
            </div>

            <h2>10. 개인정보 처리방침 변경</h2>
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 
              삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
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