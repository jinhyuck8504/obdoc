'use client'

import React, { useState, useEffect } from 'react'
import { X, Users, Search, Trash2, UserCheck, UserX } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  name: string
  role: 'doctor' | 'customer' | 'admin'
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  hospital_name?: string
  created_at: string
  last_login?: string
}

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // 사용자 목록 조회
  const fetchUsers = async () => {
    setLoading(true)
    try {
      console.log('Fetching users from API...')
      const response = await fetch('/api/admin/users')
      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API Result:', result)
      
      if (result.success) {
        setUsers(result.data)
      } else {
        throw new Error(result.error || 'API returned error')
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '사용자 목록을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 사용자 상태 변경
  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus as any } : user
      ))
      
      toast({
        title: '상태 변경 완료',
        description: '사용자 상태가 성공적으로 변경되었습니다.'
      })
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '상태 변경 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  // 사용자 삭제
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('정말로 이 사용자를 삭제하시겠습니까?')) return
    
    try {
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUsers(prev => prev.filter(user => user.id !== userId))
      
      toast({
        title: '삭제 완료',
        description: '사용자가 성공적으로 삭제되었습니다.'
      })
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '사용자 삭제 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.hospital_name && user.hospital_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  // 상태 아이콘 및 색상
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />승인됨</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />대기중</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />거절됨</Badge>
      case 'suspended':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />정지됨</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 역할 표시
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'doctor':
        return <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />의사</Badge>
      case 'customer':
        return <Badge variant="outline"><Users className="h-3 w-3 mr-1" />고객</Badge>
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="h-3 w-3 mr-1" />관리자</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">사용자 관리</h2>
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
                placeholder="이름, 이메일, 병원명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">모든 역할</option>
              <option value="doctor">의사</option>
              <option value="customer">고객</option>
              <option value="admin">관리자</option>
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
              <option value="rejected">거절됨</option>
              <option value="suspended">정지됨</option>
            </select>

            {/* Refresh Button */}
            <Button onClick={fetchUsers} disabled={loading} className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>새로고침</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">사용자 목록을 불러오는 중...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">조건에 맞는 사용자가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{user.name}</h3>
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>이메일: {user.email}</p>
                          {user.hospital_name && <p>병원: {user.hospital_name}</p>}
                          <p>가입일: {new Date(user.created_at).toLocaleDateString()}</p>
                          {user.last_login && (
                            <p>최근 로그인: {new Date(user.last_login).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Status Change Buttons */}
                        {user.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(user.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(user.id, 'rejected')}
                            >
                              거절
                            </Button>
                          </>
                        )}
                        
                        {user.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(user.id, 'suspended')}
                          >
                            정지
                          </Button>
                        )}
                        
                        {user.status === 'suspended' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'approved')}
                          >
                            복구
                          </Button>
                        )}
                        
                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
              총 {filteredUsers.length}명의 사용자 (전체 {users.length}명)
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

export default UserManagementModal