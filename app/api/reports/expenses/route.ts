import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const cardId = searchParams.get('cardId')

  let query = supabase
    .from('transactions')
    .select('category, amount')
    .eq('type', 'debit')

  if (start) query = query.gte('transaction_date', start)
  if (end) query = query.lte('transaction_date', end)
  if (cardId) query = query.eq('card_id', cardId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const byCategory: Record<string, number> = {}
  for (const row of (data as any[]) || []) {
    const key = (row.category as string) || 'Uncategorized'
    byCategory[key] = (byCategory[key] || 0) + Number(row.amount || 0)
  }
  const items = Object.entries(byCategory).map(([category, total]) => ({ category, total }))
  return NextResponse.json({ items })
}

