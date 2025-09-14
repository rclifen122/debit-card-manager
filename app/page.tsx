'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Tx = {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string | null
  category: string | null
  vendor_name: string | null
  client_partner_name: string | null
  transaction_date: string
  card_id: string
}

export default function Page() {
  const { t } = useTranslation()
  const [total, setTotal] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('xlsx')
  const [exporting, setExporting] = useState(false)

  const recentTotalAmount = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'credit') {
        return acc + Number(tx.amount)
      } else {
        return acc - Number(tx.amount)
      }
    }, 0)
  }, [transactions])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [balRes, txRes] = await Promise.all([
        fetch('/api/reports/balance', { cache: 'no-store' }),
        fetch('/api/transactions?limit=10', { cache: 'no-store' }),
      ])
      const bal = await balRes.json()
      const tx = await txRes.json()
      if (!balRes.ok) throw new Error(bal.error || 'Failed to load balance')
      if (!txRes.ok) throw new Error(tx.error || 'Failed to load transactions')
      setTotal(bal.total ?? 0)
      setTransactions(tx.data ?? [])
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function exportRecent() {
    try {
      setExporting(true)
      const params = new URLSearchParams()
      params.set('limit', '10')
      params.set('format', exportFormat)
      const url = `/api/transactions/export?${params.toString()}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const a = document.createElement('a')
      const cd = res.headers.get('content-disposition') || ''
      const match = /filename="?([^";]+)"?/i.exec(cd)
      const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
      a.href = URL.createObjectURL(blob)
      a.download = match ? match[1] : `recent-transactions-${ts}.${exportFormat === 'xlsx' ? 'xlsx' : exportFormat}`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e: any) {
      setError(e.message || t('export_failed'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">{t('total_balance')}</div>
          <div className="mt-2 text-3xl font-bold text-gray-800">
            {loading ? t('loading') : total?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
          </div>
        </div>
        <a
          href="/transactions"
          className="group rounded-xl border bg-white p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">{t('quick_action')}</div>
              <div className="mt-1 font-semibold text-gray-800 group-hover:text-blue-600">{t('add_income')}</div>
            </div>
          </div>
        </a>
        <a
          href="/transactions"
          className="group rounded-xl border bg-white p-6 hover:border-red-500 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-100 text-red-600 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">{t('quick_action')}</div>
              <div className="mt-1 font-semibold text-gray-800 group-hover:text-red-600">{t('record_expense')}</div>
            </div>
          </div>
        </a>
      </section>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{t('recent_transactions')}</h2>
          <div className="flex items-center gap-2">
            <button onClick={load} className="text-sm font-medium text-blue-600 hover:underline">
              {t('refresh')}
            </button>
            <div className="flex items-center gap-2">
              <select
                className="border rounded px-2 py-1 text-sm"
                value={exportFormat}
                onChange={e => setExportFormat(e.target.value as any)}
              >
                <option value="xlsx">{t('excel')}</option>
                <option value="csv">{t('csv')}</option>
                <option value="pdf">{t('pdf')}</option>
              </select>
              <button
                className="text-sm font-medium text-gray-700 border rounded px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                disabled={exporting}
                onClick={exportRecent}
                type="button"
              >
                {t('export')}
              </button>
            </div>
          </div>
        </div>
        {error && <div className="px-6 pb-6 text-sm text-red-600">{error}</div>}
        {loading ? (
          <div className="px-6 pb-6 text-sm text-gray-500">{t('loading')}</div>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="text-left text-gray-600 font-medium">
                  <th className="py-3 px-6">{t('date')}</th>
                  <th className="py-3 px-6">{t('type')}</th>
                  <th className="py-3 px-6">{t('amount')}</th>
                  <th className="py-3 px-6">{t('category')}</th>
                  <th className="py-3 px-6">{t('vendor')}</th>
                  <th className="py-3 px-6">{t('client_partner')}</th>
                  <th className="py-3 px-6">{t('description')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={tx.id} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-4 px-6 text-gray-700">{new Date(tx.transaction_date).toLocaleString()}</td>
                    <td className="py-4 px-6 capitalize">{tx.type}</td>
                    <td className={`py-4 px-6 font-medium ${tx.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                      {(tx.type === 'debit' ? -tx.amount : tx.amount).toLocaleString(undefined, {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </td>
                    <td className="py-4 px-6 text-gray-700">{tx.category || t('na')}</td>
                    <td className="py-4 px-6 text-gray-700">{tx.vendor_name || t('na')}</td>
                    <td className="py-4 px-6 text-gray-700">{tx.client_partner_name || t('na')}</td>
                    <td className="py-4 px-6 text-gray-700">{tx.description || t('na')}</td>
                  </tr>
                ))}
                {!transactions.length && (
                  <tr>
                    <td className="py-6 px-6 text-center text-gray-500" colSpan={7}>
                      {t('no_transactions_yet')}
                    </td>
                  </tr>
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot className="sticky bottom-0 bg-gray-100 font-semibold">
                  <tr>
                    <td colSpan={2} className="py-2 px-6 text-right">
                      {t('total')}
                    </td>
                    <td className={`py-2 px-6 ${recentTotalAmount < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {recentTotalAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
