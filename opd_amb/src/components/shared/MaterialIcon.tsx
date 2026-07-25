import React from 'react'
import { cn } from '@/lib/cn'

interface MaterialIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string
  filled?: boolean
  size?: number
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({ name, filled = false, size, className, style, ...rest }) => {
  return (
    <span
      className={cn('material-symbols-outlined', filled && 'filled', className)}
      style={{ fontSize: size ? `${size}px` : undefined, ...style }}
      {...rest}
    >
      {name}
    </span>
  )
}
