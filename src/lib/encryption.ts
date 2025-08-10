// 암호화된 데이터베이스와 연동하기 위한 헬퍼 함수들
import { supabase } from './supabase'

// 암호화된 뷰를 사용하여 데이터 조회
export const encryptedQueries = {
  // 사용자 정보 조회 (복호화된 뷰 사용)
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users_decrypted')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  },

  // 원장 정보 조회 (복호화된 뷰 사용)
  async getDoctor(userId: string) {
    const { data, error } = await supabase
      .from('doctors_decrypted')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  },

  // 고객 정보 조회 (복호화된 뷰 사용)
  async getPatients(doctorId: string) {
    const { data, error } = await supabase
      .from('patients_decrypted')
      .select('*')
      .eq('doctor_id', doctorId)
    
    return { data, error }
  },

  // 관리자용 원장 목록 조회 (복호화된 뷰 + 조인)
  async getDoctorsForAdmin() {
    const { data, error } = await supabase
      .from('doctors_decrypted')
      .select(`
        *,
        users_decrypted!inner(email)
      `)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // 암호화된 데이터 삽입을 위한 헬퍼
  async insertEncryptedUser(userData: {
    id: string
    email?: string
    phone?: string
    role: string
  }) {
    // 암호화 함수를 사용하여 데이터 삽입
    const { data, error } = await supabase.rpc('insert_encrypted_user', {
      user_id: userData.id,
      user_email: userData.email || null,
      user_phone: userData.phone || null,
      user_role: userData.role
    })
    
    return { data, error }
  },

  // 암호화된 고객 데이터 삽입
  async insertEncryptedPatient(patientData: {
    user_id: string
    doctor_id: string
    name: string
    phone?: string
    health_data?: any
  }) {
    const { data, error } = await supabase.rpc('insert_encrypted_patient', {
      p_user_id: patientData.user_id,
      p_doctor_id: patientData.doctor_id,
      p_name: patientData.name,
      p_phone: patientData.phone || null,
      p_health_data: JSON.stringify(patientData.health_data || {})
    })
    
    return { data, error }
  }
}

// 암호화된 데이터 삽입을 위한 RPC 함수들도 데이터베이스에 추가해야 합니다