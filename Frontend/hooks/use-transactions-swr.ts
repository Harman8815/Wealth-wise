"use client"

import useSWR from 'swr'
import { transactionApi } from '@/api/services'

const fetcher = async (key: string, ...args: any[]) => {
  // key will be the endpoint-like identifier
  if (key === 'transactions_all') {
    const [filters, page, pageSize] = args
    return transactionApi.getAll({ ...filters, page, pageSize })
  }
  if (key === 'transactions_summary') {
    const [startDate, endDate] = args
    return transactionApi.getSummary(startDate, endDate)
  }
  if (key === 'transactions_monthly') {
    const [months] = args
    return transactionApi.getMonthlyStats(months)
  }
  if (key === 'transactions_recent') {
    const [limit] = args
    return transactionApi.getAll({ page: 1, pageSize: limit })
  }
  return null
}

export const useSWRTransactions = (filters?: any, page = 1, pageSize = 20) => {
  const key = ['transactions_all', filters, page, pageSize]
  const { data, error, isLoading } = useSWR(key, () => fetcher('transactions_all', filters, page, pageSize), {
    revalidateOnFocus: false,
  })

  return {
    data,
    error,
    isLoading,
  }
}

export const useSWRTransactionSummary = (startDate?: string, endDate?: string) => {
  const key = ['transactions_summary', startDate, endDate]
  const { data, error, isLoading } = useSWR(key, () => fetcher('transactions_summary', startDate, endDate), {
    revalidateOnFocus: false,
  })

  return { data, error, isLoading }
}

export const useSWRMonthlyStats = (months = 6) => {
  const key = ['transactions_monthly', months]
  const { data, error, isLoading } = useSWR(key, () => fetcher('transactions_monthly', months), {
    revalidateOnFocus: false,
  })

  return { data, error, isLoading }
}

export const useSWRRecentTransactions = (limit = 5) => {
  const key = ['transactions_recent', limit]
  const { data, error, isLoading } = useSWR(key, () => fetcher('transactions_recent', limit), {
    revalidateOnFocus: false,
  })

  return { data, error, isLoading }
}
