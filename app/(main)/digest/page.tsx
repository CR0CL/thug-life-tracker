'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Settings, Mic, Loader2, Check, Flame, Droplet, Utensils, Calendar, CheckSquare, Wallet, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import VoiceInputSimple from '@/components/VoiceInputSimple'

export default function DigestPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<any[]>([])
  const [water, setWater] = useState(0)
  const [calories, setCalories] = useState(0)
  const [rituals, setRituals] = useState<any[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null)
  const [waterGoal, setWaterGoal] = useState(2500)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('water_goal')
          .eq('user_id', user.id)
          .single()
        if (profile?.water_goal) {
          setWaterGoal(profile.water_goal)
        }
        await loadData()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadData = async () => {
    const today = new Date().toISOString().split('T')[0]

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_done', false)
      .order('created_at', { ascending: true })
    setTasks(tasksData || [])

    const { data: waterData } = await supabase
      .from('water_logs')
      .select('amount')
      .gte('logged_at', today)
      .lt('logged_at', today + 'T23:59:59')
    const waterTotal = (waterData || []).reduce((sum, w) => sum + (w.amount || 0), 0)
    setWater(waterTotal)

    const { data: foodData } = await supabase
      .from('food_logs')
      .select('calories')
      .gte('logged_at', today)
      .lt('logged_at', today + 'T23:59:59')
    const caloriesTotal = (foodData || []).reduce((sum, f) => sum + (f.calories || 0), 0)
    setCalories(caloriesTotal)

    const { data: ritualsData } = await supabase
      .from('rituals')
      .select('*')
    setRituals(ritualsData || [])
  }

  const handleVoiceTranscript = async (text: string) => {
    setMessage(`⏳ Обработка: "${text}"...`)
    setMessageType(null)

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId })
      })

      const data = await response.json()

      if (data.success) {
        const typeNames: Record<string, string> = {
          task: 'Задача',
          note: 'Заметка',
          money: 'Транзакция',
          food: 'Приём пищи',
          meeting: 'Встреча',
          ritual: 'Привычка'
        }
        setMessage(`✅ ${typeNames[data.type] || 'Запись'} добавлена: ${data.text}`)
        setMessageType('success')
        await loadData()
      } else {
        setMessage(`❌ Ошибка: ${data.error || 'Не удалось обработать'}`)
        setMessageType('error')
      }
    } catch (error) {
      setMessage(`❌ Ошибка: ${error}`)
      setMessageType('error')
    }

    setTimeout(() => {
      setMessage(null)
      setMessageType(null)
    }, 5000)
  }

  const handleVoiceError = (error: string) => {
    setMessage(`❌ ${error}`)
    setMessageType('error')
    setTimeout(() => {
      setMessage(null)
      setMessageType(null)
    }, 5000)
  }

  const getDayName = () => {
    return new Date().toLocaleDateString('ru-RU', { weekday: 'long' })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'Доброе утро'
    if (hour >= 12 && hour < 18) return 'Добрый день'
    if (hour >= 18 && hour < 23) return 'Добрый вечер'
    return 'Доброй ночи'
  }

  const activeTasks = tasks.length
  const doneRituals = rituals.filter(r => r.done).length
  const totalRituals = rituals.length
  const ritualProgress = totalRituals > 0 ? Math.round((doneRituals / totalRituals) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      {/* Верхняя часть */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-gray-400 text-sm capitalize">{getDayName()}</p>
          <p className="text-2xl font-bold">
            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </p>
          <p className="text-gray-400 text-sm mt-1">{getGreeting()}</p>
        </div>
        <div className="flex items-center gap-2">
          {userId && (
            <VoiceInputSimple 
              onTranscript={handleVoiceTranscript}
              onError={handleVoiceError}
            />
          )}
          <Link href="/settings">
            <button className="p-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </Link>
        </div>
      </div>

      {/* Сообщение */}
      {message && (
        <div className={`rounded-xl p-3 border mb-4 ${
          messageType === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : messageType === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Задача дня */}
      {activeTasks > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
              <Check className="w-4 h-4 text-black opacity-0" />
            </div>
            <div>
              <p className="text-xs text-gray-400">ЗАДАЧА ДНЯ</p>
              <p className="font-medium">{tasks[0]?.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Карточки */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-gray-400">Задач</p>
          </div>
          <p className="text-2xl font-bold text-white">{activeTasks}</p>
          <p className="text-xs text-green-400">Активных</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Droplet className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-gray-400">Вода</p>
          </div>
          <p className="text-2xl font-bold text-white">{water} мл</p>
          <p className="text-xs text-gray-400">Цель {waterGoal} мл</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <p className="text-sm text-gray-400">Калории</p>
          </div>
          <p className="text-2xl font-bold text-white">{calories}</p>
          <p className="text-xs text-gray-400">из 2000 ккал</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-purple-400" />
            <p className="text-sm text-gray-400">Привычки</p>
          </div>
          <p className="text-2xl font-bold text-white">{doneRituals}/{totalRituals}</p>
          <p className="text-xs text-green-400">{ritualProgress}% выполнено</p>
        </div>
      </div>

      {/* Быстрый доступ */}
      <div className="mt-6 grid grid-cols-4 gap-2">
        <Link href="/tasks">
          <button className="w-full bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors text-center">
            <CheckSquare className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Задачи</span>
          </button>
        </Link>
        <Link href="/notes">
          <button className="w-full bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors text-center">
            <Utensils className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Заметки</span>
          </button>
        </Link>
        <Link href="/money">
          <button className="w-full bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors text-center">
            <Wallet className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Финансы</span>
          </button>
        </Link>
        <Link href="/food">
          <button className="w-full bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors text-center">
            <Utensils className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Еда</span>
          </button>
        </Link>
      </div>
    </div>
  )
}