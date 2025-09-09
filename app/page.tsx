'use client'

import { useEffect, useState } from 'react'

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
  const [total, setTotal] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true); setError(null)
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

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Total Balance</div>
          <div className="mt-2 text-2xl font-semibold">
            {loading ? '—' : total?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
          </div>
        </div>
        <a href="/transactions" className="rounded-lg border bg-white p-4 hover:border-blue-400">
          <div className="text-sm text-gray-500">Quick Action</div>
          <div className="mt-2 font-medium">Record Expense</div>
        </a>
        <a href="/transactions" className="rounded-lg border bg-white p-4 hover:border-blue-400">
          <div className="text-sm text-gray-500">Quick Action</div>
          <div className="mt-2 font-medium">Add Income</div>
        </a>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <button onClick={load} className="text-sm text-blue-600 hover:underline">Refresh</button>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {loading ? <div className="text-sm text-gray-500">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Vendor</th>
                  <th className="py-2 pr-4">Client/Partner</th>
                  <th className="py-2 pr-4">Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-t">
                    <td className="py-2 pr-4">{new Date(t.transaction_date).toLocaleString()}</td>
                    <td className="py-2 pr-4 capitalize">{t.type}</td>
                    <td className={`py-2 pr-4 ${t.type === 'debit' ? 'text-red-600' : 'text-green-700'}`}>
                      {(t.type === 'debit' ? -t.amount : t.amount).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                    </td>
                    <td className="py-2 pr-4">{t.category || '—'}</td>
                    <td className="py-2 pr-4">{t.vendor_name || '—'}</td>
                    <td className="py-2 pr-4">{t.client_partner_name || '—'}</td>
                    <td className="py-2 pr-4">{t.description || '—'}</td>
                  </tr>
                ))}
                {!transactions.length && (
                  <tr><td className="py-3 text-gray-500" colSpan={7}>No transactions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

