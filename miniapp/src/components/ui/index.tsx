import React from 'react'
import { clsx } from '@/utils'

// в”Ђв”Ђ Skeleton в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />
}

// в”Ђв”Ђ Card в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Card({
  children, className, onClick, style,
}: { children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={clsx(
        'bg-bg-secondary border border-white/5 rounded-card',
        onClick && 'active:scale-[0.98] transition-transform cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

// в”Ђв”Ђ Badge в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Badge({
  children, variant = 'default', className,
}: {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'success' | 'error' | 'warning'
  className?: string
}) {
  const variants = {
    default: 'bg-bg-tertiary text-text-secondary',
    accent:  'bg-accent-muted text-accent border border-accent/30',
    success: 'bg-status-success/10 text-status-success',
    error:   'bg-status-error/10 text-status-error',
    warning: 'bg-status-warning/10 text-status-warning',
  }
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-chip text-[11px] font-medium',
      variants[variant],
      className,
    )}>
      {children}
    </span>
  )
}

// в”Ђв”Ђ Button в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Button({
  children, onClick, variant = 'primary', disabled, loading, className, fullWidth,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  loading?: boolean
  className?: string
  fullWidth?: boolean
}) {
  const variants = {
    primary:   'bg-accent text-bg-primary font-semibold active:opacity-85',
    secondary: 'bg-bg-tertiary text-text-primary border border-white/10 active:bg-bg-hover',
    ghost:     'text-accent active:opacity-70',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'h-12 px-5 rounded-btn text-sm transition-all flex items-center justify-center gap-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  )
}

// в”Ђв”Ђ Spinner в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <svg className={clsx('animate-spin text-accent', s[size])} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// в”Ђв”Ђ Stars в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Stars({
  rating, max = 5, interactive, onChange,
}: {
  rating: number; max?: number; interactive?: boolean; onChange?: (r: number) => void
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <span
          key={star}
          onClick={() => interactive && onChange?.(star)}
          className={clsx(
            'text-xl transition-colors',
            star <= rating ? 'text-accent' : 'text-text-muted',
            interactive && 'cursor-pointer active:scale-110',
          )}
        >в…</span>
      ))}
    </div>
  )
}

// в”Ђв”Ђ Section header в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function SectionHeader({
  title, action, onAction,
}: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-2">
      <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-[12px] text-accent">
          {action}
        </button>
      )}
    </div>
  )
}

// в”Ђв”Ђ Empty state в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function EmptyState({ icon, title, subtitle }: {
  icon: string; title: string; subtitle?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-5xl">{icon}</span>
      <p className="text-text-primary font-medium">{title}</p>
      {subtitle && <p className="text-text-secondary text-sm text-center px-8">{subtitle}</p>}
    </div>
  )
}

// в”Ђв”Ђ Divider в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Divider({ className }: { className?: string }) {
  return <div className={clsx('h-px bg-white/5', className)} />
}


