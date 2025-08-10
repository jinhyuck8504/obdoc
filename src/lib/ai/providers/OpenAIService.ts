// OpenAI Service - 한국어 음식 인식 특화

import { AI_SERVICE_CONFIG } from '@/lib/challengeConstants'

interface OpenAIResponse {
  data: any
  confidence: number
  cost: number
}

export class OpenAIService {
  private apiKey: string
  private baseURL: string = 'https://api.openai.com/v1'
  
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ''
    if (!this.apiKey) {
      console.warn('OpenAI API key not found')
    }
  }
  
  /**
   * 한국어 음식 텍스트 분석
   */
  async analyzeFood(text: string, customerId: string): Promise<OpenAIResponse> {
    const prompt = this.buildFoodAnalysisPrompt(text)
    
    try {
      const response = await this.callOpenAI({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 한국 음식 전문가입니다. 사용자가 입력한 음식 텍스트를 분석하여 정확한 영양 정보를 제공해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
      
      const result = this.parseFoodAnalysisResponse(response.choices[0].message.content)
      
      return {
        data: result,
        confidence: this.calculateConfidence(result),
        cost: this.calculateCost(response.usage)
      }
    } catch (error) {
      console.error('OpenAI food analysis failed:', error)
      throw new Error(`OpenAI 음식 분석 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 건강 위험도 평가
   */
  async assessHealthRisk(customerData: any, customerId: string): Promise<OpenAIResponse> {
    const prompt = this.buildHealthRiskPrompt(customerData)
    
    try {
      const response = await this.callOpenAI({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 의료 AI 어시스턴트입니다. 고객의 건강 데이터를 분석하여 위험도를 평가해주세요. 의학적 조언이 아닌 일반적인 건강 정보만 제공하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 800
      })
      
      const result = this.parseHealthRiskResponse(response.choices[0].message.content)
      
      return {
        data: result,
        confidence: 0.8,
        cost: this.calculateCost(response.usage)
      }
    } catch (error) {
      console.error('OpenAI health risk assessment failed:', error)
      throw new Error(`OpenAI 건강 위험도 평가 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 위험 신호 감지
   */
  async detectRiskSignals(dailyRecords: any[], customerId: string): Promise<OpenAIResponse> {
    const prompt = this.buildRiskDetectionPrompt(dailyRecords)
    
    try {
      const response = await this.callOpenAI({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 건강 모니터링 AI입니다. 일일 기록을 분석하여 잠재적 위험 신호를 감지해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 600
      })
      
      const result = this.parseRiskDetectionResponse(response.choices[0].message.content)
      
      return {
        data: result,
        confidence: 0.85,
        cost: this.calculateCost(response.usage)
      }
    } catch (error) {
      console.error('OpenAI risk detection failed:', error)
      throw new Error(`OpenAI 위험 신호 감지 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 서비스 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.callOpenAI({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      })
      
      return response.choices && response.choices.length > 0
    } catch (error) {
      console.error('OpenAI health check failed:', error)
      return false
    }
  }
  
  /**
   * OpenAI API 호출
   */
  private async callOpenAI(payload: any): Promise<any> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), AI_SERVICE_CONFIG.PROVIDERS.openai.timeout)
    
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } finally {
      clearTimeout(timeout)
    }
  }
  
  /**
   * 음식 분석 프롬프트 생성
   */
  private buildFoodAnalysisPrompt(text: string): string {
    return `
다음 한국어 텍스트에서 음식과 분량을 정확히 추출하고 영양 정보를 분석해주세요:

"${text}"

다음 JSON 형식으로 응답해주세요:
{
  "foods": [
    {
      "name": "음식명",
      "amount": 분량(숫자),
      "unit": "단위",
      "calories": 칼로리(추정),
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

한국 음식의 일반적인 분량과 영양 정보를 기반으로 정확히 분석해주세요.
    `.trim()
  }
  
  /**
   * 건강 위험도 평가 프롬프트 생성
   */
  private buildHealthRiskPrompt(customerData: any): string {
    return `
다음 고객 정보를 바탕으로 건강 위험도를 평가해주세요:

나이: ${customerData.age}세
체중: ${customerData.weight}kg
신장: ${customerData.height}cm
기존 질환: ${customerData.medicalConditions?.join(', ') || '없음'}
복용 약물: ${customerData.medications?.join(', ') || '없음'}
알레르기: ${customerData.allergies?.join(', ') || '없음'}
운동 수준: ${customerData.exerciseLevel}

다음 JSON 형식으로 응답해주세요:
{
  "risk_level": "low|medium|high",
  "risk_factors": ["위험 요소 목록"],
  "recommendations": ["권장사항 목록"],
  "requires_doctor_approval": true/false,
  "notes": "추가 설명"
}
    `.trim()
  }
  
  /**
   * 위험 신호 감지 프롬프트 생성
   */
  private buildRiskDetectionPrompt(dailyRecords: any[]): string {
    const recordsText = dailyRecords.map(record => 
      `날짜: ${record.recordDate}, 타입: ${record.recordType}, 데이터: ${JSON.stringify(record.recordData)}`
    ).join('\n')
    
    return `
다음 일일 기록들을 분석하여 건강 위험 신호를 감지해주세요:

${recordsText}

다음 JSON 형식으로 응답해주세요:
{
  "risk_detected": true/false,
  "risk_level": "low|medium|high",
  "warning_signs": ["감지된 위험 신호들"],
  "immediate_action_required": true/false,
  "recommendations": ["권장 조치사항"]
}
    `.trim()
  }
  
  /**
   * 음식 분석 응답 파싱
   */
  private parseFoodAnalysisResponse(content: string): any {
    try {
      // JSON 부분만 추출
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다')
      }
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Failed to parse OpenAI food analysis response:', error)
      // 파싱 실패 시 기본 구조 반환
      return {
        foods: [],
        total_calories: 0,
        meal_type: 'unknown',
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
      console.error('Failed to parse OpenAI health risk response:', error)
      return {
        risk_level: 'medium',
        risk_factors: [],
        recommendations: [],
        requires_doctor_approval: true,
        notes: '분석 중 오류가 발생했습니다'
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
      console.error('Failed to parse OpenAI risk detection response:', error)
      return {
        risk_detected: false,
        risk_level: 'low',
        warning_signs: [],
        immediate_action_required: false,
        recommendations: []
      }
    }
  }
  
  /**
   * 신뢰도 계산
   */
  private calculateConfidence(result: any): number {
    if (result.confidence) {
      return result.confidence
    }
    
    // 음식 개수와 영양 정보 완성도로 신뢰도 추정
    if (result.foods && result.foods.length > 0) {
      const hasNutrients = result.foods.some((food: any) => food.nutrients)
      return hasNutrients ? 0.85 : 0.7
    }
    
    return 0.5
  }
  
  /**
   * 비용 계산
   */
  private calculateCost(usage: any): number {
    if (!usage) {
      return AI_SERVICE_CONFIG.PROVIDERS.openai.costPerRequest
    }
    
    // GPT-4 가격 기준 (실제 가격은 변동될 수 있음)
    const inputCost = (usage.prompt_tokens || 0) * 0.00003 // $0.03/1K tokens
    const outputCost = (usage.completion_tokens || 0) * 0.00006 // $0.06/1K tokens
    
    return inputCost + outputCost
  }
}