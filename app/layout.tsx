import '@/styles/globals.css'
import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ToastProvider'
import I18nProvider from '@/components/I18nProvider'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Debit Card Manager',
  description: 'Manage company debit card balances and transactions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <I18nProvider>
          <ToastProvider>
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
