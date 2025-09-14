import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9-_\.]/g, '_')
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toCSV(headers: string[], rows: (string | number | null)[][]) {
  const escape = (val: any) => {
    if (val === null || val === undefined) return ''
    const s = String(val)
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const cardId = searchParams.get('cardId')
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const q = searchParams.get('q')
  const format = (searchParams.get('format') || 'csv').toLowerCase()

  let query = supabase
    .from('transactions')
    .select('id, transaction_date, type, amount, category, vendor_name, client_partner_name, description, card_id, cards(card_name, card_number)')
    .order('transaction_date', { ascending: false })

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

  // Export up to a generous cap to avoid huge responses
  // Supabase range is inclusive
  query = query.range(0, 49999)

  const { data, error } = await query
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'content-type': 'application/json' } })
  }

  const rows = (data as any[] | null) || []
  const headers = [
    'Date', 'Type', 'Amount', 'Category', 'Vendor', 'Client/Partner', 'Description', 'Card Name', 'Card Last4', 'Card ID'
  ]
  const mapped = rows.map(r => [
    fmtDate(r.transaction_date),
    r.type,
    Number(r.amount || 0),
    r.category || '',
    r.vendor_name || '',
    r.client_partner_name || '',
    r.description || '',
    (r as any).cards?.card_name || '',
    (r as any).cards?.card_number || '',
    r.card_id,
  ])

  // Filename suffix context
  const suffixParts: string[] = []
  if (type) suffixParts.push(`type-${type}`)
  if (start || end) suffixParts.push(`${start || 'start'}_to_${end || 'end'}`)
  if (cardId) {
    const { data: card } = await supabase.from('cards').select('card_name, card_number').eq('id', cardId).single()
    if (card) suffixParts.push(`card-${(card as any).card_name || ''}-${(card as any).card_number || ''}`)
    else suffixParts.push(`card-${cardId}`)
  }
  if (q) suffixParts.push(`q-${q.slice(0,20)}`)
  const suffix = suffixParts.length ? `_${suffixParts.join('_')}` : ''
  const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)

  if (format === 'csv') {
    const csv = toCSV(headers, mapped)
    return new Response(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${sanitizeFilename('transactions' + suffix + '-' + ts)}.csv"`,
      },
    })
  }

  if (format === 'xlsx' || format === 'excel') {
    const XLSXMod = await import('xlsx')
    const XLSX: any = (XLSXMod as any).default || XLSXMod
    const wb = XLSX.utils.book_new()
    const aoa = [headers, ...mapped]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename="${sanitizeFilename('transactions' + suffix + '-' + ts)}.xlsx"`,
      },
    })
  }

  if (format === 'pdf') {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const margin = 40
    const lineHeight = 14
    const colWidths = [90, 45, 65, 80, 90, 90, 150, 110, 70, 120]
    const headersToDraw = headers

    const drawTable = (page: any, startY: number, startRow: number) => {
      let y = startY
      page.drawText('Transactions Export', { x: margin, y, size: 14, font, color: rgb(0, 0, 0) })
      y -= 20
      // headers
      let x = margin
      headersToDraw.forEach((h, idx) => {
        page.drawText(h, { x, y, size: 9, font })
        x += colWidths[idx] || 80
      })
      y -= lineHeight

      let rowIndex = startRow
      while (rowIndex < mapped.length && y > margin) {
        const row = mapped[rowIndex]
        x = margin
        row.forEach((cell, idx) => {
          const text = String(cell ?? '')
          page.drawText(text.length > 40 ? text.slice(0, 37) + '…' : text, { x, y, size: 9, font })
          x += colWidths[idx] || 80
        })
        y -= lineHeight
        rowIndex++
      }
      return rowIndex
    }

    let idx = 0
    while (idx < mapped.length) {
      const page = pdfDoc.addPage([842, 595]) // A4 landscape
      idx = drawTable(page, 595 - margin, idx)
    }
    if (mapped.length === 0) {
      const page = pdfDoc.addPage()
      page.drawText('No transactions found.', { x: margin, y: page.getHeight() - margin, size: 12, font })
    }

    const pdfBytes = await pdfDoc.save()
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${sanitizeFilename('transactions' + suffix + '-' + ts)}.pdf"`,
      },
    })
  }

  return new Response(JSON.stringify({ error: 'Unsupported format' }), { status: 400, headers: { 'content-type': 'application/json' } })
}
