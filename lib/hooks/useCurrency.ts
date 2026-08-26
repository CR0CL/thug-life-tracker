'use client'

import { useState, useEffect } from 'react'

export function useCurrency() {
  const [currency, setCurrency] = useState('USD')
  const [symbol, setSymbol] = useState('$')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCurrency = () => {
      const savedCurrency = localStorage.getItem('user_currency') || 'USD'
      const savedSymbol = localStorage.getItem('user_currency_symbol') || '$'
      setCurrency(savedCurrency)
      setSymbol(savedSymbol)
      setLoading(false)
    }

    loadCurrency()
  }, [])

  return { currency, symbol, loading }
}