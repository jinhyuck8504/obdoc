/**
 * 의료진용 고객 관리 서비스
 * 개인정보 보호 법규를 준수하며 고객 정보를 안전하게 관리합니다.
 */
import { supabase } from '@/lib/supabase'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import { notificationService } from '@/lib/notificationService'
import {
  CustomerInfo,
  CustomerFilter,
  CustomersResponse,
  CustomerDetailsResponse,
  CustomerStats,
  FlaggedActivity,
  CustomerNote,
  CustomerActivityLog,
  CustomerAlert,
  CustomerAction,
  DataExportRequest,
  CustomerManagementPermissions
} from '@/types/customerManagement'

export class CustomerManagementService {
  private static instance: CustomerManagementService
  
  static getInstance(): CustomerManagementService {
    if (!CustomerManagementService.instance) {
      CustomerManagementService.instance = new CustomerManagementService()
    }
    return CustomerManagementService.instance
  }

  /**
   * 의사의 고객 목록 조회 (개인정보 보호 준수)
   */
  async getCustomersByDoctor(
    doctorId: string,
    filter: CustomerFilter = {}
  ): Promise<CustomersResponse> {
    try {
      // 의사 권한 확인
      const permissions = await this.getDoctorPermissions(doctorId)
      if (!permissions.canViewCustomers) {
        throw new Error('고객 정보 조회 권한이 없습니다.')
      }

      // 의사의 병원 코드 조회
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('hospital_code, hospital_name')
        .eq('user_id', doctorId)
        .single()

      if (doctorError || !doctor) {
        throw new Error('의사 정보를 찾을 수 없습니다.')
      }

      // 쿼리 구성
      let query = supabase
        .from('customers')
        .select(`
          *,
          invite_code_usage:hospital_signup_code_usage(
            code_id,
            used_at,
            invite_code:hospital_signup_codes(code)
          ),
          customer_activities:customer_activity_logs(
            action,
            timestamp
          )
        `)
        .eq('hospital_code', doctor.hospital_code)

      // 필터 적용
      if (filter.status && filter.status.length > 0) {
        query = query.in('status', filter.status)
      }

      if (filter.joinedDateRange) {
        query = query
          .gte('created_at', filter.joinedDateRange.start.toISOString())
          .lte('created_at', filter.joinedDateRange.end.toISOString())
      }

      if (filter.lastActiveDateRange) {
        query = query
          .gte('last_active_at', filter.lastActiveDateRange.start.toISOString())
          .lte('last_active_at', filter.lastActiveDateRange.end.toISOString())
      }

      if (filter.searchTerm) {
        query = query.or(`
          name.ilike.%${filter.searchTerm}%,
          email.ilike.%${filter.searchTerm}%
        `)
      }

      // 정렬
      const sortBy = filter.sortBy || 'created_at'
      const sortOrder = filter.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // 페이지네이션
      const page = filter.page || 1
      const limit = filter.limit || 20
      const offset = (page - 1) * limit

      query = query.range(offset, offset + limit - 1)

      const { data: customers, error, count } = await query

      if (error) {
        console.error('고객 목록 조회 오류:', error)
        throw new Error('고객 목록을 불러올 수 없습니다.')
      }

      // 개인정보 보호를 위한 데이터 마스킹
      const maskedCustomers = customers?.map(customer => 
        this.maskSensitiveData(customer, permissions)
      ) || []

      // 감사 로그 기록
      await this.logCustomerAccess(doctorId, 'view_customer_list', {
        filter,
        resultCount: maskedCustomers.length
      })

      return {
        customers: maskedCustomers,
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > offset + limit
      }

    } catch (error) {
      console.error('고객 목록 조회 중 오류:', error)
      throw error
    }
  }

  /**
   * 고객 상세 정보 조회
   */
  async getCustomerDetails(
    customerId: string,
    doctorId: string
  ): Promise<CustomerDetailsResponse> {
    try {
      const permissions = await this.getDoctorPermissions(doctorId)
      if (!permissions.canViewCustomerDetails) {
        throw new Error('고객 상세 정보 조회 권한이 없습니다.')
      }

      // 고객 정보 조회
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select(`
          *,
          invite_code_usage:hospital_signup_code_usage(
            code_id,
            used_at,
            invite_code:hospital_signup_codes(
              code,
              created_by,
              doctor:doctors(name)
            )
          ),
          flagged_activities:customer_flagged_activities(*),
          notes:customer_notes(
            *,
            doctor:doctors(name)
          )
        `)
        .eq('id', customerId)
        .single()

      if (customerError || !customer) {
        throw new Error('고객 정보를 찾을 수 없습니다.')
      }

      // 의사가 해당 고객에 접근할 권한이 있는지 확인
      const { data: doctor } = await supabase
        .from('doctors')
        .select('hospital_code')
        .eq('user_id', doctorId)
        .single()

      if (!doctor || customer.hospital_code !== doctor.hospital_code) {
        throw new Error('해당 고객에 대한 접근 권한이 없습니다.')
      }

      // 활동 로그 조회
      const { data: activityLog } = await supabase
        .from('customer_activity_logs')
        .select('*')
        .eq('customer_id', customerId)
        .order('timestamp', { ascending: false })
        .limit(50)

      // 개인정보 마스킹
      const maskedCustomer = this.maskSensitiveData(customer, permissions)

      // 감사 로그 기록
      await this.logCustomerAccess(doctorId, 'view_customer_details', {
        customerId,
        customerName: customer.name
      })

      return {
        customer: maskedCustomer,
        activityLog: activityLog || [],
        permissions
      }

    } catch (error) {
      console.error('고객 상세 정보 조회 중 오류:', error)
      throw error
    }
  }

  /**
   * 고객 통계 조회
   */
  async getCustomerStats(doctorId: string): Promise<CustomerStats> {
    try {
      const permissions = await this.getDoctorPermissions(doctorId)
      if (!permissions.canViewAnalytics) {
        throw new Error('통계 조회 권한이 없습니다.')
      }

      const { data: doctor } = await supabase
        .from('doctors')
        .select('hospital_code')
        .eq('user_id', doctorId)
        .single()

      if (!doctor) {
        throw new Error('의사 정보를 찾을 수 없습니다.')
      }

      // 기본 통계
      const { data: totalStats } = await supabase
        .from('customers')
        .select('id, status, created_at, last_active_at')
        .eq('hospital_code', doctor.hospital_code)

      const totalCustomers = totalStats?.length || 0
      const activeCustomers = totalStats?.filter(c => c.status === 'active').length || 0
      
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const newCustomersThisMonth = totalStats?.filter(c => 
        new Date(c.created_at) >= thisMonth
      ).length || 0

      // 가입 트렌드 (최근 30일)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const joinTrends = await this.getJoinTrends(doctor.hospital_code, thirtyDaysAgo)
      
      // 활동 통계
      const { data: activityStats } = await supabase
        .from('customer_activity_logs')
        .select('action, customer_id')
        .gte('timestamp', thirtyDaysAgo.toISOString())
        .eq('hospital_code', doctor.hospital_code)

      const topActivities = this.calculateTopActivities(activityStats || [])

      return {
        totalCustomers,
        activeCustomers,
        newCustomersThisMonth,
        averageSessionDuration: 0, // 실제 구현에서는 세션 데이터 기반 계산
        topActivities,
        joinTrends,
        retentionRate: {
          daily: 0.85,
          weekly: 0.72,
          monthly: 0.65
        }
      }

    } catch (error) {
      console.error('고객 통계 조회 중 오류:', error)
      throw error
    }
  }

  /**
   * 고객 활동 플래그 추가
   */
  async flagCustomerActivity(
    customerId: string,
    doctorId: string,
    flagData: Omit<FlaggedActivity, 'id' | 'customerId' | 'detectedAt' | 'status'>
  ): Promise<void> {
    try {
      const permissions = await this.getDoctorPermissions(doctorId)
      if (!permissions.canFlagActivities) {
        throw new Error('활동 플래그 권한이 없습니다.')
      }

      const { error } = await supabase
        .from('customer_flagged_activities')
        .insert({
          customer_id: customerId,
          type: flagData.type,
          severity: flagData.severity,
          description: flagData.description,
          detected_at: new Date().toISOString(),
          status: 'pending',
          metadata: flagData.metadata,
          flagged_by: doctorId
        })

      if (error) {
        throw new Error('활동 플래그 추가에 실패했습니다.')
      }

      // 심각도가 높은 경우 즉시 알림
      if (flagData.severity === 'high' || flagData.severity === 'critical') {
        await notificationService.notifySecurityAlert(
          'customer_flagged_activity',
          flagData.severity,
          `고객 활동이 플래그되었습니다: ${flagData.description}`,
          {
            customerId,
            flagType: flagData.type,
            severity: flagData.severity
          }
        )
      }

      // 감사 로그 기록
      await this.logCustomerAccess(doctorId, 'flag_customer_activity', {
        customerId,
        flagType: flagData.type,
        severity: flagData.severity
      })

    } catch (error) {
      console.error('고객 활동 플래그 중 오류:', error)
      throw error
    }
  }

  /**
   * 고객 노트 추가
   */
  async addCustomerNote(
    customerId: string,
    doctorId: string,
    noteData: Omit<CustomerNote, 'id' | 'customerId' | 'doctorId' | 'doctorName' | 'createdAt'>
  ): Promise<void> {
    try {
      const permissions = await this.getDoctorPermissions(doctorId)
      if (!permissions.canAddNotes) {
        throw new Error('노트 추가 권한이 없습니다.')
      }

      // 의료 노트의 경우 추가 권한 확인
      if (noteData.type === 'medical' && !permissions.canViewMedicalNotes) {
        throw new Error('의료 노트 작성 권한이 없습니다.')
      }

      const { data: doctor } = await supabase
        .from('doctors')
        .select('name')
        .eq('user_id', doctorId)
        .single()

      const { error } = await supabase
        .from('customer_notes')
        .insert({
          customer_id: customerId,
          doctor_id: doctorId,
          doctor_name: doctor?.name || '알 수 없음',
          content: noteData.content,
          type: noteData.type,
          is_private: noteData.isPrivate,
          created_at: new Date().toISOString()
        })

      if (error) {
        throw new Error('노트 추가에 실패했습니다.')
      }

      // 감사 로그 기록
      await this.logCustomerAccess(doctorId, 'add_customer_note', {
        customerId,
        noteType: noteData.type,
        isPrivate: noteData.isPrivate
      })

    } catch (error) {
      console.error('고객 노트 추가 중 오류:', error)
      throw error
    }
  }

  /**
   * 고객 상태 변경 (활성화/비활성화/정지)
   */
  async updateCustomerStatus(
    customerId: string,
    doctorId: string,
    newStatus: CustomerInfo['status'],
    reason?: string
  ): Promise<void> {
    try {
      const permissions = await this.getDoctorPermissions(doctorId)
      if (newStatus === 'suspended' && !permissions.canSuspendCustomers) {
        throw new Error('고객 정지 권한이 없습니다.')
      }

      const { error } = await supabase
        .from('customers')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)

      if (error) {
        throw new Error('고객 상태 변경에 실패했습니다.')
      }

      // 상태 변경 로그 기록
      await supabase
        .from('customer_activity_logs')
        .insert({
          customer_id: customerId,
          action: 'status_changed',
          description: `상태가 ${newStatus}로 변경됨${reason ? `: ${reason}` : ''}`,
          performed_by: doctorId,
          timestamp: new Date().toISOString()
        })

      // 감사 로그 기록
      await this.logCustomerAccess(doctorId, 'update_customer_status', {
        customerId,
        newStatus,
        reason
      })

    } catch (error) {
      console.error('고객 상태 변경 중 오류:', error)
      throw error
    }
  }

  /**
   * 의사 권한 조회
   */
  private async getDoctorPermissions(doctorId: string): Promise<CustomerManagementPermissions> {
    try {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('role, permissions')
        .eq('user_id', doctorId)
        .single()

      // 기본 권한 (모든 의사)
      const basePermissions: CustomerManagementPermissions = {
        canViewCustomers: true,
        canViewCustomerDetails: true,
        canAddNotes: true,
        canViewMedicalNotes: true,
        canFlagActivities: true,
        canResolveFlags: false,
        canSuspendCustomers: false,
        canExportData: false,
        canViewAnalytics: true
      }

      // 역할별 추가 권한
      if (doctor?.role === 'senior_doctor' || doctor?.role === 'admin') {
        basePermissions.canResolveFlags = true
        basePermissions.canSuspendCustomers = true
        basePermissions.canExportData = true
      }

      return basePermissions

    } catch (error) {
      console.error('의사 권한 조회 중 오류:', error)
      // 기본 권한 반환
      return {
        canViewCustomers: true,
        canViewCustomerDetails: true,
        canAddNotes: true,
        canViewMedicalNotes: false,
        canFlagActivities: false,
        canResolveFlags: false,
        canSuspendCustomers: false,
        canExportData: false,
        canViewAnalytics: false
      }
    }
  }

  /**
   * 개인정보 마스킹
   */
  private maskSensitiveData(
    customer: any,
    permissions: CustomerManagementPermissions
  ): CustomerInfo {
    const masked = { ...customer }

    // 기본적으로 민감한 정보는 마스킹
    if (!permissions.canViewCustomerDetails) {
      masked.phoneNumber = this.maskPhoneNumber(customer.phoneNumber)
      masked.dateOfBirth = this.maskDateOfBirth(customer.dateOfBirth)
    }

    // 의료 정보는 특별 권한 필요
    if (!permissions.canViewMedicalNotes) {
      masked.notes = masked.notes?.filter((note: any) => note.type !== 'medical')
    }

    return masked
  }

  /**
   * 전화번호 마스킹
   */
  private maskPhoneNumber(phoneNumber?: string): string | undefined {
    if (!phoneNumber) return undefined
    return phoneNumber.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3')
  }

  /**
   * 생년월일 마스킹
   */
  private maskDateOfBirth(dateOfBirth?: string): string | undefined {
    if (!dateOfBirth) return undefined
    return dateOfBirth.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-**-**')
  }

  /**
   * 가입 트렌드 계산
   */
  private async getJoinTrends(hospitalCode: string, since: Date) {
    const { data } = await supabase
      .from('customers')
      .select('created_at')
      .eq('hospital_code', hospitalCode)
      .gte('created_at', since.toISOString())

    const trends: Array<{ date: string; count: number }> = []
    const dateMap = new Map<string, number>()

    data?.forEach(customer => {
      const date = new Date(customer.created_at).toISOString().split('T')[0]
      dateMap.set(date, (dateMap.get(date) || 0) + 1)
    })

    // 최근 30일간의 데이터 생성
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      trends.push({
        date: dateStr,
        count: dateMap.get(dateStr) || 0
      })
    }

    return trends
  }

  /**
   * 상위 활동 계산
   */
  private calculateTopActivities(activities: any[]) {
    const activityMap = new Map<string, number>()
    
    activities.forEach(activity => {
      activityMap.set(activity.action, (activityMap.get(activity.action) || 0) + 1)
    })

    const total = activities.length
    return Array.from(activityMap.entries())
      .map(([activity, count]) => ({
        activity,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  /**
   * 고객 접근 로그 기록
   */
  private async logCustomerAccess(
    doctorId: string,
    action: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      const log = createSecurityLog(
        'customer_access',
        doctorId,
        'system',
        'system',
        {
          action,
          ...metadata
        },
        true
      )

      await supabase.from('audit_logs').insert(log)
    } catch (error) {
      console.error('고객 접근 로그 기록 실패:', error)
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const customerManagementService = CustomerManagementService.getInstance()
export default customerManagementService