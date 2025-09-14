import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9-_\.]/g, '_')
}

function ym(dateStr: string) {
  const d = new Date(dateStr)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
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

  let query = supabase.from('transactions').select('type, amount, transaction_date')
  if (start) query = query.gte('transaction_date', start)
  if (end) query = query.lte('transaction_date', end)
  if (cardId) query = query.eq('card_id', cardId)

  const { data, error } = await query
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'content-type': 'application/json' } })
  }

  const buckets: Record<string, { credit: number; debit: number }> = {}
  for (const t of (data as any[]) || []) {
    const key = ym(t.transaction_date)
    if (!buckets[key]) buckets[key] = { credit: 0, debit: 0 }
    buckets[key][t.type as 'credit' | 'debit'] += Number(t.amount || 0)
  }
  const months = Object.entries(buckets)
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const headers = ['Month', 'Income (credit)', 'Expense (debit)']
  const rows = months.map(m => [m.month, m.credit, m.debit])

  // Build filename suffix context
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
        'content-disposition': `attachment; filename="${sanitizeFilename('monthly' + suffix + '-' + ts)}.csv"`,
      },
    })
  }

  if (format === 'xlsx' || format === 'excel') {
    const XLSXMod = await import('xlsx')
    const XLSX: any = (XLSXMod as any).default || XLSXMod
    const wb = XLSX.utils.book_new()
    const aoa = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly')
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename="${sanitizeFilename('monthly' + suffix + '-' + ts)}.xlsx"`,
      },
    })
  }

  if (format === 'pdf') {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const margin = 40
    const lineHeight = 16
    const colWidths = [120, 180, 180]

    const mapped = rows
    let idx = 0
    while (idx < mapped.length) {
      const page = pdfDoc.addPage([595, 842]) // A4 portrait
      let y = 842 - margin
      page.drawText('Monthly Summary', { x: margin, y, size: 14, font })
      y -= 22
      // headers
      let x = margin
      headers.forEach((h, i) => {
        page.drawText(h, { x, y, size: 10, font })
        x += colWidths[i]
      })
      y -= lineHeight
      while (idx < mapped.length && y > 320) {
        x = margin
        mapped[idx].forEach((v, i) => {
          page.drawText(String(v ?? ''), { x, y, size: 10, font })
          x += colWidths[i]
        })
        y -= lineHeight
        idx++
      }

      // Simple bar chart for recent months
      const chartTop = y - 16
      const chartHeight = 220
      const chartLeft = margin
      const chartWidth = 595 - margin * 2
      const maxBars = Math.min(12, months.length)
      const recent = months.slice(-maxBars)
      const maxVal = Math.max(1, ...recent.map(m => Math.max(m.credit, m.debit)))
      const barGroupWidth = chartWidth / (recent.length || 1)
      const barWidth = Math.max(6, (barGroupWidth - 8) / 2)
      // axes
      page.drawLine({ start: { x: chartLeft, y: chartTop - chartHeight }, end: { x: chartLeft + chartWidth, y: chartTop - chartHeight }, color: rgb(0.8, 0.8, 0.8), thickness: 1 })
      page.drawLine({ start: { x: chartLeft, y: chartTop - chartHeight }, end: { x: chartLeft, y: chartTop }, color: rgb(0.8, 0.8, 0.8), thickness: 1 })
      // bars
      recent.forEach((m, i) => {
        const groupX = chartLeft + i * barGroupWidth + 4
        const creditH = Math.round((m.credit / maxVal) * chartHeight)
        const debitH = Math.round((m.debit / maxVal) * chartHeight)
        // credit - green
        page.drawRectangle({ x: groupX, y: chartTop - creditH, width: barWidth, height: creditH, color: rgb(0.09, 0.64, 0.29) })
        // debit - red
        page.drawRectangle({ x: groupX + barWidth + 2, y: chartTop - debitH, width: barWidth, height: debitH, color: rgb(0.86, 0.15, 0.15) })
        // label month
        page.drawText(m.month.slice(2), { x: groupX, y: chartTop - chartHeight - 12, size: 7, font })
      })
      // legend
      page.drawRectangle({ x: chartLeft, y: chartTop + 4, width: 8, height: 8, color: rgb(0.09, 0.64, 0.29) })
      page.drawText('Income', { x: chartLeft + 12, y: chartTop + 3, size: 9, font })
      page.drawRectangle({ x: chartLeft + 70, y: chartTop + 4, width: 8, height: 8, color: rgb(0.86, 0.15, 0.15) })
      page.drawText('Expense', { x: chartLeft + 84, y: chartTop + 3, size: 9, font })
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
        'content-disposition': `attachment; filename="${sanitizeFilename('monthly' + suffix + '-' + ts)}.pdf"`,
      },
    })
  }

  return new Response(JSON.stringify({ error: 'Unsupported format' }), { status: 400, headers: { 'content-type': 'application/json' } })
}
