'use client'

import React from 'react'
import { Shield, Eye, Lock, Database, AlertTriangle, Phone, Mail } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import BackButton from '@/components/common/BackButton'

export default function PrivacyPage() {
  const lastUpdated = '2024년 1월 1일'
  const effectiveDate = '2024년 1월 1일'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        <BackButton className="mb-2" />
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">개인정보처리방침</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Obdoc은 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고자 다음과 같은 처리방침을 두고 있습니다.
          </p>
        </div>

        {/* 중요 정보 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <Lock className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-900">시행일</div>
                <div className="text-sm text-gray-600">{effectiveDate}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Eye className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-900">최종 업데이트</div>
                <div className="text-sm text-gray-600">{lastUpdated}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-900">보관기간</div>
                <div className="text-sm text-gray-600">회원탈퇴 후 5년</div>
              </div>
            </div>
          </Card>
        </div>

        {/* 주요 내용 */}
        <Card className="p-8 mb-6">
          <div className="prose prose-lg max-w-none">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">의료정보 보호</h3>
                  <p className="text-sm text-red-700 mt-1">
                    본 서비스는 의료정보를 다루므로 개인정보보호법 및 의료법에 따른 
                    엄격한 보안 기준을 적용합니다.
                  </p>
                </div>
              </div>
            </div>

            <h2>제1조 (개인정보의 처리목적)</h2>
            <p>주식회사 옵독(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다:</p>
            <ol>
              <li><strong>회원가입 및 관리</strong>
                <ul>
                  <li>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증</li>
                  <li>회원자격 유지·관리, 서비스 부정이용 방지</li>
                  <li>각종 고지·통지, 고충처리 등을 목적으로 개인정보를 처리합니다</li>
                </ul>
              </li>
              <li><strong>재화 또는 서비스 제공</strong>
                <ul>
                  <li>비만 관리 서비스 제공, 콘텐츠 제공</li>
                  <li>맞춤서비스 제공, 본인인증, 연령인증</li>
                  <li>요금결제·정산을 목적으로 개인정보를 처리합니다</li>
                </ul>
              </li>
              <li><strong>고충처리</strong>
                <ul>
                  <li>민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지</li>
                  <li>처리결과 통보 목적으로 개인정보를 처리합니다</li>
                </ul>
              </li>
              <li><strong>의료서비스 지원</strong>
                <ul>
                  <li>의료진과 환자 간 소통 지원</li>
                  <li>건강 데이터 기록 및 분석</li>
                  <li>치료 경과 추적 및 관리</li>
                </ul>
              </li>
            </ol>

            <h2>제2조 (개인정보의 처리 및 보유기간)</h2>
            <ol>
              <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
              <li>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                <ul>
                  <li><strong>회원가입 및 관리:</strong> 회원탈퇴 시까지 (단, 관계법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료시까지)</li>
                  <li><strong>재화 또는 서비스 제공:</strong> 재화·서비스 공급완료 및 요금결제·정산 완료시까지 (단, 다음의 사유에 해당하는 경우에는 해당 기간 종료시까지)
                    <ul>
                      <li>「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 표시·광고, 계약내용 및 이행 등에 관한 기록: 5년</li>
                      <li>「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                      <li>「신용정보의 이용 및 보호에 관한 법률」에 따른 신용정보의 수집/처리 및 이용 등에 관한 기록: 3년</li>
                    </ul>
                  </li>
                  <li><strong>의료정보:</strong> 의료법에 따른 의무기록 보존기간(10년)</li>
                </ul>
              </li>
            </ol>

            <h2>제3조 (개인정보의 처리 항목)</h2>
            <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
            <ol>
              <li><strong>회원가입 시 수집항목</strong>
                <ul>
                  <li>필수항목: 이름, 이메일, 비밀번호, 휴대전화번호, 생년월일, 성별</li>
                  <li>선택항목: 주소</li>
                </ul>
              </li>
              <li><strong>의료진 회원가입 시 추가 수집항목</strong>
                <ul>
                  <li>필수항목: 의료면허번호, 전문의 자격증, 소속 의료기관 정보</li>
                  <li>선택항목: 전문분야, 경력사항</li>
                </ul>
              </li>
              <li><strong>서비스 이용 과정에서 수집되는 항목</strong>
                <ul>
                  <li>건강정보: 신장, 체중, 혈압, 혈당, 복용약물 등</li>
                  <li>이용기록: 접속 로그, 쿠키, 접속 IP 정보, 결제기록</li>
                </ul>
              </li>
              <li><strong>민감정보 처리</strong>
                <ul>
                  <li>건강에 관한 정보 (개인정보보호법 제23조에 따른 민감정보)</li>
                  <li>별도 동의를 받아 최소한으로 수집·처리</li>
                </ul>
              </li>
            </ol>

            <h2>제4조 (개인정보의 제3자 제공)</h2>
            <ol>
              <li>회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</li>
              <li>회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다:
                <ul>
                  <li><strong>제공받는 자:</strong> 제휴 의료기관</li>
                  <li><strong>제공받는 자의 개인정보 이용목적:</strong> 진료 연계 및 의료서비스 제공</li>
                  <li><strong>제공하는 개인정보 항목:</strong> 성명, 연락처, 건강정보</li>
                  <li><strong>제공받는 자의 보유·이용기간:</strong> 진료 완료 후 의료법에 따른 보존기간</li>
                </ul>
              </li>
            </ol>

            <h2>제5조 (개인정보처리의 위탁)</h2>
            <ol>
              <li>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</li>
              <li>위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.</li>
            </ol>

            <table className="w-full border-collapse border border-gray-300 mt-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">수탁업체</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">위탁업무</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">보유기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">AWS (Amazon Web Services)</td>
                  <td className="border border-gray-300 px-4 py-2">클라우드 서버 운영</td>
                  <td className="border border-gray-300 px-4 py-2">위탁계약 종료시까지</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">이니시스</td>
                  <td className="border border-gray-300 px-4 py-2">결제처리 서비스</td>
                  <td className="border border-gray-300 px-4 py-2">결제완료 후 5년</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">알리고</td>
                  <td className="border border-gray-300 px-4 py-2">SMS/알림톡 발송</td>
                  <td className="border border-gray-300 px-4 py-2">발송완료 후 즉시 삭제</td>
                </tr>
              </tbody>
            </table>

            <h2>제6조 (정보주체의 권리·의무 및 행사방법)</h2>
            <ol>
              <li>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
                <ul>
                  <li>개인정보 처리현황 통지요구</li>
                  <li>개인정보 열람요구</li>
                  <li>개인정보 정정·삭제요구</li>
                  <li>개인정보 처리정지요구</li>
                </ul>
              </li>
              <li>제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.</li>
              <li>정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</li>
            </ol>

            <h2>제7조 (개인정보의 파기)</h2>
            <ol>
              <li>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
              <li>파기의 절차 및 방법은 다음과 같습니다:
                <ul>
                  <li><strong>파기절차:</strong> 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                  <li><strong>파기방법:</strong>
                    <ul>
                      <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다</li>
                      <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다</li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ol>

            <h2>제8조 (개인정보의 안전성 확보조치)</h2>
            <p>회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:</p>
            <ol>
              <li><strong>개인정보 취급 직원의 최소화 및 교육</strong>
                <ul>
                  <li>개인정보를 취급하는 직원을 지정하고 담당자에 한정시켜 최소화하여 개인정보를 관리하는 대책을 시행하고 있습니다.</li>
                </ul>
              </li>
              <li><strong>정기적인 자체 감사</strong>
                <ul>
                  <li>개인정보 취급 관련 안정성 확보를 위해 정기적(분기 1회)으로 자체 감사를 실시하고 있습니다.</li>
                </ul>
              </li>
              <li><strong>내부관리계획의 수립 및 시행</strong>
                <ul>
                  <li>개인정보의 안전한 처리를 위하여 내부관리계획을 수립하고 시행하고 있습니다.</li>
                </ul>
              </li>
              <li><strong>개인정보의 암호화</strong>
                <ul>
                  <li>이용자의 개인정보는 비밀번호는 암호화 되어 저장 및 관리되고 있어, 본인만이 알 수 있으며 중요한 데이터는 파일 및 전송 데이터를 암호화 하거나 파일 잠금 기능을 사용하는 등의 별도 보안기능을 사용하고 있습니다.</li>
                </ul>
              </li>
              <li><strong>해킹 등에 대비한 기술적 대책</strong>
                <ul>
                  <li>회사는 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하며 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.</li>
                </ul>
              </li>
              <li><strong>개인정보에 대한 접근 제한</strong>
                <ul>
                  <li>개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여,변경,말소를 통하여 개인정보에 대한 접근통제를 위하여 필요한 조치를 하고 있으며 침입차단시스템을 이용하여 외부로부터의 무단 접근을 통제하고 있습니다.</li>
                </ul>
              </li>
              <li><strong>접속기록의 보관 및 위변조 방지</strong>
                <ul>
                  <li>개인정보처리시스템에 접속한 기록을 최소 1년 이상 보관, 관리하고 있으며, 접속 기록이 위변조 및 도난, 분실되지 않도록 보안기능 사용하고 있습니다.</li>
                </ul>
              </li>
            </ol>

            <h2>제9조 (개인정보 보호책임자)</h2>
            <ol>
              <li>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</li>
            </ol>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-gray-900 mb-2">개인정보 보호책임자</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>성명: [개인정보보호책임자명]</li>
                <li>직책: [직책]</li>
                <li>연락처: privacy@obdoc.co.kr</li>
                <li>전화: 1588-0000</li>
              </ul>
            </div>

            <h2>제10조 (개인정보 처리방침 변경)</h2>
            <ol>
              <li>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</li>
              <li>본 방침은 {effectiveDate}부터 시행됩니다.</li>
            </ol>
          </div>
        </Card>

        {/* 연락처 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            개인정보 관련 문의
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">개인정보 보호책임자</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  privacy@obdoc.co.kr
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  1588-0000
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">개인정보 침해신고센터</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>privacy.go.kr</div>
                <div>전화: (국번없이) 182</div>
                <div>개인정보 분쟁조정위원회</div>
                <div>kopico.go.kr / 1833-6972</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}