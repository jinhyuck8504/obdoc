export interface WeightRecord {
  id: string
  customerId: string
  weight: number
  date: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface WeightFormData {
  weight: number
  date: string
  note?: string
}

export interface GoalFormData {
  targetWeight: number
  targetDate?: string
  notes?: string
}

export interface HealthMetrics {
  customerId: string
  currentWeight: number
  initialWeight: number
  targetWeight: number
  height: number
  bmi: number
  targetBMI: number
  weightLoss: number
  remainingWeight: number
  progress: number
  lastUpdated: string
}

export interface WeightChange {
  change: number
  trend: 'up' | 'down' | 'stable'
  period: string
}