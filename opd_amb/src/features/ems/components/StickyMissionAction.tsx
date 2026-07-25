import React from 'react'
import { Loader2, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react'

interface StickyMissionActionProps {
  label: string
  onClick: () => void
  onBack?: () => void
  backLabel?: string
  disabled?: boolean
  disabledReason?: string
  loading?: boolean
  variant?: 'primary' | 'emerald' | 'amber' | 'destructive'
  secondaryAction?: React.ReactNode
}

export const StickyMissionAction: React.FC<StickyMissionActionProps> = ({
  label,
  onClick,
  onBack,
  backLabel = 'Back',
  disabled = false,
  disabledReason,
  loading = false,
  variant = 'emerald',
  secondaryAction,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10 active:scale-[0.98]'
      case 'amber':
        return 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md shadow-amber-900/10 active:scale-[0.98]'
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-900/10 active:scale-[0.98]'
      default:
        return 'bg-primary hover:bg-primary/90 text-on-primary shadow-md active:scale-[0.98]'
    }
  }

  return (
    <div className="sticky bottom-[68px] left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur-md border-t border-outline-variant/60 shadow-lg space-y-2.5">
      {disabled && disabledReason && (
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/30 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="truncate">{disabledReason}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="h-14 px-4 bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-high rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{backLabel}</span>
          </button>
        )}

        {secondaryAction}

        <button
          type="button"
          onClick={onClick}
          disabled={disabled || loading}
          className={`flex-1 h-14 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${getVariantStyles()}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>{label}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
