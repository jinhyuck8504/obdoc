'use client'
import React, { useState, useEffect } from 'react'
import { TrendingDown, TrendingUp, Target, Weight, Calendar, Award, Plus, Edit, Trash2, BarChart3, Activity } from 'lucide-react'
import { WeightRecord, HealthMetrics, WeightFormData, GoalFormData } from '@/types/health'
import { getWeightRecords, getWeightChange, addWeightRecord, updateWeightRecord, deleteWeightRecord, updateWeightGoal } from '@/lib/healthService'
import WeightInputModal from '../WeightInputModal'
import GoalSettingModal from '../GoalSettingModal'
import WeightChart from '../charts/WeightChart'
import BMIIndicator from '../charts/BMIIndicator'

interface HealthReportProps {
  customerId: string
  metrics: HealthMetrics
  onMetricsUpdate: () => void
}

export default function HealthReport({ 
  customerId,
  metrics,
  onMetricsUpdate
}: HealthReportProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'chart' | 'bmi' | 'records'>('overview')
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months'>('month')
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<WeightRecord | null>(null)

  // 데이터 로드
  useEffect(() => {
    loadWeightHistory()
  }, [customerId])

  const loadWeightHistory = async () => {
    try {
      setLoading(true)
      const records = await getWeightRecords(customerId)
      setWeightHistory(records)
    } catch (error) {
      console.error('체중 기록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredHistory = () => {
    const now = new Date()
    let cutoffDate: Date
    
    switch (selectedPeriod) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '3months':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
    }
    
    return weightHistory.filter(record => new Date(record.date) >= cutoffDate)
  }

  const weightChange = getWeightChange(weightHistory, selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90)
  const filteredHistory = getFilteredHistory()

  const handleWeightSave = async (data: WeightFormData) => {
    try {
      if (editingRecord) {
        await updateWeightRecord(editingRecord.id, data)
      } else {
        await addWeightRecord(customerId, data)
      }
      await loadWeightHistory()
      onMetricsUpdate()
      setEditingRecord(null)
    } catch (error) {
      console.error('체중 기록 저장 실패:', error)
      throw error
    }
  }

  const handleGoalSave = async (data: GoalFormData) => {
    try {
      await updateWeightGoal(customerId, data)
      onMetricsUpdate()
    } catch (error) {
      console.error('목표 설정 실패:', error)
      throw error
    }
  }

  const handleEditRecord = (record: WeightRecord) => {
    setEditingRecord(record)
    setShowWeightModal(true)
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      try {
        await deleteWeightRecord(recordId)
        await loadWeightHistory()
        onMetricsUpdate()
      } catch (error) {
        console.error('체중 기록 삭제 실패:', error)
      }
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-600" />
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-600" />
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  const getTrendText = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'down':
        return '감소'
      case 'up':
        return '증가'
      default:
        return '유지'
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'down':
        return 'text-green-600'
      case 'up':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-gray-100 rounded-xl">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">건강 리포트</h2>
          <div className="flex items-center space-x-3">
            {selectedTab === 'records' && (
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">최근 1주</option>
                <option value="month">최근 1개월</option>
                <option value="3months">최근 3개월</option>
              </select>
            )}
            <button
              onClick={() => setShowWeightModal(true)}
              className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              체중 기록
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
              selectedTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>개요</span>
          </button>
          <button
            onClick={() => setSelectedTab('chart')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
              selectedTab === 'chart'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>차트</span>
          </button>
          <button
            onClick={() => setSelectedTab('bmi')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
              selectedTab === 'bmi'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>BMI</span>
          </button>
          <button
            onClick={() => setSelectedTab('records')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
              selectedTab === 'records'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>기록</span>
          </button>
        </div>

        {/* 탭별 콘텐츠 */}
        {selectedTab === 'overview' && (
          <>
            {/* 현재 상태 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <Weight className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{metrics.currentWeight}kg</p>
                <p className="text-sm text-blue-700">현재 체중</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setShowGoalModal(true)}>
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{metrics.targetWeight}kg</p>
                <p className="text-sm text-green-700">목표 체중</p>
                <p className="text-xs text-green-600 mt-1">클릭하여 수정</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{metrics.progress.toFixed(0)}%</p>
                <p className="text-sm text-purple-700">목표 달성률</p>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">목표 달성 진행률</span>
                <span className="text-sm text-gray-600">
                  {metrics.weightLoss.toFixed(1)}kg / {(metrics.initialWeight - metrics.targetWeight).toFixed(1)}kg
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    metrics.progress >= 100 ? 'bg-green-500' :
                    metrics.progress >= 70 ? 'bg-blue-500' :
                    metrics.progress >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, metrics.progress)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>시작: {metrics.initialWeight}kg</span>
                <span>목표: {metrics.targetWeight}kg</span>
              </div>
            </div>

            {/* 최근 변화 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">최근 체중 변화</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getTrendIcon(weightChange.trend)}
                      <span className={`font-medium ${getTrendColor(weightChange.trend)}`}>
                        {weightChange.change.toFixed(1)}kg {getTrendText(weightChange.trend)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">목표까지 남은 체중</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Target className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-orange-600">
                        {metrics.remainingWeight > 0 ? `${metrics.remainingWeight.toFixed(1)}kg` : '목표 달성!'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 격려 메시지 */}
            {metrics.progress > 0 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {metrics.progress >= 100 ? '🎉 목표를 달성했습니다!' :
                       metrics.progress >= 70 ? '💪 목표에 가까워지고 있어요!' :
                       metrics.progress >= 30 ? '👍 좋은 진전을 보이고 있어요!' :
                       '🌟 시작이 반입니다. 화이팅!'}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      지금까지 {metrics.weightLoss.toFixed(1)}kg를 감량하셨습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {selectedTab === 'chart' && (
          <WeightChart
            records={weightHistory}
            targetWeight={metrics.targetWeight}
            initialWeight={metrics.initialWeight}
            height={400}
          />
        )}

        {selectedTab === 'bmi' && (
          <BMIIndicator
            currentBMI={metrics.bmi}
            targetBMI={metrics.targetBMI}
            height={metrics.height}
            currentWeight={metrics.currentWeight}
            targetWeight={metrics.targetWeight}
          />
        )}

        {selectedTab === 'records' && (
          <>
            {/* 체중 기록 히스토리 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">최근 체중 기록</h3>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">선택한 기간에 기록이 없습니다</p>
                  <button
                    onClick={() => setShowWeightModal(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    첫 번째 기록 추가
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {filteredHistory.slice().reverse().map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900">{record.weight}kg</p>
                          <p className="text-sm text-gray-600">
                            {new Date(record.date).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {record.note && (
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {record.note}
                          </div>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                          <button
                            onClick={() => handleEditRecord(record)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}


      </div>

      {/* 모달들 */}
      <WeightInputModal
        isOpen={showWeightModal}
        onClose={() => {
          setShowWeightModal(false)
          setEditingRecord(null)
        }}
        onSave={handleWeightSave}
        initialData={editingRecord ? {
          weight: editingRecord.weight,
          date: editingRecord.date,
          note: editingRecord.note
        } : undefined}
      />

      <GoalSettingModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSave={handleGoalSave}
        currentMetrics={metrics}
      />
    </>
  )
}