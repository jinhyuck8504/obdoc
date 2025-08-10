export interface Patient {
  id: string
  name: string
  email?: string
  phone: string
  birthDate: string
  gender: 'male' | 'female'
  height: number
  initialWeight: number
  currentWeight: number
  targetWeight: number
  address?: string
  medicalHistory?: string
  allergies?: string
  medications?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  status: 'active' | 'inactive' | 'completed'
  startDate: string
  lastVisit?: string
  doctorId: string
  createdAt: string
  updatedAt: string
}

export interface PatientFormData {
  name: string
  email?: string
  phone: string
  birthDate: string
  gender: 'male' | 'female'
  height: number
  initialWeight: number
  currentWeight: number
  targetWeight: number
  address?: string
  medicalHistory?: string
  allergies?: string
  medications?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
}

export interface PatientFilters {
  search: string
  status: 'all' | 'active' | 'inactive' | 'completed'
  sortBy: 'name' | 'startDate' | 'lastVisit' | 'progress'
  sortOrder: 'asc' | 'desc'
}