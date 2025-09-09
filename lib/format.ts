export function formatCurrency(n: number | null | undefined, currency = 'USD') {
  const v = Number(n || 0)
  return v.toLocaleString(undefined, { style: 'currency', currency })
}

