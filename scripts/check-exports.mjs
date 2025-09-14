// Simple e2e checks for export endpoints
// Usage: npm run check:exports [BASE_URL]
// BASE_URL defaults to http://localhost:3000

const base = process.argv[2] || process.env.BASE_URL || 'http://localhost:3000'

const endpoints = [
  '/api/transactions/export?format=csv',
  '/api/transactions/export?format=xlsx',
  '/api/transactions/export?format=pdf',
  '/api/reports/monthly/export?format=csv',
  '/api/reports/monthly/export?format=xlsx',
  '/api/reports/monthly/export?format=pdf',
  '/api/reports/expenses/export?format=csv',
  '/api/reports/expenses/export?format=xlsx',
  '/api/reports/expenses/export?format=pdf',
]

async function check(url) {
  const full = base.replace(/\/$/, '') + url
  try {
    const res = await fetch(full)
    const ok = res.ok
    const ct = res.headers.get('content-type')
    const cd = res.headers.get('content-disposition')
    console.log(`${ok ? 'OK' : 'ERR'} ${res.status} - ${url} | ${ct} | ${cd ? 'has filename' : 'no filename'}`)
  } catch (e) {
    console.log(`ERR - ${url} -> ${e.message}`)
  }
}

;(async () => {
  console.log(`Checking exports against ${base}`)
  for (const ep of endpoints) {
    // eslint-disable-next-line no-await-in-loop
    await check(ep)
  }
})()

