import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function PUT(req: Request, { params }: Params) {
  const { id } = params
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  if (body.card_name !== undefined) updates.card_name = String(body.card_name).trim().slice(0, 255)
  if (body.department !== undefined) updates.department = body.department ? String(body.department).trim().slice(0, 255) : null
  if (body.card_number !== undefined) {
    const cn = String(body.card_number)
    if (!/^[0-9]{4}$/.test(cn)) return NextResponse.json({ error: 'card_number must be 4 digits' }, { status: 400 })
    updates.card_number = cn
  }

  const { data, error } = await supabase.from('cards').update(updates).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = params
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

