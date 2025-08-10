// Cost Tracker - AI 사용량 및 비용 추적 시스템

import { AIProvider } from '@/types/challenge'
import { AI_SERVICE_CONFIG } from '@/lib/challengeConstants'

interface UsageRecord {
  customerId: string
  provider: AIProvider
  cost: number
  timestamp: number
  analysisType: string
}

interface CostSummary {
  daily: number
  weekly: number
  monthly: number
  byProvider: Record<AIProvider, number>
  byCustomer: Record<string, number>
}

export class CostTracker {
  private usageRecords: UsageRecord[] = []
  private dailyCostCache: Map<string, number> = new Map() // date -> cost
  private monthlyCostCache: Map<string, number> = new Map() // month -> cost
  
  /**
   * AI 사용량 기록
   */
  async recordUsage(
    provider: AIProvider,
    cost: number,
    customerId: string,
    analysisType: string = 'unknown'
  ): Promise<void> {
    const record: UsageRecord = {
      customerId,
      provider,
      cost,
      timestamp: Date.now(),
      analysisType
    }
    
    this.usageRecords.push(record)
    
    // 캐시 무효화
    const today = this.getDateString(new Date())
    this.dailyCostCache.delete(today)
    
    const thisMonth = this.getMonthString(new Date())
    this.monthlyCostCache.delete(thisMonth)
    
    // 실제 구현에서는 데이터베이스에 저장
    await this.persistUsageRecord(record)
    
    // 비용 임계값 확인
    await this.checkCostThresholds()
    
    console.log(`Recorded AI usage: ${provider} - $${cost.toFixed(4)} for customer ${customerId}`)
  }
  
  /**
   * 일일 남은 예산 조회
   */
  async getRemainingDailyBudget(): Promise<number> {
    const dailyCost = await this.getDailyCost()
    const dailyLimit = AI_SERVICE_CONFIG.DAILY_COST_LIMIT
    
    return Math.max(0, dailyLimit - dailyCost)
  }
  
  /**
   * 월간 남은 예산 조회
   */
  async getRemainingMonthlyBudget(): Promise<number> {
    const monthlyCost = await this.getMonthlyCost()
    const monthlyLimit = AI_SERVICE_CONFIG.MONTHLY_COST_LIMIT
    
    return Math.max(0, monthlyLimit - monthlyCost)
  }
  
  /**
   * 일일 비용 조회
   */
  async getDailyCost(date: Date = new Date()): Promise<number> {
    const dateString = this.getDateString(date)
    
    // 캐시 확인
    if (this.dailyCostCache.has(dateString)) {
      return this.dailyCostCache.get(dateString)!
    }
    
    // 해당 날짜의 비용 계산
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    const dailyCost = this.usageRecords
      .filter(record => 
        record.timestamp >= startOfDay.getTime() && 
        record.timestamp <= endOfDay.getTime()
      )
      .reduce((sum, record) => sum + record.cost, 0)
    
    // 캐시에 저장
    this.dailyCostCache.set(dateString, dailyCost)
    
    return dailyCost
  }
  
  /**
   * 월간 비용 조회
   */
  async getMonthlyCost(date: Date = new Date()): Promise<number> {
    const monthString = this.getMonthString(date)
    
    // 캐시 확인
    if (this.monthlyCostCache.has(monthString)) {
      return this.monthlyCostCache.get(monthString)!
    }
    
    // 해당 월의 비용 계산
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
    
    const monthlyCost = this.usageRecords
      .filter(record => 
        record.timestamp >= startOfMonth.getTime() && 
        record.timestamp <= endOfMonth.getTime()
      )
      .reduce((sum, record) => sum + record.cost, 0)
    
    // 캐시에 저장
    this.monthlyCostCache.set(monthString, monthlyCost)
    
    return monthlyCost
  }
  
  /**
   * 비용 요약 조회
   */
  async getCostSummary(days: number = 30): Promise<CostSummary> {
    const now = Date.now()
    const cutoffTime = now - (days * 24 * 60 * 60 * 1000)
    
    const recentRecords = this.usageRecords.filter(record => record.timestamp >= cutoffTime)
    
    // 일일 비용
    const daily = await this.getDailyCost()
    
    // 주간 비용
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000)
    const weekly = recentRecords
      .filter(record => record.timestamp >= weekAgo)
      .reduce((sum, record) => sum + record.cost, 0)
    
    // 월간 비용
    const monthly = await this.getMonthlyCost()
    
    // Provider별 비용
    const byProvider: Record<AIProvider, number> = {
      openai: 0,
      claude: 0,
      google: 0
    }
    
    recentRecords.forEach(record => {
      byProvider[record.provider] += record.cost
    })
    
    // 고객별 비용
    const byCustomer: Record<string, number> = {}
    recentRecords.forEach(record => {
      byCustomer[record.customerId] = (byCustomer[record.customerId] || 0) + record.cost
    })
    
    return {
      daily,
      weekly,
      monthly,
      byProvider,
      byCustomer
    }
  }
  
  /**
   * 비용 임계값 확인 및 알림
   */
  private async checkCostThresholds(): Promise<void> {
    const dailyCost = await this.getDailyCost()
    const monthlyCost = await this.getMonthlyCost()
    
    const dailyLimit = AI_SERVICE_CONFIG.DAILY_COST_LIMIT
    const monthlyLimit = AI_SERVICE_CONFIG.MONTHLY_COST_LIMIT
    
    // 일일 비용 80% 초과 시 경고
    if (dailyCost > dailyLimit * 0.8) {
      await this.sendCostAlert('daily', dailyCost, dailyLimit)
    }
    
    // 일일 비용 100% 초과 시 긴급 알림
    if (dailyCost > dailyLimit) {
      await this.sendCostAlert('daily_exceeded', dailyCost, dailyLimit)
    }
    
    // 월간 비용 90% 초과 시 경고
    if (monthlyCost > monthlyLimit * 0.9) {
      await this.sendCostAlert('monthly', monthlyCost, monthlyLimit)
    }
    
    // 월간 비용 100% 초과 시 긴급 알림
    if (monthlyCost > monthlyLimit) {
      await this.sendCostAlert('monthly_exceeded', monthlyCost, monthlyLimit)
    }
  }
  
  /**
   * 비용 알림 전송
   */
  private async sendCostAlert(
    type: string,
    currentCost: number,
    limit: number
  ): Promise<void> {
    const percentage = (currentCost / limit * 100).toFixed(1)
    
    const alertMessage = {
      daily: `일일 AI 비용이 ${percentage}%에 도달했습니다. ($${currentCost.toFixed(2)}/$${limit})`,
      daily_exceeded: `🚨 일일 AI 비용 한도를 초과했습니다! ($${currentCost.toFixed(2)}/$${limit})`,
      monthly: `월간 AI 비용이 ${percentage}%에 도달했습니다. ($${currentCost.toFixed(2)}/$${limit})`,
      monthly_exceeded: `🚨 월간 AI 비용 한도를 초과했습니다! ($${currentCost.toFixed(2)}/$${limit})`
    }[type]
    
    // 실제 구현에서는 관리자에게 알림 전송
    console.warn('AI Cost Alert:', alertMessage)
    
    // TODO: 실제 알림 시스템 연동
    // await notificationService.sendAlert({
    //   type: 'ai_cost_alert',
    //   message: alertMessage,
    //   priority: type.includes('exceeded') ? 'urgent' : 'high'
    // })
  }
  
  /**
   * 사용량 기록을 데이터베이스에 저장
   */
  private async persistUsageRecord(record: UsageRecord): Promise<void> {
    try {
      // 실제 구현에서는 ai_analysis_logs 테이블에 저장
      // 현재는 로그만 출력
      console.log('Persisting usage record:', {
        customer_id: record.customerId,
        provider: record.provider,
        cost_usd: record.cost,
        analysis_type: record.analysisType,
        created_at: new Date(record.timestamp).toISOString()
      })
    } catch (error) {
      console.error('Failed to persist usage record:', error)
    }
  }
  
  /**
   * 날짜 문자열 생성 (YYYY-MM-DD)
   */
  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0]
  }
  
  /**
   * 월 문자열 생성 (YYYY-MM)
   */
  private getMonthString(date: Date): string {
    return date.toISOString().substring(0, 7)
  }
  
  /**
   * 비용 최적화 제안
   */
  async getCostOptimizationSuggestions(): Promise<string[]> {
    const summary = await this.getCostSummary()
    const suggestions: string[] = []
    
    // 가장 비싼 provider 확인
    const mostExpensiveProvider = Object.entries(summary.byProvider)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (mostExpensiveProvider && mostExpensiveProvider[1] > summary.daily * 0.6) {
      suggestions.push(`${mostExpensiveProvider[0]} 사용량이 높습니다. 더 저렴한 대안을 고려해보세요.`)
    }
    
    // 캐시 히트율 확인 (모의 데이터)
    const cacheHitRate = 0.75 // 실제로는 AICache에서 가져옴
    if (cacheHitRate < 0.8) {
      suggestions.push('캐시 히트율이 낮습니다. 캐시 전략을 개선하면 비용을 절약할 수 있습니다.')
    }
    
    // 일일 비용이 높은 고객 확인
    const highCostCustomers = Object.entries(summary.byCustomer)
      .filter(([, cost]) => cost > 1.0) // $1 이상
      .length
    
    if (highCostCustomers > 0) {
      suggestions.push(`${highCostCustomers}명의 고객이 높은 AI 비용을 발생시키고 있습니다. 사용 패턴을 검토해보세요.`)
    }
    
    return suggestions
  }
  
  /**
   * 통계 리셋 (월말 등)
   */
  async resetStats(type: 'daily' | 'monthly' = 'daily'): Promise<void> {
    if (type === 'daily') {
      this.dailyCostCache.clear()
    } else {
      this.monthlyCostCache.clear()
    }
    
    console.log(`Reset ${type} cost statistics`)
  }
}