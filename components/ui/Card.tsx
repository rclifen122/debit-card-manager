'use client'

import clsx from 'clsx'
import React from 'react'

type Props = React.HTMLAttributes<HTMLDivElement>

export default function Card({ className, ...props }: Props) {
  return <div className={clsx('rounded-lg border bg-white', className)} {...props} />
}

