// Claude Service - DII 계산 및 의료 추론 특화

import { AI_SERVICE_CONFIG } from '@/lib/challengeConstants'

interface ClaudeResponse {
  data: any
  confidence: number
  cost: number
}

export class ClaudeService {
  private apiKey: string
  private baseURL: string = 'https://api.anthropic.com/v1'
  
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Claude API key not found')
    }
  }
  
  /**
   * DII(Dietary Inflammatory Index) 점수 계산
   */
  async calculateDII(foods: any[], customerId: string): Promise<ClaudeResponse> {
    const prompt = this.buildDIICalculationPrompt(foods)
    
    try {
      const response = await this.callClaude({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
      
      const result = this.parseDIIResponse(response.content[0].text)
      
      return {
        data: result,
        confidence: 0.9, // Claude는 의료 계산에 높은 정확도
        cost: this.calculateCost(response.usage)
      }
    } catch (error) {
      console.error('Claude DII calculation failed:', error)
      throw new Error(`Claude DII 계산 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 건강 위험도 평가 (의료 추론 특화)
   */
  async assessHealthRisk(customerData: any, customerId: string): Promise<ClaudeResponse> {
    const prompt = this.buildHealthRiskPrompt(customerData)
    
    try {
      const response = await this.callClaude({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
      
      const result = this.parseHealthRiskResponse(response.content[0].text)
      
      return {
        data: result,
        confidence: 0.92, // 의료 추론에서 높은 신뢰도
        cost: this.calculateCost(response.usage)
      }
    } catch (error) {
      console.error('Claude health risk assessment failed:', error)
      throw new Error(`Claude 건강 위험도 평가 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 위험 신호 감지 (의료 패턴 인식)
   */
  async detectRiskSignals(dailyRecords: any[], customerId: string): Promise<ClaudeResponse> {
    const prompt = this.buildRiskDetectionPrompt(dailyRecords)
    
    try {
      const response = await this.callClaude({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
      
      const result = this.parseRiskDetectionResponse(response.content[0].text)
      
      return {
        data: result,
        confidence: 0.88,
        cost: this.calculateCost(response.usage)
      }
    } catch (error) {
      console.error('Claude risk detection failed:', error)
      throw new Error(`Claude 위험 신호 감지 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 음식 분석 (OpenAI 대체용)
   */
  async analyzeFood(text: string, customerId: string): Promise<ClaudeResponse> {
    const prompt = this.buildFoodAnalysisPrompt(text)
    
    try {
      const response = await this.callClaude({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
      
      const result = this.parseFoodAnalysisResponse(response.content[0].text)
      
      return {
        data: result,
        confidence: 0.82, // OpenAI보다는 약간 낮지만 여전히 높음
        cost: this.calculateCost(response.usage)
      }
    } catch (error) {
      console.error('Claude food analysis failed:', error)
      throw new Error(`Claude 음식 분석 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 서비스 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.callClaude({
        model: 'claude-3-haiku-20240307', // 빠른 모델 사용
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      })
      
      return response.content && response.content.length > 0
    } catch (error) {
      console.error('Claude health check failed:', error)
      return false
    }
  }
  
  /**
   * Claude API 호출
   */
  private async callClaude(payload: any): Promise<any> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), AI_SERVICE_CONFIG.PROVIDERS.claude.timeout)
    
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      
      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } finally {
      clearTimeout(timeout)
    }
  }
  
  /**
   * DII 계산 프롬프트 생성
   */
  private buildDIICalculationPrompt(foods: any[]): string {
    const foodsText = foods.map(food => 
      `${food.name}: ${food.amount}${food.unit} (${food.calories || 0}kcal)`
    ).join('\n')
    
    return `
당신은 영양학 전문가입니다. 다음 음식들의 DII(Dietary Inflammatory Index) 점수를 정확히 계산해주세요.

음식 목록:
${foodsText}

DII는 식품의 염증 유발 정도를 나타내는 지수입니다:
- 음수: 항염 효과 (좋음)
- 양수: 염증 유발 효과 (나쁨)
- 범위: 대략 -8.87 ~ +7.98

각 음식의 영양소 성분을 분석하고, 다음 45개 영양소 매개변수를 고려하여 DII를 계산해주세요:
- 매크로 영양소: 탄수화물, 단백질, 지방, 섬유질, 콜레스테롤
- 비타민: A, B1, B2, B3, B6, B12, C, D, E, 엽산, 베타카로틴
- 미네랄: 철분, 마그네슘, 아연, 셀레늄 등
- 기타: 오메가-3, 오메가-6, 플라보노이드, 안토시아니딘 등

다음 JSON 형식으로 응답해주세요:
{
  "individual_foods": [
    {
      "name": "음식명",
      "dii_score": DII점수,
      "inflammatory_nutrients": ["염증유발영양소"],
      "anti_inflammatory_nutrients": ["항염영양소"]
    }
  ],
  "total_dii_score": 총DII점수,
  "interpretation": "excellent|good|fair|poor",
  "recommendations": ["개선방안"],
  "confidence": 신뢰도(0-1)
}

한국 음식의 일반적인 영양 성분을 기반으로 정확히 계산해주세요.
    `.trim()
  }
  
  /**
   * 건강 위험도 평가 프롬프트 생성
   */
  private buildHealthRiskPrompt(customerData: any): string {
    return `
당신은 의료 AI 전문가입니다. 다음 고객 정보를 종합적으로 분석하여 건강 위험도를 평가해주세요.

고객 정보:
- 나이: ${customerData.age}세
- 성별: ${customerData.gender || '미상'}
- 체중: ${customerData.weight}kg
- 신장: ${customerData.height}cm
- BMI: ${customerData.weight && customerData.height ? (customerData.weight / Math.pow(customerData.height/100, 2)).toFixed(1) : '미상'}
- 기존 질환: ${customerData.medicalConditions?.join(', ') || '없음'}
- 복용 약물: ${customerData.medications?.join(', ') || '없음'}
- 알레르기: ${customerData.allergies?.join(', ') || '없음'}
- 운동 수준: ${customerData.exerciseLevel || '미상'}
- 식이 제한: ${customerData.dietaryRestrictions?.join(', ') || '없음'}

다음 의학적 기준을 고려하여 평가해주세요:
1. BMI 범위 (저체중 <18.5, 정상 18.5-24.9, 과체중 25-29.9, 비만 ≥30)
2. 연령별 위험 요소 (18세 미만, 65세 이상 고위험)
3. 기존 질환의 중증도 및 상호작용
4. 약물 부작용 및 금기사항
5. 생활습관 위험 요소

다음 JSON 형식으로 응답해주세요:
{
  "overall_risk_level": "low|medium|high|very_high",
  "risk_categories": {
    "cardiovascular": "위험도",
    "metabolic": "위험도",
    "nutritional": "위험도",
    "medication_interaction": "위험도"
  },
  "specific_risk_factors": ["구체적위험요소"],
  "contraindications": ["금기사항"],
  "requires_doctor_approval": true/false,
  "monitoring_required": ["모니터링필요항목"],
  "recommendations": ["권장사항"],
  "emergency_signs": ["응급상황징후"],
  "confidence": 신뢰도(0-1)
}

의학적 근거를 바탕으로 신중하게 평가해주세요.
    `.trim()
  }
  
  /**
   * 위험 신호 감지 프롬프트 생성
   */
  private buildRiskDetectionPrompt(dailyRecords: any[]): string {
    const recordsText = dailyRecords.map(record => {
      const date = record.recordDate
      const type = record.recordType
      const data = JSON.stringify(record.recordData)
      return `${date} [${type}]: ${data}`
    }).join('\n')
    
    return `
당신은 의료 모니터링 전문가입니다. 다음 일일 기록들을 분석하여 건강 위험 신호를 감지해주세요.

일일 기록:
${recordsText}

다음 패턴들을 주의깊게 분석해주세요:
1. 급격한 변화 (체중, 혈압, 혈당 등)
2. 지속적인 악화 추세
3. 비정상적인 수치 또는 증상
4. 약물 부작용 징후
5. 영양 불균형 신호
6. 탈수 또는 과수분 징후
7. 스트레스 또는 수면 부족 신호

다음 JSON 형식으로 응답해주세요:
{
  "risk_detected": true/false,
  "risk_level": "low|medium|high|critical",
  "risk_type": "acute|chronic|progressive",
  "warning_signs": [
    {
      "sign": "위험신호",
      "severity": "경증|중등도|중증",
      "trend": "improving|stable|worsening",
      "days_observed": 관찰일수
    }
  ],
  "immediate_action_required": true/false,
  "doctor_notification_required": true/false,
  "recommended_actions": ["권장조치"],
  "monitoring_frequency": "daily|twice_daily|hourly",
  "confidence": 신뢰도(0-1)
}

의학적 판단 기준에 따라 신중하게 분석해주세요.
    `.trim()
  }
  
  /**
   * 음식 분석 프롬프트 생성
   */
  private buildFoodAnalysisPrompt(text: string): string {
    return `
당신은 한국 음식 전문 영양사입니다. 다음 텍스트에서 음식과 분량을 분석해주세요.

입력 텍스트: "${text}"

다음 JSON 형식으로 응답해주세요:
{
  "foods": [
    {
      "name": "음식명",
      "amount": 분량,
      "unit": "단위",
      "calories": 칼로리,
      "nutrients": {
        "protein": 단백질(g),
        "carbs": 탄수화물(g),
        "fat": 지방(g),
        "fiber": 식이섬유(g),
        "sodium": 나트륨(mg)
      }
    }
  ],
  "total_calories": 총칼로리,
  "meal_type": "breakfast|lunch|dinner|snack",
  "confidence": 신뢰도(0-1)
}
    `.trim()
  }
  
  /**
   * DII 응답 파싱
   */
  private parseDIIResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다')
      }
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Failed to parse Claude DII response:', error)
      return {
        individual_foods: [],
        total_dii_score: 0,
        interpretation: 'fair',
        recommendations: ['분석 중 오류가 발생했습니다'],
        confidence: 0.3
      }
    }
  }
  
  /**
   * 건강 위험도 응답 파싱
   */
  private parseHealthRiskResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다')
      }
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Failed to parse Claude health risk response:', error)
      return {
        overall_risk_level: 'medium',
        risk_categories: {},
        specific_risk_factors: [],
        contraindications: [],
        requires_doctor_approval: true,
        monitoring_required: [],
        recommendations: ['의사와 상담하세요'],
        emergency_signs: [],
        confidence: 0.3
      }
    }
  }
  
  /**
   * 위험 신호 감지 응답 파싱
   */
  private parseRiskDetectionResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다')
      }
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Failed to parse Claude risk detection response:', error)
      return {
        risk_detected: false,
        risk_level: 'low',
        risk_type: 'stable',
        warning_signs: [],
        immediate_action_required: false,
        doctor_notification_required: false,
        recommended_actions: [],
        monitoring_frequency: 'daily',
        confidence: 0.3
      }
    }
  }
  
  /**
   * 음식 분석 응답 파싱
   */
  private parseFoodAnalysisResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다')
      }
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Failed to parse Claude food analysis response:', error)
      return {
        foods: [],
        total_calories: 0,
        meal_type: 'unknown',
        confidence: 0.3
      }
    }
  }
  
  /**
   * 비용 계산
   */
  private calculateCost(usage: any): number {
    if (!usage) {
      return AI_SERVICE_CONFIG.PROVIDERS.claude.costPerRequest
    }
    
    // Claude 가격 기준 (실제 가격은 변동될 수 있음)
    const inputCost = (usage.input_tokens || 0) * 0.000015 // $0.015/1K tokens
    const outputCost = (usage.output_tokens || 0) * 0.000075 // $0.075/1K tokens
    
    return inputCost + outputCost
  }
}