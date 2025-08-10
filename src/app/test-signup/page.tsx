'use client'
import React, { useState } from 'react'
import { validationSchemas } from '@/lib/validation/schemas'
import ValidatedInput, { ValidatedTextarea, ValidatedSelect } from '@/components/validation/ValidatedInput'
import ValidatedForm from '@/components/validation/ValidatedForm'
import { Stethoscope, Heart, Phone, Mail, Building2, User, Shield, MessageSquare, Bell } from 'lucide-react'

export default function SignupTestPage() {
  const [signupType, setSignupType] = useState<'doctor' | 'patient'>('doctor')

  const handleDoctorSignup = async (data: any) => {
    console.log('의사 회원가입 데이터:', data)
    alert('의사 회원가입 성공! 콘솔을 확인하세요.')
  }

  const handlePatientSignup = async (data: any) => {
    console.log('환자 회원가입 데이터:', data)
    alert('환자 회원가입 성공! 콘솔을 확인하세요.')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">개선된 회원가입 테스트</h1>
        <p className="text-gray-600">연락처 및 개인정보 동의 기능이 추가된 회원가입 폼</p>
      </div>

      {/* 회원가입 유형 선택 */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setSignupType('doctor')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
            signupType === 'doctor'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Stethoscope className="w-5 h-5" />
          <span>의사 회원가입</span>
        </button>
        <button
          onClick={() => setSignupType('patient')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
            signupType === 'patient'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span>환자 회원가입</span>
        </button>
      </div>

      {/* 의사 회원가입 폼 */}
      {signupType === 'doctor' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">의사 회원가입</h2>
          </div>
          
          <ValidatedForm
            schema={validationSchemas.auth.doctorSignup}
            onSubmit={handleDoctorSignup}
            submitButtonText="의사 회원가입"
            showErrorSummary={true}
          >
            {/* 기본 계정 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                기본 계정 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="email"
                  label="이메일"
                  type="email"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.email}
                  placeholder="doctor@hospital.com"
                  required
                />
                <ValidatedInput
                  name="name"
                  label="이름"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.name}
                  placeholder="홍길동"
                  required
                />
                <ValidatedInput
                  name="password"
                  label="비밀번호"
                  type="password"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.password}
                  helpText="영문+숫자 8자 이상"
                  required
                />
                <ValidatedInput
                  name="confirmPassword"
                  label="비밀번호 확인"
                  type="password"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.password}
                  required
                />
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                연락처 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="personalPhone"
                  label="개인 휴대폰 번호"
                  type="tel"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.phoneNumber}
                  placeholder="010-1234-5678"
                  helpText="SMS/카톡 알림 수신용 (필수)"
                  required
                />
                <ValidatedInput
                  name="hospitalPhone"
                  label="병원 대표번호"
                  type="tel"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.generalPhoneNumber}
                  placeholder="02-1234-5678"
                  helpText="병원 대표 전화번호"
                  required
                />
              </div>
            </div>

            {/* 병원 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                병원 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="hospitalName"
                  label="병원명"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.auth.doctorSignup.shape.hospitalName}
                  placeholder="서울대학교병원"
                  required
                />
                <ValidatedSelect
                  name="hospitalType"
                  label="병원 유형"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.auth.doctorSignup.shape.hospitalType}
                  options={[
                    { value: '종합병원', label: '종합병원' },
                    { value: '병원', label: '병원' },
                    { value: '의원', label: '의원' },
                    { value: '치과병원', label: '치과병원' },
                    { value: '치과의원', label: '치과의원' },
                    { value: '한방병원', label: '한방병원' },
                    { value: '한의원', label: '한의원' },
                    { value: '기타', label: '기타' }
                  ]}
                  emptyOption="선택하세요"
                  required
                />
              </div>
              <ValidatedInput
                name="hospitalAddress"
                label="병원 주소"
                value=""
                onChange={() => {}}
                schema={validationSchemas.common.address}
                placeholder="서울시 종로구 대학로 101"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="businessNumber"
                  label="사업자등록번호"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.businessNumber}
                  placeholder="123-45-67890"
                  required
                />
                <ValidatedInput
                  name="licenseNumber"
                  label="의료진 면허번호"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.auth.doctorSignup.shape.licenseNumber}
                  placeholder="DOC-2024-001"
                  required
                />
              </div>
              <ValidatedInput
                name="specialization"
                label="전문과목"
                value=""
                onChange={() => {}}
                schema={validationSchemas.auth.doctorSignup.shape.specialization}
                placeholder="내과, 외과, 가정의학과 등"
                required
              />
            </div>

            {/* 추가 정보 (선택) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">추가 정보 (선택사항)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="position"
                  label="직책"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.auth.doctorSignup.shape.position}
                  placeholder="원장, 과장, 전문의 등"
                />
                <ValidatedInput
                  name="experience"
                  label="임상 경력 (년)"
                  type="number"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.auth.doctorSignup.shape.experience}
                  placeholder="5"
                />
              </div>
              <ValidatedTextarea
                name="introduction"
                label="의사 소개"
                value=""
                onChange={() => {}}
                schema={validationSchemas.auth.doctorSignup.shape.introduction}
                placeholder="간단한 자기소개를 입력하세요..."
                rows={3}
                maxLength={500}
                showCharCount
              />
            </div>

            {/* 구독 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">구독 플랜</h3>
              <ValidatedSelect
                name="subscriptionPlan"
                label="구독 플랜"
                value=""
                onChange={() => {}}
                schema={validationSchemas.auth.doctorSignup.shape.subscriptionPlan}
                options={[
                  { value: '1month', label: '1개월 - ₩199,000' },
                  { value: '6months', label: '6개월 - ₩1,015,000 (월 ₩169,000)' },
                  { value: '12months', label: '12개월 - ₩1,791,000 (월 ₩149,000)' }
                ]}
                emptyOption="구독 플랜을 선택하세요"
                required
              />
            </div>

            {/* 필수 동의 항목 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                필수 동의 항목
              </h3>
              <div className="space-y-3">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">이용약관에 동의합니다</span>
                    <span className="text-red-500 ml-1">*</span>
                    <p className="text-xs text-gray-500 mt-1">서비스 이용을 위한 필수 동의사항입니다.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToPrivacy"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">개인정보처리방침에 동의합니다</span>
                    <span className="text-red-500 ml-1">*</span>
                    <p className="text-xs text-gray-500 mt-1">개인정보 수집·이용을 위한 필수 동의사항입니다.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToMedicalInfo"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">의료정보 수집·이용에 동의합니다</span>
                    <span className="text-red-500 ml-1">*</span>
                    <p className="text-xs text-gray-500 mt-1">의료 서비스 제공을 위한 필수 동의사항입니다.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 선택 동의 항목 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                알림 및 마케팅 동의 (선택사항)
              </h3>
              <div className="space-y-3">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToSms"
                    defaultChecked
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">SMS 알림 수신 동의</span>
                    <p className="text-xs text-gray-500 mt-1">예약 확인, 중요 공지사항 등을 SMS로 받습니다.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToEmail"
                    defaultChecked
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">이메일 알림 수신 동의</span>
                    <p className="text-xs text-gray-500 mt-1">서비스 업데이트, 공지사항 등을 이메일로 받습니다.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToKakao"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">카카오톡 알림 수신 동의</span>
                    <p className="text-xs text-gray-500 mt-1">카카오톡으로 예약 알림, 공지사항을 받습니다.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToMarketing"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">마케팅 정보 수신 동의</span>
                    <p className="text-xs text-gray-500 mt-1">이벤트, 프로모션, 신규 서비스 안내를 받습니다.</p>
                  </div>
                </label>
              </div>
            </div>
          </ValidatedForm>
        </div>
      )}

      {/* 환자 회원가입 폼 */}
      {signupType === 'patient' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Heart className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">환자 회원가입</h2>
          </div>
          
          <ValidatedForm
            schema={validationSchemas.auth.patientSignup}
            onSubmit={handlePatientSignup}
            submitButtonText="환자 회원가입"
            showErrorSummary={true}
          >
            {/* 기본 계정 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                기본 계정 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="email"
                  label="이메일"
                  type="email"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.email}
                  placeholder="patient@example.com"
                  required
                />
                <ValidatedInput
                  name="name"
                  label="이름"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.name}
                  placeholder="홍길동"
                  required
                />
                <ValidatedInput
                  name="password"
                  label="비밀번호"
                  type="password"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.password}
                  helpText="영문+숫자 8자 이상"
                  required
                />
                <ValidatedInput
                  name="confirmPassword"
                  label="비밀번호 확인"
                  type="password"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.password}
                  required
                />
              </div>
            </div>

            {/* 개인 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">개인 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ValidatedInput
                  name="phone"
                  label="휴대폰 번호"
                  type="tel"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.phoneNumber}
                  placeholder="010-1234-5678"
                  helpText="예약 알림 수신용 (필수)"
                  required
                />
                <ValidatedInput
                  name="dateOfBirth"
                  label="생년월일"
                  type="date"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.date}
                  required
                />
                <ValidatedSelect
                  name="gender"
                  label="성별"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.auth.patientSignup.shape.gender}
                  options={[
                    { value: 'male', label: '남성' },
                    { value: 'female', label: '여성' },
                    { value: 'other', label: '기타' }
                  ]}
                  emptyOption="선택하세요"
                  required
                />
              </div>
            </div>

            {/* 추가 정보 (선택) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">추가 정보 (선택사항)</h3>
              <ValidatedInput
                name="address"
                label="주소"
                value=""
                onChange={() => {}}
                schema={validationSchemas.common.address}
                placeholder="서울시 강남구 테헤란로 123"
                helpText="응급상황 시 필요할 수 있습니다"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ValidatedInput
                  name="height"
                  label="신장 (cm)"
                  type="number"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.height}
                  placeholder="170"
                />
                <ValidatedInput
                  name="weight"
                  label="체중 (kg)"
                  type="number"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.common.weight}
                  placeholder="70"
                />
                <ValidatedSelect
                  name="bloodType"
                  label="혈액형"
                  value=""
                  onChange={() => {}}
                  schema={validationSchemas.auth.patientSignup.shape.bloodType}
                  options={[
                    { value: 'A', label: 'A형' },
                    { value: 'B', label: 'B형' },
                    { value: 'AB', label: 'AB형' },
                    { value: 'O', label: 'O형' },
                    { value: 'unknown', label: '모름' }
                  ]}
                  emptyOption="선택하세요"
                />
              </div>

              <ValidatedTextarea
                name="medicalHistory"
                label="병력"
                value=""
                onChange={() => {}}
                schema={validationSchemas.auth.patientSignup.shape.medicalHistory}
                placeholder="과거 병력이나 수술 이력을 입력하세요..."
                rows={3}
                maxLength={1000}
                showCharCount
              />
            </div>

            {/* 필수 동의 항목 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                필수 동의 항목
              </h3>
              <div className="space-y-3">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    required
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">이용약관에 동의합니다</span>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToPrivacy"
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    required
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">개인정보처리방침에 동의합니다</span>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToMedicalInfo"
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    required
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">의료정보 수집·이용에 동의합니다</span>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 선택 동의 항목 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                알림 및 마케팅 동의 (선택사항)
              </h3>
              <div className="space-y-3">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToSms"
                    defaultChecked
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">SMS 알림 수신 동의</span>
                    <p className="text-xs text-gray-500 mt-1">예약 확인, 건강 관리 알림을 SMS로 받습니다.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToEmail"
                    defaultChecked
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">이메일 알림 수신 동의</span>
                    <p className="text-xs text-gray-500 mt-1">건강 정보, 서비스 업데이트를 이메일로 받습니다.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToKakao"
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">카카오톡 알림 수신 동의</span>
                    <p className="text-xs text-gray-500 mt-1">카카오톡으로 예약 알림을 받습니다.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToHealthData"
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">건강데이터 활용 동의</span>
                    <p className="text-xs text-gray-500 mt-1">더 나은 건강 관리 서비스 제공을 위한 데이터 활용에 동의합니다.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeToMarketing"
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">마케팅 정보 수신 동의</span>
                    <p className="text-xs text-gray-500 mt-1">건강 관련 이벤트, 프로모션 정보를 받습니다.</p>
                  </div>
                </label>
              </div>
            </div>
          </ValidatedForm>
        </div>
      )}

      {/* 개선사항 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-3">🚀 개선된 기능들</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-2">연락처 개선</h4>
            <ul className="space-y-1">
              <li>• 개인 휴대폰 + 병원 대표번호 분리</li>
              <li>• SMS/카톡 알림을 위한 휴대폰 필수</li>
              <li>• 일반 전화번호 형식 지원</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">개인정보 동의</h4>
            <ul className="space-y-1">
              <li>• 필수/선택 동의 항목 구분</li>
              <li>• 의료정보 수집 동의 추가</li>
              <li>• 알림 방식별 세분화된 동의</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">추가 정보</h4>
            <ul className="space-y-1">
              <li>• 의사: 직책, 경력, 소개</li>
              <li>• 환자: 건강정보, 비상연락처</li>
              <li>• 선택사항으로 부담 최소화</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">실용성 향상</h4>
            <ul className="space-y-1">
              <li>• 응급상황 대비 연락체계</li>
              <li>• 마케팅 동의 세분화</li>
              <li>• 법적 요구사항 준수</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}