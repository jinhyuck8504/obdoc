import { supabase } from './supabase'
import { Appointment, AppointmentFormData, TimeSlot } from '@/types/appointment'

/**
 * 예약 서비스 - 프로덕션 최적화 버전
 * 모든 더미 데이터 제거, 실제 데이터베이스 연동만 유지
 */
export const appointmentService = {
  /**
   * 예약 목록 조회 (실제 데이터베이스에서만)
   */
  async getAppointments(doctorId?: string, date?: string): Promise<Appointment[]> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          customers!inner(name, phone),
          doctors(hospital_name, full_name)
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (doctorId) {
        query = query.eq('doctor_id', doctorId)
      }

      if (date) {
        query = query.eq('date', date)
      }

      const { data, error } = await query

      if (error) {
        console.error('예약 목록 조회 실패:', error)
        throw new Error(`예약 목록 조회 실패: ${error.message}`)
      }

      return data?.map((apt: any) => ({
        id: apt.id,
        customerId: apt.customer_id,
        doctorId: apt.doctor_id,
        customerName: apt.customers?.name || '알 수 없음',
        customerPhone: apt.customers?.phone || '',
        doctorName: apt.doctors?.full_name || apt.doctors?.hospital_name || '의사',
        date: apt.date,
        time: apt.time,
        duration: apt.duration || 30,
        type: apt.type,
        status: apt.status,
        notes: apt.notes,
        symptoms: apt.symptoms,
        diagnosis: apt.diagnosis,
        treatment: apt.treatment,
        nextAppointment: apt.next_appointment,
        createdAt: apt.created_at,
        updatedAt: apt.updated_at
      })) || []
    } catch (error) {
      console.error('예약 목록 조회 중 오류:', error)
      // 프로덕션에서는 빈 배열 반환으로 안정성 확보
      return []
    }
  },

  /**
   * 고객별 예약 조회
   */
  async getCustomerAppointments(customerId: string): Promise<Appointment[]> {
    if (!customerId) {
      console.warn('고객 ID가 제공되지 않았습니다')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors(hospital_name, full_name)
        `)
        .eq('customer_id', customerId)
        .order('date', { ascending: false })
        .order('time', { ascending: true })

      if (error) {
        console.error('고객 예약 조회 실패:', error)
        return []
      }

      return data?.map((apt: any) => ({
        id: apt.id,
        customerId: apt.customer_id,
        doctorId: apt.doctor_id,
        customerName: '나', // 고객 본인
        customerPhone: '',
        doctorName: apt.doctors?.full_name || apt.doctors?.hospital_name || '의사',
        date: apt.date,
        time: apt.time,
        duration: apt.duration || 30,
        type: apt.type,
        status: apt.status,
        notes: apt.notes,
        symptoms: apt.symptoms,
        diagnosis: apt.diagnosis,
        treatment: apt.treatment,
        nextAppointment: apt.next_appointment,
        createdAt: apt.created_at,
        updatedAt: apt.updated_at
      })) || []
    } catch (error) {
      console.error('고객 예약 조회 중 오류:', error)
      return []
    }
  },

  /**
   * 특정 예약 조회
   */
  async getAppointment(id: string): Promise<Appointment | null> {
    if (!id) {
      console.warn('예약 ID가 제공되지 않았습니다')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customers(name, phone),
          doctors(hospital_name, full_name)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 데이터가 없는 경우
          return null
        }
        console.error('예약 정보 조회 실패:', error)
        throw new Error(`예약 정보 조회 실패: ${error.message}`)
      }

      return {
        id: data.id,
        customerId: data.customer_id,
        doctorId: data.doctor_id,
        customerName: data.customers?.name || '알 수 없음',
        customerPhone: data.customers?.phone || '',
        doctorName: data.doctors?.full_name || data.doctors?.hospital_name || '의사',
        date: data.date,
        time: data.time,
        duration: data.duration || 30,
        type: data.type,
        status: data.status,
        notes: data.notes,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        nextAppointment: data.next_appointment,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('예약 정보 조회 중 오류:', error)
      return null
    }
  },

  /**
   * 예약 생성
   */
  async createAppointment(appointmentData: AppointmentFormData & { doctorId: string }): Promise<Appointment> {
    try {
      // 필수 필드 검증
      if (!appointmentData.customerId || !appointmentData.doctorId || !appointmentData.date || !appointmentData.time) {
        throw new Error('고객 ID, 의사 ID, 날짜, 시간은 필수 입력 항목입니다')
      }

      // 시간 중복 확인
      const existingAppointment = await this.checkTimeSlotAvailability(
        appointmentData.doctorId,
        appointmentData.date,
        appointmentData.time
      )

      if (!existingAppointment) {
        throw new Error('선택한 시간에 이미 예약이 있습니다')
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          customer_id: appointmentData.customerId,
          doctor_id: appointmentData.doctorId,
          date: appointmentData.date,
          time: appointmentData.time,
          duration: appointmentData.duration || 30,
          type: appointmentData.type,
          status: 'scheduled',
          notes: appointmentData.notes,
          symptoms: appointmentData.symptoms,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          customers(name, phone),
          doctors(hospital_name, full_name)
        `)
        .single()

      if (error) {
        console.error('예약 생성 실패:', error)
        throw new Error(`예약 생성 실패: ${error.message}`)
      }

      console.log('예약 생성 성공:', data.id)
      return {
        id: data.id,
        customerId: data.customer_id,
        doctorId: data.doctor_id,
        customerName: data.customers?.name || '알 수 없음',
        customerPhone: data.customers?.phone || '',
        doctorName: data.doctors?.full_name || data.doctors?.hospital_name || '의사',
        date: data.date,
        time: data.time,
        duration: data.duration || 30,
        type: data.type,
        status: data.status,
        notes: data.notes,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        nextAppointment: data.next_appointment,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('예약 생성 중 오류:', error)
      throw error
    }
  },

  /**
   * 예약 수정
   */
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    if (!id) {
      throw new Error('예약 ID가 필요합니다')
    }

    try {
      // 기존 예약 존재 확인
      const existingAppointment = await this.getAppointment(id)
      if (!existingAppointment) {
        throw new Error('수정할 예약을 찾을 수 없습니다')
      }

      // 시간 변경 시 중복 확인
      if (updates.date || updates.time) {
        const newDate = updates.date || existingAppointment.date
        const newTime = updates.time || existingAppointment.time
        
        if (newDate !== existingAppointment.date || newTime !== existingAppointment.time) {
          const isAvailable = await this.checkTimeSlotAvailability(
            existingAppointment.doctorId,
            newDate,
            newTime,
            id // 현재 예약 제외
          )
          
          if (!isAvailable) {
            throw new Error('선택한 시간에 이미 다른 예약이 있습니다')
          }
        }
      }

      const { data, error } = await supabase
        .from('appointments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          customers(name, phone),
          doctors(hospital_name, full_name)
        `)
        .single()

      if (error) {
        console.error('예약 수정 실패:', error)
        throw new Error(`예약 수정 실패: ${error.message}`)
      }

      console.log('예약 수정 성공:', data.id)
      return {
        id: data.id,
        customerId: data.customer_id,
        doctorId: data.doctor_id,
        customerName: data.customers?.name || '알 수 없음',
        customerPhone: data.customers?.phone || '',
        doctorName: data.doctors?.full_name || data.doctors?.hospital_name || '의사',
        date: data.date,
        time: data.time,
        duration: data.duration || 30,
        type: data.type,
        status: data.status,
        notes: data.notes,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        nextAppointment: data.next_appointment,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('예약 수정 중 오류:', error)
      throw error
    }
  },

  /**
   * 예약 삭제
   */
  async deleteAppointment(id: string): Promise<void> {
    if (!id) {
      throw new Error('예약 ID가 필요합니다')
    }

    try {
      // 기존 예약 존재 확인
      const existingAppointment = await this.getAppointment(id)
      if (!existingAppointment) {
        throw new Error('삭제할 예약을 찾을 수 없습니다')
      }

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('예약 삭제 실패:', error)
        throw new Error(`예약 삭제 실패: ${error.message}`)
      }

      console.log('예약 삭제 성공:', id)
    } catch (error) {
      console.error('예약 삭제 중 오류:', error)
      throw error
    }
  },

  /**
   * 특정 날짜의 시간대 조회
   */
  async getTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    if (!doctorId || !date) {
      return []
    }

    try {
      const appointments = await this.getAppointments(doctorId, date)
      
      // 9:00 ~ 18:00, 30분 간격으로 시간대 생성
      const timeSlots: TimeSlot[] = []
      const startHour = 9
      const endHour = 18
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          const appointment = appointments.find(apt => 
            apt.time === time && apt.status !== 'cancelled'
          )
          
          timeSlots.push({
            time,
            available: !appointment,
            appointmentId: appointment?.id
          })
        }
      }
      
      return timeSlots
    } catch (error) {
      console.error('시간대 조회 중 오류:', error)
      return []
    }
  },

  /**
   * 시간대 사용 가능 여부 확인
   */
  async checkTimeSlotAvailability(
    doctorId: string, 
    date: string, 
    time: string, 
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('date', date)
        .eq('time', time)
        .neq('status', 'cancelled')

      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId)
      }

      const { data, error } = await query

      if (error) {
        console.error('시간대 확인 실패:', error)
        return false
      }

      return !data || data.length === 0
    } catch (error) {
      console.error('시간대 확인 중 오류:', error)
      return false
    }
  },

  /**
   * 예약 검색
   */
  async searchAppointments(query: string, doctorId?: string): Promise<Appointment[]> {
    if (!query || query.trim().length === 0) {
      return []
    }

    try {
      const searchTerm = query.trim()
      let queryBuilder = supabase
        .from('appointments')
        .select(`
          *,
          customers(name, phone),
          doctors(hospital_name, full_name)
        `)

      if (doctorId) {
        queryBuilder = queryBuilder.eq('doctor_id', doctorId)
      }

      // 고객명, 전화번호, 증상, 메모에서 검색
      queryBuilder = queryBuilder.or(`
        customers.name.ilike.%${searchTerm}%,
        customers.phone.ilike.%${searchTerm}%,
        symptoms.ilike.%${searchTerm}%,
        notes.ilike.%${searchTerm}%
      `)

      const { data, error } = await queryBuilder
        .order('date', { ascending: false })
        .order('time', { ascending: true })
        .limit(50) // 검색 결과 제한

      if (error) {
        console.error('예약 검색 실패:', error)
        throw new Error(`예약 검색 실패: ${error.message}`)
      }

      return data?.map((apt: any) => ({
        id: apt.id,
        customerId: apt.customer_id,
        doctorId: apt.doctor_id,
        customerName: apt.customers?.name || '알 수 없음',
        customerPhone: apt.customers?.phone || '',
        doctorName: apt.doctors?.full_name || apt.doctors?.hospital_name || '의사',
        date: apt.date,
        time: apt.time,
        duration: apt.duration || 30,
        type: apt.type,
        status: apt.status,
        notes: apt.notes,
        symptoms: apt.symptoms,
        diagnosis: apt.diagnosis,
        treatment: apt.treatment,
        nextAppointment: apt.next_appointment,
        createdAt: apt.created_at,
        updatedAt: apt.updated_at
      })) || []
    } catch (error) {
      console.error('예약 검색 중 오류:', error)
      return []
    }
  },

  /**
   * 오늘 예약 목록 조회
   */
  async getTodayAppointments(doctorId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getAppointments(doctorId, today)
  },

  /**
   * 예약 상태별 개수 조회
   */
  async getAppointmentCountByStatus(doctorId?: string): Promise<Record<string, number>> {
    try {
      let query = supabase
        .from('appointments')
        .select('status')

      if (doctorId) {
        query = query.eq('doctor_id', doctorId)
      }

      const { data, error } = await query

      if (error) {
        console.error('예약 상태별 개수 조회 실패:', error)
        return {}
      }

      const counts: Record<string, number> = {}
      data?.forEach(apt => {
        counts[apt.status] = (counts[apt.status] || 0) + 1
      })

      return counts
    } catch (error) {
      console.error('예약 상태별 개수 조회 중 오류:', error)
      return {}
    }
  },

  /**
   * 최근 예약 목록 조회
   */
  async getRecentAppointments(limit: number = 5, doctorId?: string): Promise<Appointment[]> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          customers(name, phone),
          doctors(hospital_name, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (doctorId) {
        query = query.eq('doctor_id', doctorId)
      }

      const { data, error } = await query

      if (error) {
        console.error('최근 예약 조회 실패:', error)
        return []
      }

      return data?.map((apt: any) => ({
        id: apt.id,
        customerId: apt.customer_id,
        doctorId: apt.doctor_id,
        customerName: apt.customers?.name || '알 수 없음',
        customerPhone: apt.customers?.phone || '',
        doctorName: apt.doctors?.full_name || apt.doctors?.hospital_name || '의사',
        date: apt.date,
        time: apt.time,
        duration: apt.duration || 30,
        type: apt.type,
        status: apt.status,
        notes: apt.notes,
        symptoms: apt.symptoms,
        diagnosis: apt.diagnosis,
        treatment: apt.treatment,
        nextAppointment: apt.next_appointment,
        createdAt: apt.created_at,
        updatedAt: apt.updated_at
      })) || []
    } catch (error) {
      console.error('최근 예약 조회 중 오류:', error)
      return []
    }
  }
}