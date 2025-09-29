import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('card_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const card_number = String(body.card_number ?? '')
  const card_name = String(body.card_name ?? '').trim()
  const department = body.department ? String(body.department).trim() : null

  if (!/^[0-9]+$/.test(card_number)) {
    return NextResponse.json({ error: 'card_number must be a string of digits' }, { status: 400 })
  }
  if (!card_name) {
    return NextResponse.json({ error: 'card_name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cards')
    .insert({ card_number, card_name: card_name.slice(0, 255), department })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

