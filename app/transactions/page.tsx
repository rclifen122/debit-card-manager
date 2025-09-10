"use client"

import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from 'react-i18next'

type Card = { id: string; card_name: string; card_number: string }
type Tx = {
  id: string; type: 'credit' | 'debit'; amount: number; description: string | null
  category: string | null; vendor_name: string | null; client_partner_name: string | null
  transaction_date: string; card_id: string
}

export default function Page() {
  const { t } = useTranslation()
  const [cards, setCards] = useState<Card[]>([])
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<string>('')
  const [cardId, setCardId] = useState<string>('')
  const [q, setQ] = useState<string>('')
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)

  const [form, setForm] = useState({
    type: 'debit',
    amount: '',
    card_id: '',
    description: '',
    category: '',
    vendor_name: '',
    client_partner_name: '',
    transaction_date: '',
    created_by: '',
  })
  const { addToast } = useToast()

  const totalAmount = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'credit') {
        return acc + Number(tx.amount);
      } else {
        return acc - Number(tx.amount);
      }
    }, 0);
  }, [transactions]);

  function change<K extends keyof typeof form>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function loadCards() {
    const res = await fetch('/api/cards', { cache: 'no-store' })
    const json = await res.json()
    if (res.ok) setCards(json.data || [])
  }

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (cardId) params.set('cardId', cardId)
    if (q) params.set('q', q)
    if (start) params.set('start', start)
    if (end) params.set('end', end)
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    return params.toString()
  }, [type, cardId, q, start, end, limit, offset])

  async function loadTransactions() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/transactions?${query}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setTransactions(json.data || [])
      setCount(json.count || 0)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCards() }, [])
  useEffect(() => { loadTransactions() }, [query])

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        card_id: form.card_id || cardId,
        transaction_date: form.transaction_date || new Date().toISOString(),
        category: form.category || null,
        description: form.description || null,
        vendor_name: form.vendor_name || null,
        client_partner_name: form.client_partner_name || null,
        created_by: form.created_by || null,
      }
      const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('failed_to_create'))
      setForm({ type: 'debit', amount: '', card_id: '', description: '', category: '', vendor_name: '', client_partner_name: '', transaction_date: '', created_by: '' })
      addToast({ title: t('transaction_added'), variant: 'success' })
      await Promise.all([loadTransactions(), loadCards()])
    } catch (e: any) {
      setError(e.message || t('failed_to_create'))
      addToast({ title: t('error'), description: e.message || t('failed_to_create'), variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t('transactions')}</h2>

      <form onSubmit={addTransaction} className="rounded-lg border bg-white p-4 grid gap-3 sm:grid-cols-6">
        <div>
          <label className="block text-sm text-gray-600">{t('type')}</label>
          <Select value={form.type} onChange={e=>change('type', (e.target as HTMLSelectElement).value)}>
            <option value="credit">{t('income')}</option>
            <option value="debit">{t('expense')}</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">{t('amount')}</label>
          <Input required inputMode="decimal" value={form.amount} onChange={e=>change('amount', e.target.value)} placeholder="100.00" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-600">{t('card')}</label>
          <Select value={form.card_id || cardId} onChange={e=>change('card_id', (e.target as HTMLSelectElement).value)} required>
            <option value="">{t('select_card')}</option>
            {cards.map(c => <option key={c.id} value={c.id}>{c.card_name} (•••• {c.card_number})</option>)}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-600">{t('date')}</label>
          <Input type="datetime-local" value={form.transaction_date} onChange={e=>change('transaction_date', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-600">{t('category')}</label>
          <Input value={form.category} onChange={e=>change('category', e.target.value)} placeholder={t('meals_tours_etc')} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-600">{t('vendor')}</label>
          <Input value={form.vendor_name} onChange={e=>change('vendor_name', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-600">{t('client_partner')}</label>
          <Input value={form.client_partner_name} onChange={e=>change('client_partner_name', e.target.value)} />
        </div>
        <div className="sm:col-span-4">
          <label className="block text-sm text-gray-600">{t('description')}</label>
          <Input value={form.description} onChange={e=>change('description', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-600">{t('created_by')}</label>
          <Input value={form.created_by} onChange={e=>change('created_by', e.target.value)} />
        </div>
        <div className="sm:col-span-6 flex justify-end">
          <Button type="submit">{t('add_transaction')}</Button>
        </div>
      </form>

      <div className="rounded-lg border bg-white p-4 grid gap-3 sm:grid-cols-6">
        <div>
          <label className="block text-sm text-gray-600">{t('type')}</label>
          <Select value={type} onChange={e=>{setType((e.target as HTMLSelectElement).value); setOffset(0)}}>
            <option value="">{t('all')}</option>
            <option value="credit">{t('income')}</option>
            <option value="debit">{t('expense')}</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-600">{t('card')}</label>
          <Select value={cardId} onChange={e=>{setCardId((e.target as HTMLSelectElement).value); setOffset(0)}}>
            <option value="">{t('all_cards')}</option>
            {cards.map(c => <option key={c.id} value={c.id}>{c.card_name} (•••• {c.card_number})</option>)}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-600">{t('search')}</label>
          <Input value={q} onChange={e=>{setQ(e.target.value); setOffset(0)}} placeholder={t('search_placeholder')} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">{t('start')}</label>
          <Input type="date" value={start} onChange={e=>{setStart(e.target.value); setOffset(0)}} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">{t('end')}</label>
          <Input type="date" value={end} onChange={e=>{setEnd(e.target.value); setOffset(0)}} />
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-auto max-h-[600px]">
        {error && <div className="p-3 text-sm text-red-600">{error}</div>}
        {loading ? <div className="p-3 text-sm text-gray-500">{t('loading')}</div> : (
          <>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="text-left text-gray-500">
                  <th className="py-2 px-3">{t('date')}</th>
                  <th className="py-2 px-3">{t('type')}</th>
                  <th className="py-2 px-3">{t('amount')}</th>
                  <th className="py-2 px-3">{t('category')}</th>
                  <th className="py-2 px-3">{t('vendor')}</th>
                  <th className="py-2 px-3">{t('client_partner')}</th>
                  <th className="py-2 px-3">{t('description')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-t">
                    <td className="py-2 px-3">{new Date(t.transaction_date).toLocaleString()}</td>
                    <td className="py-2 px-3 capitalize">{t.type}</td>
                    <td className={`py-2 px-3 ${t.type === 'debit' ? 'text-red-600' : 'text-green-700'}`}>
                      {(t.type === 'debit' ? -t.amount : t.amount).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                    </td>
                    <td className="py-2 px-3">{t.category || '—'}</td>
                    <td className="py-2 px-3">{t.vendor_name || '—'}</td>
                    <td className="py-2 px-3">{t.client_partner_name || '—'}</td>
                    <td className="py-2 px-3">{t.description || '—'}</td>
                  </tr>
                ))}
                {!transactions.length && (
                  <tr><td className="py-3 px-3 text-gray-500" colSpan={7}>{t('no_transactions_found')}</td></tr>
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot className="sticky bottom-0 bg-gray-100 font-semibold">
                  <tr>
                    <td colSpan={2} className="py-2 px-3 text-right">{t('total')}</td>
                    <td className={`py-2 px-3 ${totalAmount < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {totalAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-gray-600">{t('showing_of', { showing: transactions.length, total: count })}</div>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={offset===0} onClick={()=>setOffset(Math.max(0, offset - 50))}>{t('prev')}</Button>
                <Button variant="secondary" disabled={offset + 50 >= count} onClick={()=>setOffset(offset + 50)}>{t('next')}</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
