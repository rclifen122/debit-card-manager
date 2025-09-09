'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: 'success' | 'error' | 'info'
}

type Ctx = {
  addToast: (t: Omit<Toast, 'id'> & { timeoutMs?: number }) => void
}

const ToastCtx = createContext<Ctx | null>(null)

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Omit<Toast, 'id'> & { timeoutMs?: number }) => {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, title: t.title, description: t.description, variant: t.variant }
    setToasts(prev => [...prev, toast])
    const timeout = t.timeoutMs ?? 4000
    window.setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), timeout)
  }, [])

  const value = useMemo(() => ({ addToast }), [addToast])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={
            'w-72 rounded border bg-white p-3 shadow-lg text-sm ' +
            (t.variant === 'success' ? 'border-green-300' : t.variant === 'error' ? 'border-red-300' : 'border-gray-300')
          }>
            {t.title && <div className="font-medium mb-1">{t.title}</div>}
            {t.description && <div className="text-gray-700">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

