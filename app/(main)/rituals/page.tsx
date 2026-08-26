'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Flame, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RitualsPage() {
  const [rituals, setRituals] = useState<any[]>([])
  const [newRitual, setNewRitual] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Получаем пользователя и загружаем привычки
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
    loadRituals()
  }, [])

  const loadRituals = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rituals')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Ошибка загрузки:', error)
    } else {
      setRituals(data || [])
    }
    setLoading(false)
  }

  // Добавление привычки
  const addRitual = async () => {
    if (!newRitual.trim()) {
      alert('Введите название привычки')
      return
    }

    if (!userId) {
      alert('Вы не авторизованы')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('rituals')
      .insert({ 
        name: newRitual.trim(),
        done: false,
        streak: 0,
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
      setRituals([...rituals, data[0]])
      setNewRitual('')
    }
    setSaving(false)
  }

  // Удаление привычки
  const deleteRitual = async (id: string) => {
    if (!confirm('Удалить привычку?')) return

    const { error } = await supabase
      .from('rituals')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setRituals(rituals.filter(ritual => ritual.id !== id))
  }

  // Отметка о выполнении
  const toggleRitual = async (id: string, currentDone: boolean, currentStreak: number) => {
    const newDone = !currentDone
    let newStreak = currentStreak

    if (newDone) {
      // Если отмечаем как выполненное - увеличиваем streak
      newStreak = currentStreak + 1
    } else {
      // Если снимаем отметку - сбрасываем streak (или уменьшаем)
      newStreak = Math.max(0, currentStreak - 1)
    }

    const { error } = await supabase
      .from('rituals')
      .update({ 
        done: newDone,
        streak: newStreak
      })
      .eq('id', id)

    if (error) {
      console.error('Ошибка обновления:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setRituals(rituals.map(ritual => 
      ritual.id === id 
        ? { ...ritual, done: newDone, streak: newStreak } 
        : ritual
    ))
  }

  // Сброс всех привычек (ежедневный сброс)
  const resetAll = async () => {
    if (!confirm('Сбросить все привычки на сегодня?')) return

    const { error } = await supabase
      .from('rituals')
      .update({ done: false })
      .eq('user_id', userId)

    if (error) {
      console.error('Ошибка сброса:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setRituals(rituals.map(ritual => ({ ...ritual, done: false })))
  }

  // Форматирование даты последнего обновления
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    })
  }

  // Подсчёт статистики
  const totalRituals = rituals.length
  const completedRituals = rituals.filter(r => r.done).length
  const completionRate = totalRituals > 0 ? Math.round((completedRituals / totalRituals) * 100) : 0
  const totalStreak = rituals.reduce((sum, r) => sum + (r.streak || 0), 0)

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
          <p className="text-gray-400 text-sm">RITUALS</p>
          <h1 className="text-2xl font-bold">Привычки</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetAll}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
          >
            Сбросить все
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
          <p className="text-xs text-gray-400">Всего</p>
          <p className="text-lg font-bold text-white">{totalRituals}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
          <p className="text-xs text-gray-400">Выполнено</p>
          <p className="text-lg font-bold text-green-400">{completedRituals}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
          <p className="text-xs text-gray-400">Прогресс</p>
          <p className="text-lg font-bold text-blue-400">{completionRate}%</p>
        </div>
      </div>

      {/* Общий стрик */}
      {totalStreak > 0 && (
        <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl p-4 border border-orange-500/30 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium">Общий стрик</span>
          </div>
          <span className="text-lg font-bold text-orange-400">{totalStreak} дней</span>
        </div>
      )}

      {/* Форма добавления */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newRitual}
            onChange={(e) => setNewRitual(e.target.value)}
            placeholder="Новая привычка..."
            className="flex-1 px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={saving}
            onKeyPress={(e) => e.key === 'Enter' && addRitual()}
          />
          <button
            onClick={addRitual}
            disabled={saving || !newRitual.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>

      {/* Список привычек */}
      <div className="space-y-3">
        {rituals.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
            <p className="text-gray-400 text-sm">Нет привычек</p>
            <p className="text-gray-500 text-xs mt-1">Создай свою первую привычку</p>
          </div>
        ) : (
          rituals.map((ritual) => (
            <div
              key={ritual.id}
              className={`bg-white/5 rounded-xl p-4 border transition-colors ${
                ritual.done 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleRitual(ritual.id, ritual.done, ritual.streak || 0)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      ritual.done 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-400 hover:border-white'
                    }`}
                  >
                    {ritual.done && <Check className="w-4 h-4 text-black" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${ritual.done ? 'line-through text-gray-400' : 'text-white'}`}>
                      {ritual.name}
                    </p>
                    {ritual.streak > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Flame className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-orange-400">{ritual.streak} дней</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteRitual(ritual.id)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
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