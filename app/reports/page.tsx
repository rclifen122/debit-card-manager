'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Input from '@/components/ui/Input'

const Charts = dynamic(() => import('./charts'), {
  ssr: false,
  loading: () => <div className="text-sm text-gray-500">Loading charts...</div>
})

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
        <Charts monthly={monthly} categories={categories} />
      )}
    </div>
  )
}