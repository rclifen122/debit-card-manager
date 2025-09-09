'use client'

import clsx from 'clsx'
import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

export default function Button({ variant = 'primary', className, ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded text-sm px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const styles: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-700/30',
    secondary: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-700/30',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent',
  }
  return <button className={clsx(base, styles[variant], className)} {...props} />
}

