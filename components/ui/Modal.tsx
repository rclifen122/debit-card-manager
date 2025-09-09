'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ open, title, onClose, children }: Props) {
  const [mounted, setMounted] = React.useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative z-10 w-[90vw] max-w-md rounded-lg border bg-white p-4 shadow-lg">
        {title && <h3 className="text-base font-semibold mb-2">{title}</h3>}
        {children}
      </div>
    </div>,
    document.body
  )
}

