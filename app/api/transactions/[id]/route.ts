import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function PUT(req: Request, { params }: Params) {
  const { id } = params
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  if (body.type !== undefined) {
    const type = String(body.type)
    if (!['credit', 'debit'].includes(type)) return NextResponse.json({ error: 'type must be credit or debit' }, { status: 400 })
    updates.type = type
  }
  if (body.amount !== undefined) {
    const amountNum = Number(body.amount)
    if (!isFinite(amountNum) || amountNum <= 0) return NextResponse.json({ error: 'amount must be > 0' }, { status: 400 })
    updates.amount = amountNum
  }
  if (body.card_id !== undefined) updates.card_id = String(body.card_id)
  if (body.description !== undefined) updates.description = body.description ? String(body.description).trim().slice(0, 1000) : null
  if (body.category !== undefined) updates.category = body.category ? String(body.category).trim().slice(0, 100) : null
  if (body.vendor_name !== undefined) updates.vendor_name = body.vendor_name ? String(body.vendor_name).trim().slice(0, 255) : null
  if (body.client_partner_name !== undefined) updates.client_partner_name = body.client_partner_name ? String(body.client_partner_name).trim().slice(0, 255) : null
  if (body.transaction_date !== undefined) updates.transaction_date = body.transaction_date
  if (body.created_by !== undefined) updates.created_by = body.created_by ? String(body.created_by).trim().slice(0, 255) : null

  const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = params
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

