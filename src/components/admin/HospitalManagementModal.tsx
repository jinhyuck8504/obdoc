'use client'

import React, { useState, useEffect } from 'react'
import { X, Building, Search, Edit, Trash2, MapPin, Phone, Mail, Calendar, DollarSign } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'

interface Hospital {
  id: string
  name: string
  owner_name: string
  email: string
  phone?: string
  address?: string
  type: 'clinic' | 'korean_medicine' | 'hospital'
  subscription_plan: string
  status: 'approved' | 'pending' | 'suspended'
  created_at: string
  subscription_expires_at?: string
  monthly_revenue?: number
  customer_count?: number
}

interface HospitalManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const HospitalManagementModal: React.FC<HospitalManagementModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast()
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // 병원 목록 조회
  const fetchHospitals = async () => {
    setLoading(true)
    try {
      console.log('Fetching hospitals from API...')
      const response = await fetch('/api/admin/hospitals')
      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API Result:', result)
      
      if (result.success) {
        setHospitals(result.data)
      } else {
        throw new Error(result.error || 'API returned error')
      }
    } catch (error) {
      console.error('병원 목록 조회 오류:', error)
      toast({
        title: '오류 발생',
        description: '병원 목록을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '병원 목록을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 병원 상태 변경
  const handleStatusChange = async (hospitalId: string, newStatus: string) => {
    try {
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setHospitals(prev => prev.map(hospital => 
        hospital.id === hospitalId ? { ...hospital, status: newStatus as any } : hospital
      ))
      
      toast({
        title: '상태 변경 완료',
        description: '병원 상태가 성공적으로 변경되었습니다.'
      })
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '상태 변경 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  // 병원 삭제
  const handleDeleteHospital = async (hospitalId: string) => {
    if (!confirm('정말로 이 병원을 삭제하시겠습니까?')) return
    
    try {
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setHospitals(prev => prev.filter(hospital => hospital.id !== hospitalId))
      
      toast({
        title: '삭제 완료',
        description: '병원이 성공적으로 삭제되었습니다.'
      })
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '병원 삭제 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  // 필터링된 병원 목록
  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || hospital.type === selectedType
    const matchesStatus = selectedStatus === 'all' || hospital.status === selectedStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  // 병원 유형 표시
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'clinic':
        return <Badge variant="outline">일반의원</Badge>
      case 'korean_medicine':
        return <Badge variant="outline">한의원</Badge>
      case 'hospital':
        return <Badge variant="outline">병원</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  // 상태 표시
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">승인됨</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">정지됨</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 구독 플랜 표시
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case '1month':
        return <Badge className="bg-blue-100 text-blue-800">1개월</Badge>
      case '6months':
        return <Badge className="bg-purple-100 text-purple-800">6개월</Badge>
      case '12months':
        return <Badge className="bg-green-100 text-green-800">12개월</Badge>
      default:
        return <Badge variant="outline">{plan}</Badge>
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchHospitals()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">병원 관리</h2>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="병원명, 원장명, 이메일 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">모든 유형</option>
              <option value="clinic">일반의원</option>
              <option value="korean_medicine">한의원</option>
              <option value="hospital">병원</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">모든 상태</option>
              <option value="approved">승인됨</option>
              <option value="pending">대기중</option>
              <option value="suspended">정지됨</option>
            </select>

            {/* Refresh Button */}
            <Button onClick={fetchHospitals} disabled={loading} className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>새로고침</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">병원 목록을 불러오는 중...</p>
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">조건에 맞는 병원이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredHospitals.map((hospital) => (
                <Card key={hospital.id}>
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{hospital.name}</h3>
                        <div className="flex items-center space-x-2 mb-3">
                          {getTypeBadge(hospital.type)}
                          {getStatusBadge(hospital.status)}
                          {getPlanBadge(hospital.subscription_plan)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {hospital.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(hospital.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(hospital.id, 'suspended')}
                            >
                              거절
                            </Button>
                          </>
                        )}
                        
                        {hospital.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(hospital.id, 'suspended')}
                          >
                            정지
                          </Button>
                        )}
                        
                        {hospital.status === 'suspended' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(hospital.id, 'approved')}
                          >
                            복구
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteHospital(hospital.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span>원장: {hospital.owner_name} ({hospital.email})</span>
                      </div>
                      
                      {hospital.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{hospital.phone}</span>
                        </div>
                      )}
                      
                      {hospital.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{hospital.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span>가입일: {new Date(hospital.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {hospital.subscription_expires_at && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>구독 만료: {new Date(hospital.subscription_expires_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {hospital.status === 'approved' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                            <span>월 매출: ₩{hospital.monthly_revenue?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-blue-600" />
                            <span>고객 수: {hospital.customer_count || 0}명</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 {filteredHospitals.length}개 병원 (전체 {hospitals.length}개)
            </p>
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HospitalManagementModal