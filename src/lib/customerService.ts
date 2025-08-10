import { supabase } from './supabase'
import { Customer } from '@/types/customer'

// 개발 환경 체크
const isDevelopment = process.env.NODE_ENV === 'development'
const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_url_here')

// 더미 고객 데이터
const dummyCustomers: Customer[] = [
  {
    id: 'customer-1',
    name: '김고객',
    email: 'patient1@example.com',
    phone: '010-1234-5678',
    dateOfBirth: '1990-05-15',
    gender: 'female',
    height: 165,
    initialWeight: 70,
    currentWeight: 65,
    targetWeight: 60,
    address: '서울시 강남구 테헤란로 123',
    status: 'active',
    startDate: '2024-01-15',
    lastVisit: '2024-01-20',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: 'customer-2',
    name: '이고객',
    email: 'patient2@example.com',
    phone: '010-9876-5432',
    dateOfBirth: '1985-08-22',
    gender: 'male',
    height: 175,
    initialWeight: 85,
    currentWeight: 78,
    targetWeight: 70,
    address: '서울시 서초구 강남대로 456',
    status: 'active',
    startDate: '2024-01-10',
    lastVisit: '2024-01-19',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-19T16:45:00Z'
  },
  {
    id: 'customer-3',
    name: '박회원',
    email: 'patient3@example.com',
    phone: '010-5555-7777',
    dateOfBirth: '1992-12-03',
    gender: 'female',
    height: 160,
    initialWeight: 60,
    currentWeight: 50,
    targetWeight: 50,
    address: '서울시 송파구 올림픽로 789',
    status: 'completed',
    startDate: '2024-01-05',
    lastVisit: '2024-01-18',
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-18T12:00:00Z'
  },
  {
    id: 'customer-4',
    name: '최사용자',
    email: 'customer4@example.com',
    phone: '010-3333-4444',
    dateOfBirth: '1988-03-18',
    gender: 'male',
    height: 180,
    initialWeight: 90,
    currentWeight: 90,
    targetWeight: 75,
    address: '서울시 마포구 홍대입구로 321',
    status: 'inactive',
    startDate: '2024-01-20',
    lastVisit: '2024-01-20',
    createdAt: '2024-01-20T13:00:00Z',
    updatedAt: '2024-01-20T13:00:00Z'
  }
]

export const customerService = {
  // 고객 목록 조회
  async getCustomers(): Promise<Customer[]> {
    if (isDevelopment && isDummySupabase) {
      // 개발 모드에서는 더미 데이터 반환
      console.log('개발 모드: 더미 고객 데이터 사용')
      return [...dummyCustomers]
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('고객 목록 조회 실패:', error)
      throw error
    }
  },

  // 고객 상세 정보 조회
  async getCustomer(id: string): Promise<Customer | null> {
    if (isDevelopment && isDummySupabase) {
      // 개발 모드에서는 더미 데이터에서 찾기
      const customer = dummyCustomers.find(p => p.id === id)
      return customer || null
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('고객 정보 조회 실패:', error)
      return null
    }
  },

  // 고객 등록
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    if (isDevelopment && isDummySupabase) {
      // 개발 모드에서는 더미 데이터에 추가
      const newCustomer: Customer = {
        ...customerData,
        id: `customer-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      dummyCustomers.unshift(newCustomer)
      console.log('개발 모드: 고객 등록 완료', newCustomer)
      return newCustomer
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('고객 등록 실패:', error)
      throw error
    }
  },

  // 고객 정보 수정
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    if (isDevelopment && isDummySupabase) {
      // 개발 모드에서는 더미 데이터 수정
      const index = dummyCustomers.findIndex(p => p.id === id)
      if (index === -1) {
        throw new Error('고객을 찾을 수 없습니다')
      }
      
      dummyCustomers[index] = {
        ...dummyCustomers[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      console.log('개발 모드: 고객 정보 수정 완료', dummyCustomers[index])
      return dummyCustomers[index]
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('고객 정보 수정 실패:', error)
      throw error
    }
  },

  // 고객 삭제
  async deleteCustomer(id: string): Promise<void> {
    if (isDevelopment && isDummySupabase) {
      // 개발 모드에서는 더미 데이터에서 제거
      const index = dummyCustomers.findIndex(p => p.id === id)
      if (index === -1) {
        throw new Error('고객을 찾을 수 없습니다')
      }
      
      dummyCustomers.splice(index, 1)
      console.log('개발 모드: 고객 삭제 완료', id)
      return
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('고객 삭제 실패:', error)
      throw error
    }
  },

  // 고객 검색
  async searchCustomers(query: string): Promise<Customer[]> {
    if (isDevelopment && isDummySupabase) {
      // 개발 모드에서는 더미 데이터에서 검색
      const filtered = dummyCustomers.filter(customer => 
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query.toLowerCase()))
      )
      return filtered
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('고객 검색 실패:', error)
      throw error
    }
  },

  // 고객 체중 업데이트
  async updateCustomerWeight(id: string, weight: number): Promise<Customer> {
    const customer = await this.getCustomer(id)
    if (!customer) {
      throw new Error('고객을 찾을 수 없습니다')
    }

    // 진행률 계산
    const progress = Math.min(
      Math.max(
        ((customer.initialWeight - weight) / (customer.initialWeight - customer.targetWeight)) * 100,
        0
      ),
      100
    )

    const updates = {
      currentWeight: weight
    }

    return this.updateCustomer(id, updates)
  }
}