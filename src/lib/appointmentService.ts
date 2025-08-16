/**
 * 예약 관리 서비스
 */
import { supabase } from './supabase'
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest, AppointmentFilters, TimeSlot } from '@/types/appointment'
import { withTimeout } from './timeoutUtils'

class AppointmentService {
  /**
   * 예약 목록 조회
   */
  async getAppointments(filters: AppointmentFilters = {}): Promise<Appointment[]> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(id, name, phone, email),
          doctor:doctors(id, hospital_name)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      // 필터 적용
      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId)
      }
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('appointment_date', filters.dateTo)
      }

      const { data, error } = await withTimeout(query, 10000)

      if (error) throw error

      return data?.map(this.mapAppointmentData) || []
    } catch (error) {
      console.error('예약 목록 조회 실패:', error)
      throw error
    }
  }

  /**
   * 예약 상세 조회
   */
  async getAppointment(id: string): Promise<Appointment | null> {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('appointments')
          .select(`
            *,
            customer:customers(id, name, phone, email),
            doctor:doctors(id, hospital_name)
          `)
          .eq('id', id)
          .single(),
        5000
      )

      if (error) throw error

      return data ? this.mapAppointmentData(data) : null
    } catch (error) {
      console.error('예약 상세 조회 실패:', error)
      throw error
    }
  }

  /**
   * 예약 생성
   */
  async createAppointment(request: CreateAppointmentRequest): Promise<Appointment> {
    try {
      // 시간 중복 확인
      const isAvailable = await this.checkTimeSlotAvailability(
        request.doctorId,
        request.appointmentDate,
        request.appointmentTime
      )

      if (!isAvailable) {
        throw new Error('선택한 시간에 이미 예약이 있습니다')
      }

      const { data, error } = await withTimeout(
        supabase
          .from('appointments')
          .insert({
            customer_id: request.customerId,
            doctor_id: request.doctorId,
            appointment_date: request.appointmentDate,
            appointment_time: request.appointmentTime,
            type: request.type,
            notes: request.notes,
            status: 'scheduled'
          })
          .select(`
            *,
            customer:customers(id, name, phone, email),
            doctor:doctors(id, hospital_name)
          `)
          .single(),
        10000
      )

      if (error) throw error

      return this.mapAppointmentData(data)
    } catch (error) {
      console.error('예약 생성 실패:', error)
      throw error
    }
  }

  /**
   * 예약 수정
   */
  async updateAppointment(id: string, request: UpdateAppointmentRequest): Promise<Appointment> {
    try {
      // 시간 변경 시 중복 확인
      if (request.appointmentDate && request.appointmentTime) {
        const currentAppointment = await this.getAppointment(id)
        if (!currentAppointment) {
          throw new Error('예약을 찾을 수 없습니다')
        }

        const isAvailable = await this.checkTimeSlotAvailability(
          currentAppointment.doctorId,
          request.appointmentDate,
          request.appointmentTime,
          id
        )

        if (!isAvailable) {
          throw new Error('선택한 시간에 이미 예약이 있습니다')
        }
      }

      const updateData: any = {}
      if (request.appointmentDate) updateData.appointment_date = request.appointmentDate
      if (request.appointmentTime) updateData.appointment_time = request.appointmentTime
      if (request.status) updateData.status = request.status
      if (request.type) updateData.type = request.type
      if (request.notes !== undefined) updateData.notes = request.notes

      const { data, error } = await withTimeout(
        supabase
          .from('appointments')
          .update(updateData)
          .eq('id', id)
          .select(`
            *,
            customer:customers(id, name, phone, email),
            doctor:doctors(id, hospital_name)
          `)
          .single(),
        10000
      )

      if (error) throw error

      return this.mapAppointmentData(data)
    } catch (error) {
      console.error('예약 수정 실패:', error)
      throw error
    }
  }

  /**
   * 예약 취소
   */
  async cancelAppointment(id: string): Promise<void> {
    try {
      const { error } = await withTimeout(
        supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', id),
        5000
      )

      if (error) throw error
    } catch (error) {
      console.error('예약 취소 실패:', error)
      throw error
    }
  }

  /**
   * 시간대 가용성 확인
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
        .eq('appointment_date', date)
        .eq('appointment_time', time)
        .neq('status', 'cancelled')

      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId)
      }

      const { data, error } = await withTimeout(query, 5000)

      if (error) throw error

      return !data || data.length === 0
    } catch (error) {
      console.error('시간대 확인 실패:', error)
      return false
    }
  }

  /**
   * 특정 날짜의 시간대 목록 조회
   */
  async getTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    try {
      // 기본 시간대 (9:00 - 18:00, 30분 간격)
      const timeSlots: TimeSlot[] = []
      
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          timeSlots.push({
            time,
            available: true
          })
        }
      }

      // 예약된 시간대 확인
      const { data: appointments, error } = await withTimeout(
        supabase
          .from('appointments')
          .select('appointment_time, id')
          .eq('doctor_id', doctorId)
          .eq('appointment_date', date)
          .neq('status', 'cancelled'),
        5000
      )

      if (error) throw error

      // 예약된 시간대 표시
      if (appointments) {
        appointments.forEach(appointment => {
          const slot = timeSlots.find(s => s.time === appointment.appointment_time)
          if (slot) {
            slot.available = false
            slot.appointmentId = appointment.id
          }
        })
      }

      return timeSlots
    } catch (error) {
      console.error('시간대 조회 실패:', error)
      return []
    }
  }

  /**
   * 데이터 매핑 헬퍼
   */
  private mapAppointmentData(data: any): Appointment {
    return {
      id: data.id,
      customerId: data.customer_id,
      doctorId: data.doctor_id,
      appointmentDate: data.appointment_date,
      appointmentTime: data.appointment_time,
      status: data.status,
      type: data.type,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      customer: data.customer ? {
        id: data.customer.id,
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email
      } : undefined,
      doctor: data.doctor ? {
        id: data.doctor.id,
        name: data.doctor.hospital_name,
        hospitalName: data.doctor.hospital_name
      } : undefined
    }
  }
}

export const appointmentService = new AppointmentService()
export default appointmentService