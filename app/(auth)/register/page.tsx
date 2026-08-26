'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-green-400 text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-2">Проверьте почту!</h1>
          <p className="text-gray-400 mb-6">
            Мы отправили письмо для подтверждения на {email}
          </p>
          <Link href="/login">
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
              Перейти ко входу
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2">Thug Life Tracker</h1>
        <p className="text-gray-400 mb-8">Создай аккаунт и управляй своей жизнью</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Пароль (минимум 6 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
            minLength={6}
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : 'Создать аккаунт'}
          </button>

          <Link href="/login">
            <button
              type="button"
              className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 font-medium transition-colors"
            >
              Уже есть аккаунт? Войти
            </button>
          </Link>
        </form>
      </div>
    </div>
  )
}
