export interface Customer {
  id: string
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
  status: 'active' | 'inactive' | 'completed'
  startDate: string
  lastVisit?: string
  notes?: string
  createdAt: string
  updatedAt: string
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
  targetWeight?: number
  notes?: string
}