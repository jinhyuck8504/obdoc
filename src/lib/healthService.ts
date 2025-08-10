import { WeightRecord, HealthMetrics, WeightFormData, GoalFormData } from '@/types/health'
import { supabase } from './supabase'

// 개발 환경 체크
const isDevelopment = process.env.NODE_ENV === 'development'
const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_url_here')

// Mock 데이터 저장소 (개발 모드용)
let mockWeightRecords: WeightRecord[] = [
  {
    id: '1',
    customerId: 'patient-1',
    weight: 70,
    date: '2024-01-01',
    note: '시작 체중',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    customerId: 'patient-1',
    weight: 69.2,
    date: '2024-01-07',
    note: '첫 주 결과',
    createdAt: '2024-01-07T00:00:00Z',
    updatedAt: '2024-01-07T00:00:00Z'
  },
  {
    id: '3',
    customerId: 'patient-1',
    weight: 68.1,
    date: '2024-01-14',
    note: '꾸준한 감소',
    createdAt: '2024-01-14T00:00:00Z',
    updatedAt: '2024-01-14T00:00:00Z'
  },
  {
    id: '4',
    customerId: 'patient-1',
    weight: 66.8,
    date: '2024-01-21',
    note: '목표 달성 중',
    createdAt: '2024-01-21T00:00:00Z',
    updatedAt: '2024-01-21T00:00:00Z'
  },
  {
    id: '5',
    customerId: 'patient-1',
    weight: 65.5,
    date: '2024-01-28',
    note: '좋은 진전',
    createdAt: '2024-01-28T00:00:00Z',
    updatedAt: '2024-01-28T00:00:00Z'
  },
  {
    id: '6',
    customerId: 'patient-1',
    weight: 65.2,
    date: '2024-02-04',
    note: '거의 목표 달성',
    createdAt: '2024-02-04T00:00:00Z',
    updatedAt: '2024-02-04T00:00:00Z'
  },
  {
    id: '7',
    customerId: 'patient-1',
    weight: 65.1,
    date: '2024-02-11',
    note: '목표 근접',
    createdAt: '2024-02-11T00:00:00Z',
    updatedAt: '2024-02-11T00:00:00Z'
  },
  {
    id: '8',
    customerId: 'patient-1',
    weight: 65,
    date: '2024-02-18',
    note: '목표 달성!',
    createdAt: '2024-02-18T00:00:00Z',
    updatedAt: '2024-02-18T00:00:00Z'
  }
]

interface WeightGoal {
  id: string
  patientId: string
  initialWeight: number
  targetWeight: number
  currentWeight: number
  targetDate?: string
  createdAt: string
  updatedAt: string
}

let mockWeightGoals: WeightGoal[] = [
  {
    id: '1',
    patientId: 'patient-1',
    initialWeight: 70,
    targetWeight: 60,
    currentWeight: 65,
    targetDate: '2024-06-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-18T00:00:00Z'
  }
]

// 고객의 체중 기록 조회
export async function getWeightRecords(customerId: string): Promise<WeightRecord[]> {
  if (isDevelopment && isDummySupabase) {
    // 개발 모드에서는 더미 데이터 반환
    console.log('개발 모드: 더미 체중 기록 데이터 사용')
    return new Promise((resolve) => {
      setTimeout(() => {
        const records = mockWeightRecords
          .filter(record => record.customerId === customerId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        resolve(records)
      }, 500)
    })
  }

  try {
    const { data, error } = await supabase
      .from('weight_records')
      .select('*')
      .eq('patient_id', customerId)
      .order('date', { ascending: true })

    if (error) throw error

    return data?.map(record => ({
      id: record.id,
      customerId: record.patient_id,
      weight: record.weight,
      date: record.date,
      note: record.note,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    })) || []
  } catch (error) {
    console.error('체중 기록 조회 실패:', error)
    throw error
  }
}

// 고객의 목표 조회
export async function getWeightGoal(customerId: string): Promise<WeightGoal | null> {
  if (isDevelopment && isDummySupabase) {
    // 개발 모드에서는 더미 데이터 반환
    console.log('개발 모드: 더미 목표 데이터 사용')
    return new Promise((resolve) => {
      setTimeout(() => {
        const goal = mockWeightGoals.find(goal => goal.patientId === customerId)
        resolve(goal || null)
      }, 300)
    })
  }

  try {
    const { data, error } = await supabase
      .from('weight_goals')
      .select('*')
      .eq('patient_id', customerId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned

    if (!data) return null

    return {
      id: data.id,
      patientId: data.patient_id,
      initialWeight: data.initial_weight,
      targetWeight: data.target_weight,
      currentWeight: data.current_weight,
      targetDate: data.target_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('목표 조회 실패:', error)
    return null
  }
}

// 체중 기록 추가
export async function addWeightRecord(customerId: string, data: WeightFormData): Promise<WeightRecord> {
  if (isDevelopment && isDummySupabase) {
    // 개발 모드에서는 더미 데이터에 추가
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRecord: WeightRecord = {
          id: Date.now().toString(),
          customerId,
          weight: data.weight,
          date: data.date,
          note: data.note,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        mockWeightRecords.push(newRecord)
        
        // 현재 체중 업데이트
        const goalIndex = mockWeightGoals.findIndex(goal => goal.patientId === customerId)
        if (goalIndex !== -1) {
          mockWeightGoals[goalIndex].currentWeight = data.weight
          mockWeightGoals[goalIndex].updatedAt = new Date().toISOString()
        }
        
        console.log('개발 모드: 체중 기록 추가 완료', newRecord)
        resolve(newRecord)
      }, 800)
    })
  }

  try {
    const { data: record, error } = await supabase
      .from('weight_records')
      .insert([{
        patient_id: customerId,
        weight: data.weight,
        date: data.date,
        note: data.note
      }])
      .select()
      .single()

    if (error) throw error

    // 목표의 현재 체중도 업데이트
    await supabase
      .from('weight_goals')
      .update({ 
        current_weight: data.weight,
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', customerId)

    return {
      id: record.id,
      customerId: record.patient_id,
      weight: record.weight,
      date: record.date,
      note: record.note,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }
  } catch (error) {
    console.error('체중 기록 추가 실패:', error)
    throw error
  }
}

// 체중 기록 수정
export async function updateWeightRecord(recordId: string, data: WeightFormData): Promise<WeightRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const recordIndex = mockWeightRecords.findIndex(record => record.id === recordId)
      if (recordIndex === -1) {
        reject(new Error('기록을 찾을 수 없습니다'))
        return
      }

      mockWeightRecords[recordIndex] = {
        ...mockWeightRecords[recordIndex],
        weight: data.weight,
        date: data.date,
        note: data.note,
        updatedAt: new Date().toISOString()
      }

      resolve(mockWeightRecords[recordIndex])
    }, 800)
  })
}

// 체중 기록 삭제
export async function deleteWeightRecord(recordId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const recordIndex = mockWeightRecords.findIndex(record => record.id === recordId)
      if (recordIndex === -1) {
        reject(new Error('기록을 찾을 수 없습니다'))
        return
      }

      mockWeightRecords.splice(recordIndex, 1)
      resolve()
    }, 500)
  })
}

// 목표 설정/수정
export async function updateWeightGoal(customerId: string, data: GoalFormData): Promise<WeightGoal> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const goalIndex = mockWeightGoals.findIndex(goal => goal.patientId === customerId)
      
      if (goalIndex !== -1) {
        // 기존 목표 수정
        mockWeightGoals[goalIndex] = {
          ...mockWeightGoals[goalIndex],
          targetWeight: data.targetWeight,
          targetDate: data.targetDate,
          updatedAt: new Date().toISOString()
        }
        resolve(mockWeightGoals[goalIndex])
      } else {
        // 새 목표 생성
        const newGoal: WeightGoal = {
          id: Date.now().toString(),
          patientId: customerId,
          initialWeight: 80, // 실제로는 첫 번째 기록에서 가져와야 함
          targetWeight: data.targetWeight,
          currentWeight: 72.5, // 실제로는 최신 기록에서 가져와야 함
          targetDate: data.targetDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        mockWeightGoals.push(newGoal)
        resolve(newGoal)
      }
    }, 800)
  })
}

// 건강 지표 계산
export function calculateHealthMetrics(
  weightRecords: WeightRecord[], 
  goal: WeightGoal | null, 
  height: number
): HealthMetrics {
  if (!goal || weightRecords.length === 0) {
    return {
      customerId: '',
      currentWeight: 0,
      targetWeight: 0,
      initialWeight: 0,
      weightLoss: 0,
      progress: 0,
      remainingWeight: 0,
      bmi: 0,
      targetBMI: 0,
      height,
      lastUpdated: new Date().toISOString()
    }
  }

  const currentWeight = goal.currentWeight
  const targetWeight = goal.targetWeight
  const initialWeight = goal.initialWeight
  
  const weightLoss = initialWeight - currentWeight
  const totalLossNeeded = initialWeight - targetWeight
  const progress = Math.max(0, Math.min(100, (weightLoss / totalLossNeeded) * 100))
  const remainingWeight = Math.max(0, currentWeight - targetWeight)
  
  const bmi = currentWeight / Math.pow(height / 100, 2)
  const targetBMI = targetWeight / Math.pow(height / 100, 2)

  return {
    customerId: goal.patientId,
    currentWeight,
    targetWeight,
    initialWeight,
    weightLoss,
    progress,
    remainingWeight,
    bmi,
    targetBMI,
    height,
    lastUpdated: goal.updatedAt
  }
}

// 기간별 체중 변화 계산
export function getWeightChange(weightRecords: WeightRecord[], days: number = 7): {
  change: number
  trend: 'up' | 'down' | 'stable'
} {
  if (weightRecords.length < 2) {
    return { change: 0, trend: 'stable' }
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const recentRecords = weightRecords
    .filter(record => new Date(record.date) >= cutoffDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (recentRecords.length < 2) {
    // 최근 기록이 부족하면 전체에서 최근 2개 비교
    const recent = weightRecords[weightRecords.length - 1]
    const previous = weightRecords[weightRecords.length - 2]
    const change = recent.weight - previous.weight
    
    return {
      change: Math.abs(change),
      trend: change < -0.1 ? 'down' : change > 0.1 ? 'up' : 'stable'
    }
  }

  const recent = recentRecords[recentRecords.length - 1]
  const previous = recentRecords[0]
  const change = recent.weight - previous.weight

  return {
    change: Math.abs(change),
    trend: change < -0.1 ? 'down' : change > 0.1 ? 'up' : 'stable'
  }
}