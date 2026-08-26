'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function MoneyPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [balance, setBalance] = useState(0)
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const supabase = createClient()

  const categories = {
    expense: ['Еда', 'Транспорт', 'Развлечения', 'Покупки', 'Связь', 'Жильё', 'Здоровье', 'Другое'],
    income: ['Зарплата', 'Фриланс', 'Подарки', 'Инвестиции', 'Другое']
  }

  // Получаем пользователя и загружаем транзакции
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        // Загружаем валюту из профиля
        const { data: profile } = await supabase
          .from('profiles')
          .select('currency')
          .eq('user_id', user.id)
          .single()
        
        if (profile?.currency) {
          const symbols: Record<string, string> = {
            USD: '$', EUR: '€', GBP: '£', RUB: '₽',
            KZT: '₸', UAH: '₴', BYN: 'Br', AMD: '֏',
            GEL: '₾', AZN: '₼', BTC: '₿', ETH: '⟠'
          }
          setCurrencySymbol(symbols[profile.currency] || '$')
        }
        await loadTransactions()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadTransactions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Ошибка загрузки:', error)
    } else {
      setTransactions(data || [])
      calculateStats(data || [])
    }
    setLoading(false)
  }

  const calculateStats = (data: any[]) => {
    let income = 0
    let expense = 0
    data.forEach(t => {
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    })
    setTotalIncome(income)
    setTotalExpense(expense)
    setBalance(income - expense)
  }

  // Добавление транзакции
  const addTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Введите сумму')
      return
    }

    if (!category) {
      alert('Выберите категорию')
      return
    }

    if (!userId) {
      alert('Вы не авторизованы')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('transactions')
      .insert({ 
        amount: parseFloat(amount),
        description: description.trim() || null,
        category: category,
        type: type,
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
      const newTransactions = [data[0], ...transactions]
      setTransactions(newTransactions)
      calculateStats(newTransactions)
      setAmount('')
      setDescription('')
      setCategory('')
    }
    setSaving(false)
  }

  // Удаление транзакции
  const deleteTransaction = async (id: string) => {
    if (!confirm('Удалить транзакцию?')) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    const newTransactions = transactions.filter(t => t.id !== id)
    setTransactions(newTransactions)
    calculateStats(newTransactions)
  }

  // Форматирование даты
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Форматирование суммы
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

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
      <div className="mb-6">
        <p className="text-gray-400 text-sm">MONEY</p>
        <h1 className="text-2xl font-bold">Финансы</h1>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
          <p className="text-xs text-gray-400">Баланс</p>
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {currencySymbol}{formatAmount(balance)}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
          <p className="text-xs text-gray-400">Доходы</p>
          <p className="text-lg font-bold text-green-400">{currencySymbol}{formatAmount(totalIncome)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
          <p className="text-xs text-gray-400">Расходы</p>
          <p className="text-lg font-bold text-red-400">{currencySymbol}{formatAmount(totalExpense)}</p>
        </div>
      </div>

      {/* Форма добавления */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => {
              setType('expense')
              setCategory('')
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === 'expense' 
                ? 'bg-red-600 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <TrendingDown className="w-4 h-4 inline mr-1" />
            Расход
          </button>
          <button
            onClick={() => {
              setType('income')
              setCategory('')
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === 'income' 
                ? 'bg-green-600 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Доход
          </button>
        </div>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Сумма"
          className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
          disabled={saving}
        />

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (необязательно)"
          className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
          disabled={saving}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
          disabled={saving}
        >
          <option value="" className="bg-black">Выберите категорию</option>
          {categories[type].map(cat => (
            <option key={cat} value={cat} className="bg-black">
              {cat}
            </option>
          ))}
        </select>

        <button
          onClick={addTransaction}
          disabled={saving || !amount || !category}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Добавить транзакцию
            </>
          )}
        </button>
      </div>

      {/* Список транзакций */}
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
            <Wallet className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Нет транзакций</p>
            <p className="text-gray-500 text-xs mt-1">Добавь свой первый доход или расход</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  transaction.type === 'income' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {transaction.type === 'income' 
                    ? <TrendingUp className="w-4 h-4" />
                    : <TrendingDown className="w-4 h-4" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transaction.category}
                  </p>
                  {transaction.description && (
                    <p className="text-xs text-gray-400 truncate">
                      {transaction.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${
                  transaction.type === 'income' 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{formatAmount(transaction.amount)}
                </p>
                <button
                  onClick={() => deleteTransaction(transaction.id)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
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