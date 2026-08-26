'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Calendar, Flag, Check, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [newTask, setNewTask] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const supabase = createClient()

  // Получаем пользователя и загружаем задачи
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Ошибка загрузки:', error)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

  // Добавление задачи
  const addTask = async () => {
    if (!newTask.trim()) {
      alert('Введите название задачи')
      return
    }

    if (!userId) {
      alert('Вы не авторизованы')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('tasks')
      .insert({ 
        title: newTask.trim(),
        is_done: false,
        due_date: dueDate || null,
        priority: priority,
        user_id: userId
      })
      .select()

    if (error) {
      console.error('Ошибка добавления:', error)
      alert('Ошибка: ' + error.message)
      setSaving(false)
      return
    }

    if (data && data.length > 0) {
      setTasks([data[0], ...tasks])
      setNewTask('')
      setDueDate('')
      setPriority('medium')
    }
    setSaving(false)
  }

  // Отметка о выполнении
  const toggleTask = async (id: string, currentDone: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_done: !currentDone })
      .eq('id', id)

    if (error) {
      console.error('Ошибка обновления:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setTasks(tasks.map(task => 
      task.id === id ? { ...task, is_done: !currentDone } : task
    ))
  }

  // Удаление задачи
  const deleteTask = async (id: string) => {
    if (!confirm('Удалить задачу?')) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setTasks(tasks.filter(task => task.id !== id))
  }

  // Форматирование даты
  const formatDate = (date: string) => {
    if (!date) return 'Без срока'
    const d = new Date(date)
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    })
  }

  // Проверка просрочена ли задача
  const isOverdue = (date: string) => {
    if (!date) return false
    return new Date(date) < new Date() && !new Date(date).toDateString().includes(new Date().toDateString())
  }

  // Получение цвета приоритета
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  // Получение иконки приоритета
  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'high': return <Flag className="w-4 h-4 text-red-400" />
      case 'medium': return <Flag className="w-4 h-4 text-yellow-400" />
      case 'low': return <Flag className="w-4 h-4 text-green-400" />
      default: return <Flag className="w-4 h-4 text-gray-400" />
    }
  }

  // Фильтрация задач
  const getFilteredTasks = () => {
    switch(filter) {
      case 'active': return tasks.filter(task => !task.is_done)
      case 'completed': return tasks.filter(task => task.is_done)
      default: return tasks
    }
  }

  // Статистика
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.is_done).length
  const activeTasks = tasks.filter(t => !t.is_done).length

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-400 text-sm">TASKS</p>
          <h1 className="text-2xl font-bold">Задачи</h1>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-gray-400">Всего: {totalTasks}</span>
          <span className="text-green-400">✓ {completedTasks}</span>
          <span className="text-yellow-400">○ {activeTasks}</span>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 mb-6">
        {['all', 'active', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === f 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Выполненные'}
          </button>
        ))}
      </div>

      {/* Форма добавления */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Новая задача..."
          className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
          disabled={saving}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Дедлайн</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              disabled={saving}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Приоритет</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              disabled={saving}
            >
              <option value="low" className="bg-black text-green-400">Низкий</option>
              <option value="medium" className="bg-black text-yellow-400">Средний</option>
              <option value="high" className="bg-black text-red-400">Высокий</option>
            </select>
          </div>
        </div>

        <button
          onClick={addTask}
          disabled={saving || !newTask.trim()}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-3"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Добавление...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Добавить задачу
            </>
          )}
        </button>
      </div>

      {/* Список задач */}
      <div className="space-y-2">
        {getFilteredTasks().length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
            <Check className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {filter === 'all' && 'Нет задач'}
              {filter === 'active' && 'Все задачи выполнены! 🎉'}
              {filter === 'completed' && 'Нет выполненных задач'}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {filter === 'all' && 'Создай свою первую задачу'}
              {filter === 'active' && 'Отличная работа!'}
              {filter === 'completed' && 'Выполни первую задачу'}
            </p>
          </div>
        ) : (
          getFilteredTasks().map((task) => (
            <div
              key={task.id}
              className={`bg-white/5 rounded-xl p-3 border transition-colors ${
                task.is_done 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : isOverdue(task.due_date)
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleTask(task.id, task.is_done)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    task.is_done 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-400 hover:border-white'
                  }`}
                >
                  {task.is_done && <Check className="w-3 h-3 text-black" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.is_done ? 'line-through text-gray-400' : 'text-white'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {task.due_date && (
                      <span className={`text-xs flex items-center gap-1 ${
                        isOverdue(task.due_date) && !task.is_done 
                          ? 'text-red-400' 
                          : 'text-gray-400'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.due_date)}
                        {isOverdue(task.due_date) && !task.is_done && ' (Просрочена)'}
                      </span>
                    )}
                    <span className={`text-xs flex items-center gap-1 ${getPriorityColor(task.priority || 'medium')}`}>
                      {getPriorityIcon(task.priority || 'medium')}
                      {task.priority === 'high' ? 'Высокий' : 
                       task.priority === 'medium' ? 'Средний' : 'Низкий'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}