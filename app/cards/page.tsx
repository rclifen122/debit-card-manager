"use client"

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'

type Card = {
  id: string
  card_number: string
  card_name: string
  department: string | null
  current_balance: number
}

export default function Page() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [card_number, setCardNumber] = useState('')
  const [card_name, setCardName] = useState('')
  const [department, setDepartment] = useState('')

  const [confirmId, setConfirmId] = useState<string | null>(null)
  const { addToast } = useToast()

  async function load() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/cards', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load cards')
      setCards(json.data || [])
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function addCard(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_number, card_name, department: department || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add')
      setCardNumber(''); setCardName(''); setDepartment('')
      addToast({ title: 'Card created', description: `${json.data.card_name} (•••• ${json.data.card_number})`, variant: 'success' })
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to add')
      addToast({ title: 'Error', description: e.message || 'Failed to add', variant: 'error' })
    }
  }

  async function deleteCardConfirmed(id: string) {
    const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' })
    if (res.ok) {
      addToast({ title: 'Card deleted', variant: 'success' })
      load()
    } else {
      const json = await res.json().catch(() => ({}))
      addToast({ title: 'Error', description: json.error || 'Failed to delete', variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Cards</h2>

      <form onSubmit={addCard} className="rounded-lg border bg-white p-4 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <label className="block text-sm text-gray-600">Last 4 Digits</label>
          <Input required pattern="\\d{4}" value={card_number} onChange={e=>setCardNumber(e.target.value)} placeholder="1234" />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm text-gray-600">Card Name</label>
          <Input required value={card_name} onChange={e=>setCardName(e.target.value)} placeholder="Team A" />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm text-gray-600">Department</label>
          <Input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Sales" />
        </div>
        <div className="sm:col-span-1 flex items-end">
          <Button type="submit" className="w-full">Add Card</Button>
        </div>
      </form>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? <div className="text-sm text-gray-500">Loading…</div> : (
        <div className="rounded-lg border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Department</th>
                <th className="py-2 px-3">Card</th>
                <th className="py-2 px-3">Balance</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {cards.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="py-2 px-3">{c.card_name}</td>
                  <td className="py-2 px-3">{c.department || '—'}</td>
                  <td className="py-2 px-3">•••• {c.card_number}</td>
                  <td className="py-2 px-3">{Number(c.current_balance || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                  <td className="py-2 px-3 text-right">
                    <Button variant="danger" onClick={()=>setConfirmId(c.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {!cards.length && (
                <tr><td className="py-3 px-3 text-gray-500" colSpan={5}>No cards created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={!!confirmId}
        title="Delete card"
        message="This will remove the card and its transactions. Proceed?"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId) deleteCardConfirmed(confirmId); setConfirmId(null) }}
      />
    </div>
  )
}

// Confirm dialog mount
