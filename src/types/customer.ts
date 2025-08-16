export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  dateOfBirth?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other'
  height?: number
  initialWeight?: number
  currentWeight?: number
  targetWeight?: number
  status: 'active' | 'inactive' | 'completed'
  startDate: string
  lastVisit?: string
  notes?: string
  createdAt: string
  updatedAt: string
  medicalHistory?: string
  allergies?: string
  medications?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

export interface CustomerFormData {
  name: string
  email: string
  phone: string
  address?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  height?: number
  initialWeight?: number
  currentWeight?: number
  targetWeight?: number
  notes?: string
  birthDate?: string
  medicalHistory?: string
  allergies?: string
  medications?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
}

export interface CustomerFilters {
  search: string
  status: 'all' | 'active' | 'inactive' | 'completed'
  gender: 'all' | 'male' | 'female' | 'other'
  sortBy: 'name' | 'startDate' | 'progress'
  sortOrder: 'asc' | 'desc'
}