'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

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
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('xlsx')
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
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
  }, [start, end])

  useEffect(() => { load() }, [load])

  async function triggerDownload(url: string, fallbackName: string) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(await res.text())
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const cd = res.headers.get('content-disposition') || ''
    const match = /filename="?([^";]+)"?/i.exec(cd)
    a.download = match ? match[1] : fallbackName
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function exportMonthly() {
    try {
      setExporting(true)
      const qs = new URLSearchParams()
      if (start) qs.set('start', start)
      if (end) qs.set('end', end)
      qs.set('format', format)
      const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
      await triggerDownload(`/api/reports/monthly/export?${qs.toString()}`, `monthly-${ts}.${format === 'xlsx' ? 'xlsx' : format}`)
    } catch (e: any) {
      setError(e.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function exportExpenses() {
    try {
      setExporting(true)
      const qs = new URLSearchParams()
      if (start) qs.set('start', start)
      if (end) qs.set('end', end)
      qs.set('format', format)
      const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
      await triggerDownload(`/api/reports/expenses/export?${qs.toString()}`, `expenses-${ts}.${format === 'xlsx' ? 'xlsx' : format}`)
    } catch (e: any) {
      setError(e.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

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
        <div>
          <label className="block text-sm text-gray-600">Format</label>
          <Select value={format} onChange={e=>setFormat((e.target as HTMLSelectElement).value as any)}>
            <option value="xlsx">Excel</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button variant="secondary" disabled={exporting} onClick={exportMonthly}>Export Monthly</Button>
          <Button variant="secondary" disabled={exporting} onClick={exportExpenses}>Export Expenses</Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <Charts monthly={monthly} categories={categories} />
      )}
    </div>
  )
}
