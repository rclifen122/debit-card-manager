"use client"

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from 'react-i18next'

type Card = {
  id: string
  card_number: string
  card_name: string
  department: string | null
  current_balance: number
}

export default function Page() {
  const { t } = useTranslation()
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{t('cards')}</h2>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">{t('add_card')}</h3>
        <form onSubmit={addCard} className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">{t('last_4_digits')}</label>
            <Input required pattern="\\d{4}" value={card_number} onChange={e=>setCardNumber(e.target.value)} placeholder="1234" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">{t('card_name')}</label>
            <Input required value={card_name} onChange={e=>setCardName(e.target.value)} placeholder="Team A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">{t('department')}</label>
            <Input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Sales" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">{t('add_card')}</Button>
          </div>
        </form>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? <div className="text-center text-gray-500 py-10">{t('loading')}</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-gray-800">{c.card_name}</p>
                  <p className="text-sm text-gray-500">{c.department || '—'}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => setConfirmId(c.id)}>{t('delete')}</Button>
              </div>
              <div className="mt-4 flex justify-between items-baseline">
                <p className="text-sm text-gray-600 font-mono">•••• {c.card_number}</p>
                <p className="text-xl font-semibold text-gray-800">
                  {Number(c.current_balance || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </div>
          ))}
          {!cards.length && (
            <div className="md:col-span-2 lg:col-span-3 text-center text-gray-500 py-10">
              {t('no_cards_created_yet')}
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={!!confirmId}
        title={t('delete_card')}
        message={t('delete_card_confirmation')}
        onCancel={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId) deleteCardConfirmed(confirmId); setConfirmId(null) }}
      />
    </div>
  )
}
