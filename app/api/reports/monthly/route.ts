import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function ym(dateStr: string) {
  const d = new Date(dateStr)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const cardId = searchParams.get('cardId')

  let query = supabase.from('transactions').select('type, amount, transaction_date')
  if (start) query = query.gte('transaction_date', start)
  if (end) query = query.lte('transaction_date', end)
  if (cardId) query = query.eq('card_id', cardId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const buckets: Record<string, { credit: number; debit: number }> = {}
  for (const t of (data as any[]) || []) {
    const key = ym(t.transaction_date)
    if (!buckets[key]) buckets[key] = { credit: 0, debit: 0 }
    buckets[key][t.type as 'credit' | 'debit'] += Number(t.amount || 0)
  }
  const months = Object.entries(buckets)
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month))
  return NextResponse.json({ months })
}

