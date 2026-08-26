'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { Loader2, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react'

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [foodLogs, setFoodLogs] = useState<any[]>([])
  const [rituals, setRituals] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [timeRange])

  const loadData = async () => {
    setLoading(true)
    
    // Получаем пользователя
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Получаем дату для фильтра
    const now = new Date()
    let startDate = new Date()
    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else if (timeRange === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else {
      startDate = new Date(0) // всё время
    }
    const startStr = startDate.toISOString()

    // Загружаем транзакции
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startStr)
      .order('created_at', { ascending: true })
    setTransactions(transactionsData || [])

    // Загружаем еду
    const { data: foodData } = await supabase
      .from('food_logs')
      .select('*')
      .gte('logged_at', startStr)
      .order('logged_at', { ascending: true })
    setFoodLogs(foodData || [])

    // Загружаем привычки
    const { data: ritualsData } = await supabase
      .from('rituals')
      .select('*')
    setRituals(ritualsData || [])

    setLoading(false)
  }

  // Данные для графика расходов по дням
  const getDailyExpenses = () => {
    const daily: Record<string, { day: string, income: number, expense: number }> = {}
    
    transactions.forEach(t => {
      const date = new Date(t.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
      if (!daily[date]) {
        daily[date] = { day: date, income: 0, expense: 0 }
      }
      if (t.type === 'income') {
        daily[date].income += t.amount
      } else {
        daily[date].expense += t.amount
      }
    })

    return Object.values(daily).slice(-7)
  }

  // Данные для круговой диаграммы категорий
  const getCategoryData = () => {
    const categories: Record<string, number> = {}
    const expenses = transactions.filter(t => t.type === 'expense')
    
    expenses.forEach(t => {
      const cat = t.category || 'Другое'
      categories[cat] = (categories[cat] || 0) + t.amount
    })

    return Object.entries(categories).map(([name, value]) => ({ name, value }))
  }

  // Данные для графика калорий
  const getCalorieData = () => {
    const daily: Record<string, { day: string, calories: number }> = {}
    
    foodLogs.forEach(f => {
      const date = new Date(f.logged_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
      if (!daily[date]) {
        daily[date] = { day: date, calories: 0 }
      }
      daily[date].calories += f.calories || 0
    })

    return Object.values(daily).slice(-7)
  }

  // Статистика
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const totalCalories = foodLogs.reduce((sum, f) => sum + (f.calories || 0), 0)
  const completedRituals = rituals.filter(r => r.done).length
  const totalRituals = rituals.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      {/* Заголовок */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm">📊 ANALYTICS</p>
        <h1 className="text-2xl font-bold">Аналитика</h1>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 mb-6">
        {['week', 'month', 'all'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range as any)}
            className={`px-4 py-1 rounded-lg text-xs font-medium transition-colors ${
              timeRange === range 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            {range === 'week' ? 'Неделя' : range === 'month' ? 'Месяц' : 'Всё время'}
          </button>
        ))}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-400">Доходы</p>
          </div>
          <p className="text-lg font-bold text-green-400">${totalIncome.toFixed(0)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <p className="text-xs text-gray-400">Расходы</p>
          </div>
          <p className="text-lg font-bold text-red-400">${totalExpense.toFixed(0)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-gray-400">Баланс</p>
          </div>
          <p className={`text-lg font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${(totalIncome - totalExpense).toFixed(0)}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-gray-400">Привычки</p>
          </div>
          <p className="text-lg font-bold text-purple-400">{completedRituals}/{totalRituals}</p>
        </div>
      </div>

      {/* График доходов/расходов */}
      {getDailyExpenses().length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
          <p className="text-sm text-gray-400 mb-3">Доходы и расходы по дням</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={getDailyExpenses()}>
              <XAxis dataKey="day" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="income" fill="#22c55e" name="Доходы" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Расходы" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Круговая диаграмма категорий */}
      {getCategoryData().length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
          <p className="text-sm text-gray-400 mb-3">Категории расходов</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={getCategoryData()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {getCategoryData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* График калорий */}
      {getCalorieData().length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
          <p className="text-sm text-gray-400 mb-3">Калории по дням</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={getCalorieData()}>
              <XAxis dataKey="day" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Пустое состояние */}
      {transactions.length === 0 && foodLogs.length === 0 && (
        <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
          <p className="text-gray-400 text-sm">Нет данных для аналитики</p>
          <p className="text-gray-500 text-xs mt-1">Добавь транзакции и еду, чтобы увидеть графики</p>
        </div>
      )}
    </div>
  )
}