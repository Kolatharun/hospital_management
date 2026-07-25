import React, { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox className="w-10 h-10 text-slate-500" />,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#141C2B] rounded-2xl border border-slate-800/80 my-4">
      <div className="p-3 bg-slate-800/60 rounded-full mb-3">{icon}</div>
      <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
      <p className="text-slate-400 text-xs max-w-xs mb-4">{description}</p>
      {action}
    </div>
  )
}
