"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { formatCurrency } from '@/lib/format'

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })

type Monthly = { month: string; credit: number; debit: number }
type Item = { category: string; total: number }

export default function Page() {
  const [monthly, setMonthly] = useState<Monthly[]>([])
  const [categories, setCategories] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  async function load() {
    setLoading(true); setError(null)
    try {
      const qs = new URLSearchParams()
      if (start) qs.set('start', start)
      if (end) qs.set('end', end)
      const [mRes, cRes] = await Promise.all([
        fetch(`/api/reports/monthly?${qs.toString()}`, { cache: 'no-store' }),
        fetch(`/api/reports/expenses?${qs.toString()}`, { cache: 'no-store' }),
      ])
      const m = await mRes.json()
      const c = await cRes.json()
      if (!mRes.ok) throw new Error(m.error || 'Failed monthly')
      if (!cRes.ok) throw new Error(c.error || 'Failed categories')
      setMonthly(m.months || [])
      setCategories(c.items || [])
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { load() }, [start, end])

  const totalExpense = categories.reduce((a, b) => a + Number(b.total || 0), 0)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Reports</h2>

      <div className="rounded-lg border bg-white p-4 grid gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-sm text-gray-600">Start</label>
          <Input type="date" value={start} onChange={e=>setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">End</label>
          <Input type="date" value={end} onChange={e=>setEnd(e.target.value)} />
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? <div className="text-sm text-gray-500">Loading…</div> : (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-4">
            <h3 className="mb-3 font-medium">Monthly Summary</h3>
            {monthly.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Legend />
                    <Line type="monotone" dataKey="credit" stroke="#16a34a" name="Income" />
                    <Line type="monotone" dataKey="debit" stroke="#dc2626" name="Expense" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No data.</div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 font-medium">Expense by Category</h3>
            {categories.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categories} dataKey="total" nameKey="category" outerRadius={90}>
                      {categories.map((_, idx) => (
                        <Cell key={idx} fill={["#60a5fa","#f472b6","#34d399","#f59e0b","#f87171","#a78bfa"][idx % 6]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No data.</div>
            )}
            {!!categories.length && (
              <div className="mt-3 flex items-center justify-between text-sm font-medium">
                <div>Total</div>
                <div className="text-red-700">{formatCurrency(totalExpense)}</div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
