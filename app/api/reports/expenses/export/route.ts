import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9-_\.]/g, '_')
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
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const cardId = searchParams.get('cardId')
  const format = (searchParams.get('format') || 'csv').toLowerCase()

  let query = supabase
    .from('transactions')
    .select('category, amount')
    .eq('type', 'debit')

  if (start) query = query.gte('transaction_date', start)
  if (end) query = query.lte('transaction_date', end)
  if (cardId) query = query.eq('card_id', cardId)

  const { data, error } = await query
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'content-type': 'application/json' } })
  }

  const byCategory: Record<string, number> = {}
  for (const row of (data as any[]) || []) {
    const key = (row.category as string) || 'Uncategorized'
    byCategory[key] = (byCategory[key] || 0) + Number(row.amount || 0)
  }
  const items = Object.entries(byCategory).map(([category, total]) => ({ category, total }))
  const headers = ['Category', 'Total Expense']
  const rows = items.map(it => [it.category, it.total])
  // filename suffix context
  let parts: string[] = []
  if (start || end) parts.push(`${start || 'start'}_to_${end || 'end'}`)
  if (cardId) {
    const { data: card } = await supabase.from('cards').select('card_name, card_number').eq('id', cardId).single()
    if (card) parts.push(`card-${(card as any).card_name || ''}-${(card as any).card_number || ''}`)
    else parts.push(`card-${cardId}`)
  }
  const suffix = parts.length ? `_${parts.join('_')}` : ''
  const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)

  if (format === 'csv') {
    const csv = toCSV(headers, rows)
    return new Response(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${sanitizeFilename('expenses' + suffix + '-' + ts)}.csv"`,
      },
    })
  }

  if (format === 'xlsx' || format === 'excel') {
    const XLSXMod = await import('xlsx')
    const XLSX: any = (XLSXMod as any).default || XLSXMod
    const wb = XLSX.utils.book_new()
    const aoa = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses')
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename="${sanitizeFilename('expenses' + suffix + '-' + ts)}.xlsx"`,
      },
    })
  }

  if (format === 'pdf') {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const margin = 40
    const lineHeight = 16
    const colWidths = [240, 240]

    let idx = 0
    while (idx < rows.length) {
      const page = pdfDoc.addPage([595, 842])
      let y = 842 - margin
      page.drawText('Expense by Category', { x: margin, y, size: 14, font })
      y -= 22
      let x = margin
      ;['Category', 'Total Expense'].forEach((h, i) => {
        page.drawText(h, { x, y, size: 10, font })
        x += colWidths[i]
      })
      y -= lineHeight
      while (idx < rows.length && y > 340) {
        x = margin
        rows[idx].forEach((v, i) => {
          page.drawText(String(v ?? ''), { x, y, size: 10, font })
          x += colWidths[i]
        })
        y -= lineHeight
        idx++
      }

      // Simple horizontal bar chart for top categories
      const top = items.slice().sort((a, b) => Number(b.total) - Number(a.total)).slice(0, 10)
      const chartTop = y - 16
      const chartHeight = Math.min(260, top.length * 20 + 30)
      const chartLeft = margin
      const chartWidth = 595 - margin * 2
      const maxVal = Math.max(1, ...top.map(it => Number(it.total)))
      // axes
      page.drawLine({ start: { x: chartLeft, y: chartTop }, end: { x: chartLeft, y: chartTop - chartHeight }, color: rgb(0.8, 0.8, 0.8), thickness: 1 })
      page.drawLine({ start: { x: chartLeft, y: chartTop - chartHeight }, end: { x: chartLeft + chartWidth, y: chartTop - chartHeight }, color: rgb(0.8, 0.8, 0.8), thickness: 1 })
      top.forEach((it, i) => {
        const barY = chartTop - 20 - i * 20
        const barW = Math.round((Number(it.total) / maxVal) * (chartWidth - 100))
        page.drawText(it.category, { x: chartLeft, y: barY, size: 8, font })
        page.drawRectangle({ x: chartLeft + 100, y: barY, width: Math.max(2, barW), height: 10, color: rgb(0.22, 0.51, 0.96) })
      })
    }

    if (rows.length === 0) {
      const page = pdfDoc.addPage()
      page.drawText('No data.', { x: margin, y: page.getHeight() - margin, size: 12, font })
    }
    const pdfBytes = await pdfDoc.save()
    const ab = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer
    return new Response(ab, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${sanitizeFilename('expenses' + suffix + '-' + ts)}.pdf"`,
      },
    })
  }

  return new Response(JSON.stringify({ error: 'Unsupported format' }), { status: 400, headers: { 'content-type': 'application/json' } })
}
