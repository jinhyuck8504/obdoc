'use client'

import React, { useState } from 'react'
import { CheckCircle, Clock, AlertCircle, Plus, MoreVertical, X, Save, Edit2, Check } from 'lucide-react'

interface Task {
  id: number
  title: string
  time: string
  status: 'pending' | 'completed' | 'urgent'
  patient?: string
  type?: string
  description?: string
}

interface NewTask {
  title: string
  time: string
  patient?: string
  type?: string
  description?: string
}

interface EditingTask extends Task {
  isEditing: boolean
}

export default function TodayTasks() {
  // useDensity 임시 제거 (DensityProvider 오류 방지)
  // const { density, getDensityClass } = useDensity()
  // TODO: Fetch real data from API
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: '김철수 고객 상담', time: '10:00', status: 'completed', patient: '김철수', type: '상담' },
    { id: 2, title: '이영희 고객 체중 측정', time: '14:00', status: 'pending', patient: '이영희', type: '체중측정' },
    { id: 3, title: '박민수 고객 식단 검토', time: '16:00', status: 'urgent', patient: '박민수', type: '식단상담' },
    { id: 4, title: '정수진 고객 진료 상담', time: '17:30', status: 'pending', patient: '정수진', type: '상담' },
  ])
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    time: '',
    patient: '',
    type: '',
    description: ''
  })

  const toggleTaskStatus = (taskId: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ))
  }

  const addTask = () => {
    if (!newTask.title.trim() || !newTask.time.trim()) {
      alert('제목과 시간을 입력해주세요.')
      return
    }

    const task: Task = {
      id: Math.max(...tasks.map(t => t.id), 0) + 1,
      title: newTask.title,
      time: newTask.time,
      status: 'pending',
      patient: newTask.patient || undefined,
      type: newTask.type || undefined,
      description: newTask.description || undefined
    }

    setTasks(prev => [...prev, task].sort((a, b) => a.time.localeCompare(b.time)))
    setNewTask({ title: '', time: '', patient: '', type: '', description: '' })
    setShowAddModal(false)
  }

  const deleteTask = (taskId: number) => {
    if (confirm('이 작업을 삭제하시겠습니까?')) {
      setTasks(prev => prev.filter(task => task.id !== taskId))
    }
  }

  const startEditTask = (taskId: number) => {
    setEditingTaskId(taskId)
  }

  const saveEditTask = (taskId: number, updatedTask: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updatedTask } : task
    ))
    setEditingTaskId(null)
  }

  const cancelEditTask = () => {
    setEditingTaskId(null)
  }

  const openAddModal = () => {
    setShowAddModal(true)
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setNewTask({ title: '', time: '', patient: '', type: '', description: '' })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 opacity-75'
      case 'urgent':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료'
      case 'urgent':
        return '긴급'
      default:
        return '대기'
    }
  }

  const completedTasks = tasks.filter(task => task.status === 'completed').length
  const totalTasks = tasks.length

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">오늘 할 일</h2>
          <p className="text-sm text-gray-600">
            {completedTasks}/{totalTasks} 완료
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="새 작업 추가"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 진행률 바 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>진행률</span>
          <span>{Math.round((completedTasks / totalTasks) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">오늘 예정된 작업이 없습니다</p>
        </div>
      ) : (
        <div className={`widget-content space-y-3 max-h-80 overflow-y-auto`}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${getStatusColor(task.status)}`}
            >
              {editingTaskId === task.id ? (
                <EditTaskForm 
                  task={task}
                  onSave={(updatedTask) => saveEditTask(task.id, updatedTask)}
                  onCancel={cancelEditTask}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className="flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      {getStatusIcon(task.status)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-gray-600">{task.time}</p>
                        {task.type && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {task.type}
                          </span>
                        )}
                        {task.patient && (
                          <span className="text-xs text-gray-500">• {task.patient}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'urgent' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusText(task.status)}
                    </span>
                    <button 
                      onClick={() => startEditTask(task.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="작업 수정"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="작업 삭제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 빠른 액션 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button 
          onClick={openAddModal}
          className="w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          + 새 작업 추가
        </button>
      </div>

      {/* 새 작업 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">새 작업 추가</h3>
              <button
                onClick={closeAddModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작업 제목 *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="작업 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시간 *
                </label>
                <input
                  type="time"
                  value={newTask.time}
                  onChange={(e) => setNewTask(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객명
                </label>
                <input
                  type="text"
                  value={newTask.patient}
                  onChange={(e) => setNewTask(prev => ({ ...prev, patient: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="고객명 (선택사항)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작업 유형
                </label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">유형 선택</option>
                  <option value="상담">상담</option>
                  <option value="체중측정">체중측정</option>
                  <option value="식단상담">식단상담</option>
                  <option value="진료">진료</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="추가 메모 (선택사항)"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeAddModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={addTask}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 작업 편집 폼 컴포넌트
function EditTaskForm({ 
  task, 
  onSave, 
  onCancel 
}: { 
  task: Task
  onSave: (updatedTask: Partial<Task>) => void
  onCancel: () => void 
}) {
  const [editData, setEditData] = useState({
    title: task.title,
    time: task.time,
    patient: task.patient || '',
    type: task.type || '',
    description: task.description || ''
  })

  const handleSave = () => {
    if (!editData.title.trim() || !editData.time.trim()) {
      alert('제목과 시간을 입력해주세요.')
      return
    }
    onSave(editData)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={editData.title}
          onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="작업 제목"
        />
        <input
          type="time"
          value={editData.time}
          onChange={(e) => setEditData(prev => ({ ...prev, time: e.target.value }))}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={editData.patient}
          onChange={(e) => setEditData(prev => ({ ...prev, patient: e.target.value }))}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="고객명"
        />
        <select
          value={editData.type}
          onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">유형 선택</option>
          <option value="상담">상담</option>
          <option value="체중측정">체중측정</option>
          <option value="식단상담">식단상담</option>
          <option value="진료">진료</option>
          <option value="기타">기타</option>
        </select>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
        >
          <Check className="w-3 h-3 mr-1" />
          저장
        </button>
      </div>
    </div>
  )
}