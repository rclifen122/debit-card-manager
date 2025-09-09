import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase.from('cards').select('current_balance')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const total = (data || []).reduce((acc, r) => acc + Number((r as any).current_balance || 0), 0)
  return NextResponse.json({ total })
}

