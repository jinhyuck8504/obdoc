/**
 * 예약 관련 타입 정의
 */

export interface Appointment {
  id: string
  customerId: string
  doctorId: string
  appointmentDate: string
  appointmentTime: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  type: 'consultation' | 'follow_up' | 'check_up' | 'emergency'
  notes?: string
  createdAt: string
  updatedAt: string
  
  // 관계 데이터
  customer?: {
    id: string
    name: string
    phone?: string
    email?: string
  }
  doctor?: {
    id: string
    name: string
    hospitalName: string
  }
}

export interface AppointmentFormData {
  customerId: string
  date: string
  time: string
  duration: number
  type: Appointment['type']
  notes?: string
  symptoms?: string
}

export interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

export interface CreateAppointmentRequest {
  customerId: string
  doctorId: string
  appointmentDate: string
  appointmentTime: string
  type: Appointment['type']
  notes?: string
}

export interface UpdateAppointmentRequest {
  appointmentDate?: string
  appointmentTime?: string
  status?: Appointment['status']
  type?: Appointment['type']
  notes?: string
}

export interface AppointmentFilters {
  doctorId?: string
  customerId?: string
  status?: Appointment['status']
  type?: Appointment['type']
  dateFrom?: string
  dateTo?: string
}

export interface TimeSlot {
  time: string
  available: boolean
  appointmentId?: string
}