import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const cardId = searchParams.get('cardId')
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const q = searchParams.get('q')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('transaction_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) query = query.eq('type', type)
  if (cardId) query = query.eq('card_id', cardId)
  if (start) query = query.gte('transaction_date', start)
  if (end) query = query.lte('transaction_date', end)
  if (q) {
    const like = (s: string) => `.%${s.replace(/[%]/g, '')}%`
    query = query.or(
      `description.ilike.${like(q)},vendor_name.ilike.${like(q)},client_partner_name.ilike.${like(q)}`
    )
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const type = String(body.type || '')
  const amountNum = Number(body.amount)
  const card_id = String(body.card_id || '')
  if (!['credit', 'debit'].includes(type)) {
    return NextResponse.json({ error: 'type must be credit or debit' }, { status: 400 })
  }
  if (!isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: 'amount must be > 0' }, { status: 400 })
  }
  if (!card_id) {
    return NextResponse.json({ error: 'card_id is required' }, { status: 400 })
  }

  const payload = {
    type,
    amount: amountNum,
    card_id,
    description: body.description ? String(body.description).trim().slice(0, 1000) : null,
    category: body.category ? String(body.category).trim().slice(0, 100) : null,
    vendor_name: body.vendor_name ? String(body.vendor_name).trim().slice(0, 255) : null,
    client_partner_name: body.client_partner_name ? String(body.client_partner_name).trim().slice(0, 255) : null,
    transaction_date: body.transaction_date || new Date().toISOString(),
    created_by: body.created_by ? String(body.created_by).trim().slice(0, 255) : null,
  }

  const { data, error } = await supabase.from('transactions').insert(payload).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

