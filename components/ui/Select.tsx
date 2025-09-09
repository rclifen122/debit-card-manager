'use client'

import clsx from 'clsx'
import React from 'react'

type Props = React.SelectHTMLAttributes<HTMLSelectElement>

export default function Select({ className, children, ...props }: Props) {
  return (
    <select
      className={clsx('w-full rounded border border-gray-300 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500', className)}
      {...props}
    >
      {children}
    </select>
  )
}

