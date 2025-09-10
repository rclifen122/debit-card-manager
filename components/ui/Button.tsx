import clsx from 'clsx'
import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({ variant = 'primary', size = 'md', className, ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const styles: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent',
    secondary: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-transparent',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent',
  }

  const sizes: Record<string, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return <button className={clsx(base, styles[variant], sizes[size], className)} {...props} />
}

