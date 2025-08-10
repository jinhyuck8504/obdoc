'use client'

import React from 'react'
import { FileText, Calendar, Shield, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import BackButton from '@/components/common/BackButton'

export default function TermsPage() {
  const lastUpdated = '2024년 1월 1일'
  const effectiveDate = '2024년 1월 1일'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        <BackButton className="mb-2" />
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">이용약관</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Obdoc 비만 관리 서비스 이용에 관한 조건과 절차를 안내합니다.
          </p>
        </div>

        {/* 중요 정보 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-900">시행일</div>
                <div className="text-sm text-gray-600">{effectiveDate}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-900">최종 업데이트</div>
                <div className="text-sm text-gray-600">{lastUpdated}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* 주요 내용 */}
        <Card className="p-8 mb-6">
          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">중요 안내</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    본 서비스는 의료 서비스가 아니며, 의료진의 진료를 대체할 수 없습니다. 
                    건강 관련 결정은 반드시 의료 전문가와 상담하시기 바랍니다.
                  </p>
                </div>
              </div>
            </div>

            <h2>제1조 (목적)</h2>
            <p>
              본 약관은 주식회사 옵독(이하 "회사")이 제공하는 비만 관리 플랫폼 서비스 
              "Obdoc"(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리, 의무, 
              책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
            
            <h2>제2조 (정의)</h2>
            <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
            <ol>
              <li><strong>"서비스"</strong>란 회사가 제공하는 비만 관리 플랫폼 및 관련 서비스 일체를 의미합니다.</li>
              <li><strong>"이용자"</strong>란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 의미합니다.</li>
              <li><strong>"회원"</strong>이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 의미합니다.</li>
              <li><strong>"의료진"</strong>이란 의료법에 따른 의료인으로서 본 서비스를 통해 환자 관리 서비스를 제공하는 자를 의미합니다.</li>
              <li><strong>"고객"</strong>란 의료진으로부터 비만 관리를 받으며 본 서비스를 이용하는 자를 의미합니다.</li>
            </ol>
            
            <h2>제3조 (약관의 효력 및 변경)</h2>
            <ol>
              <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
              <li>약관이 변경되는 경우에는 변경된 약관의 적용일자 및 변경사유를 명시하여 현행약관과 함께 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
              <li>이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            </ol>

            <h2>제4조 (회원가입)</h2>
            <ol>
              <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</li>
              <li>회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
                <ul>
                  <li>가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                  <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                  <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                  <li>의료법 등 관련 법령에 위반되는 목적으로 신청하는 경우</li>
                </ul>
              </li>
            </ol>

            <h2>제5조 (개인정보보호)</h2>
            <ol>
              <li>회사는 이용자의 개인정보를 보호하기 위해 개인정보보호법 등 관련 법령을 준수합니다.</li>
              <li>개인정보의 수집, 이용, 제공, 위탁, 파기 등에 관한 사항은 개인정보처리방침에 따릅니다.</li>
              <li>회사는 의료정보의 특성을 고려하여 추가적인 보안조치를 취합니다.</li>
            </ol>

            <h2>제6조 (서비스의 제공)</h2>
            <ol>
              <li>회사는 다음과 같은 서비스를 제공합니다:
                <ul>
                  <li>비만 관리 고객 관리 시스템</li>
                  <li>의료진-고객 간 소통 플랫폼</li>
                  <li>건강 데이터 기록 및 분석</li>
                  <li>예약 관리 시스템</li>
                  <li>커뮤니티 서비스</li>
                  <li>기타 회사가 정하는 서비스</li>
                </ul>
              </li>
              <li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 단, 시스템 점검 등의 사유로 서비스가 중단될 수 있습니다.</li>
            </ol>

            <h2>제7조 (서비스 이용료)</h2>
            <ol>
              <li>회사가 제공하는 서비스는 기본적으로 무료입니다. 단, 일부 부가서비스의 경우 별도의 이용료가 발생할 수 있습니다.</li>
              <li>유료서비스의 이용료, 결제방법, 환불조건 등은 각 서비스의 안내페이지에 명시합니다.</li>
            </ol>

            <h2>제8조 (이용자의 의무)</h2>
            <ol>
              <li>이용자는 다음 행위를 하여서는 안 됩니다:
                <ul>
                  <li>신청 또는 변경 시 허위내용의 등록</li>
                  <li>타인의 정보 도용</li>
                  <li>회사가 게시한 정보의 변경</li>
                  <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                  <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                  <li>의료법 등 관련 법령에 위반되는 행위</li>
                </ul>
              </li>
            </ol>

            <h2>제9조 (의료정보 관련 특칙)</h2>
            <ol>
              <li>본 서비스를 통해 제공되는 정보는 일반적인 건강정보이며, 개별적인 의학적 조언이나 진단을 대체하지 않습니다.</li>
              <li>의료진이 제공하는 정보나 조언은 해당 의료진의 의학적 판단에 기초한 것이며, 회사는 이에 대한 의학적 책임을 지지 않습니다.</li>
              <li>응급상황 시에는 즉시 응급실을 방문하거나 119에 신고하시기 바랍니다.</li>
            </ol>

            <h2>제10조 (저작권의 귀속 및 이용제한)</h2>
            <ol>
              <li>회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</li>
              <li>이용자는 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.</li>
            </ol>

            <h2>제11조 (손해배상)</h2>
            <ol>
              <li>회사는 무료로 제공되는 서비스와 관련하여 회원에게 어떠한 손해가 발생하더라도 동 손해가 회사의 고의 또는 중대한 과실에 의한 경우를 제외하고 이에 대하여 책임을 부담하지 아니합니다.</li>
              <li>회사는 회원이 서비스에 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</li>
            </ol>

            <h2>제12조 (분쟁해결)</h2>
            <ol>
              <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.</li>
              <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 서울중앙지방법원을 관할 법원으로 합니다.</li>
            </ol>

            <h2>부칙</h2>
            <p>본 약관은 {effectiveDate}부터 적용됩니다.</p>
          </div>
        </Card>

        {/* 연락처 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">문의사항</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">회사명</div>
              <div className="text-gray-600">주식회사 옵독</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">대표이사</div>
              <div className="text-gray-600">[대표이사명]</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">주소</div>
              <div className="text-gray-600">서울특별시 강남구 [상세주소]</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">고객센터</div>
              <div className="text-gray-600">
                <div>전화: 1588-0000</div>
                <div>이메일: support@obdoc.co.kr</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}