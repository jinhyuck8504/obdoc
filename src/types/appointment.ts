export interface Appointment {
  id: string
  customerId: string
  doctorId: string
  customerName: string
  customerPhone: string
  doctorName?: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  duration: number // minutes
  type: 'consultation' | 'follow_up' | 'initial' | 'emergency'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  symptoms?: string
  diagnosis?: string
  treatment?: string
  nextAppointment?: string
  createdAt: string
  updatedAt: string
}

export interface AppointmentFormData {
  customerId: string
  date: string
  time: string
  duration: number
  type: 'consultation' | 'follow_up' | 'initial' | 'emergency'
  notes?: string
  symptoms?: string
}

export interface AppointmentFilters {
  date?: string
  status?: 'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  type?: 'all' | 'consultation' | 'follow_up' | 'initial' | 'emergency'
  customerName?: string
  search?: string
  dateRange?: 'today' | 'week' | 'month'
  sortBy?: 'date' | 'customer' | 'type' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface TimeSlot {
  time: string
  available: boolean
  appointmentId?: string
}

export interface CalendarDay {
  date: string
  appointments: Appointment[]
  isToday: boolean
  isCurrentMonth: boolean
}

export interface AppointmentStats {
  total: number
  scheduled: number
  completed: number
  cancelled: number
  todayAppointments: number
  upcomingAppointments: number
}