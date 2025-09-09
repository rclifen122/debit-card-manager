import '@/styles/globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ToastProvider } from '@/components/ToastProvider'

export const metadata: Metadata = {
  title: 'Debit Card Manager',
  description: 'Manage company debit card balances and transactions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <ToastProvider>
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
            <h1 className="font-semibold text-xl">Debit Card Manager</h1>
            <div className="ml-auto flex gap-3 text-sm">
              <Link className="hover:text-blue-600" href="/">Dashboard</Link>
              <Link className="hover:text-blue-600" href="/cards">Cards</Link>
              <Link className="hover:text-blue-600" href="/transactions">Transactions</Link>
              <Link className="hover:text-blue-600" href="/reports">Reports</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
