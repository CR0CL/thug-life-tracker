'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Settings, Mic, Loader2, Check, Flame, Droplet, Utensils, 
  CheckSquare, Wallet, Target, Calendar, TrendingUp, TrendingDown,
  ArrowRight, Sparkles, Zap, Coffee
} from 'lucide-react'
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
        if (profile?.water_goal) setWaterGoal(profile.water_goal)
        await loadData()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadData = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data: tasksData } = await supabase.from('tasks').select('*').eq('is_done', false).order('created_at', { ascending: true })
    setTasks(tasksData || [])
    const { data: waterData } = await supabase.from('water_logs').select('amount').gte('logged_at', today).lt('logged_at', today + 'T23:59:59')
    const waterTotal = (waterData || []).reduce((sum, w) => sum + (w.amount || 0), 0)
    setWater(waterTotal)
    const { data: foodData } = await supabase.from('food_logs').select('calories').gte('logged_at', today).lt('logged_at', today + 'T23:59:59')
    const caloriesTotal = (foodData || []).reduce((sum, f) => sum + (f.calories || 0), 0)
    setCalories(caloriesTotal)
    const { data: ritualsData } = await supabase.from('rituals').select('*')
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
          task: 'Задача', note: 'Заметка', money: 'Транзакция',
          food: 'Приём пищи', meeting: 'Встреча', ritual: 'Привычка'
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
    setTimeout(() => { setMessage(null); setMessageType(null) }, 5000)
  }

  const handleVoiceError = (error: string) => {
    setMessage(`❌ ${error}`)
    setMessageType('error')
    setTimeout(() => { setMessage(null); setMessageType(null) }, 5000)
  }

  const getDayName = () => new Date().toLocaleDateString('ru-RU', { weekday: 'long' })
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'Доброе утро ☀️'
    if (hour >= 12 && hour < 18) return 'Добрый день 🌤️'
    if (hour >= 18 && hour < 23) return 'Добрый вечер 🌙'
    return 'Доброй ночи 🌃'
  }

  const activeTasks = tasks.length
  const doneRituals = rituals.filter(r => r.done).length
  const totalRituals = rituals.length
  const ritualProgress = totalRituals > 0 ? Math.round((doneRituals / totalRituals) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 py-6">
      {/* Верхняя часть с градиентом */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 p-6 mb-6 border border-white/10 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-sm text-blue-400 font-medium capitalize">{getDayName()}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </p>
            <p className="text-gray-400 text-sm mt-1">{getGreeting()}</p>
          </div>
          <div className="flex items-center gap-2">
            {userId && (
              <div className="relative">
                <VoiceInputSimple onTranscript={handleVoiceTranscript} onError={handleVoiceError} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
            )}
            <Link href="/settings">
              <button className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 hover:bg-white/20 transition-all hover:scale-105">
                <Settings className="w-5 h-5 text-gray-300" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl p-4 border backdrop-blur-sm mb-4 animate-fade-in ${
          messageType === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : messageType === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
        }`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {/* Задача дня — красивая карточка */}
      {activeTasks > 0 && (
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-5 border border-white/10 hover:border-blue-500/30 transition-all duration-300 mb-4 cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Задача дня</p>
              <p className="text-lg font-semibold">{tasks[0]?.title}</p>
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-blue-400/30 flex items-center justify-center group-hover:border-blue-400 transition-colors">
              <Check className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      )}

      {/* Карточки статистики — теперь с иконками и градиентами */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: CheckSquare, label: 'Задач', value: activeTasks, sub: 'Активных', color: 'from-blue-500/20 to-blue-600/10' },
          { icon: Droplet, label: 'Вода', value: `${water} мл`, sub: `Цель ${waterGoal} мл`, color: 'from-cyan-500/20 to-blue-500/10' },
          { icon: Flame, label: 'Калории', value: calories, sub: 'из 2000 ккал', color: 'from-orange-500/20 to-red-500/10' },
          { icon: Target, label: 'Привычки', value: `${doneRituals}/${totalRituals}`, sub: `${ritualProgress}% выполнено`, color: 'from-purple-500/20 to-pink-500/10' }
        ].map((item, i) => (
          <div key={i} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.color} p-4 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <item.icon className="w-5 h-5 text-gray-400 mb-2" />
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-sm text-gray-400">{item.label}</p>
              <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Быстрый доступ — теперь с иконками и эффектами */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: CheckSquare, label: 'Задачи', href: '/tasks', color: 'blue' },
          { icon: Utensils, label: 'Заметки', href: '/notes', color: 'yellow' },
          { icon: Wallet, label: 'Финансы', href: '/money', color: 'green' },
          { icon: Coffee, label: 'Еда', href: '/food', color: 'orange' }
        ].map((item, i) => (
          <Link key={i} href={item.href}>
            <div className={`group relative overflow-hidden rounded-2xl bg-white/5 p-4 border border-white/10 hover:border-${item.color}-500/30 transition-all duration-300 hover:scale-105 cursor-pointer text-center`}>
              <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}-500/0 to-${item.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <item.icon className={`w-6 h-6 text-${item.color}-400 mx-auto mb-1 group-hover:scale-110 transition-transform duration-300`} />
                <p className="text-xs text-gray-400 group-hover:text-white transition-colors duration-300">{item.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Кнопка "Перейти к аналитике" */}
      <Link href="/analytics">
        <div className="mt-6 group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-4 border border-white/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="font-medium">Смотреть аналитику</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </Link>
    </div>
  )
}