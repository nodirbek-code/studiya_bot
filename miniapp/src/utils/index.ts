import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { uz } from 'date-fns/locale'

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m'
}

export function formatDate(iso: string): string {
  const d = parseISO(iso)
  if (isToday(d))    return 'Bugun, ' + format(d, 'HH:mm')
  if (isTomorrow(d)) return 'Ertaga, ' + format(d, 'HH:mm')
  return format(d, 'd MMMM, HH:mm', { locale: uz })
}

export function formatDateShort(date: Date): string {
  return format(date, 'd MMMM', { locale: uz })
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm')
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: '⏳ To\'lov kutilmoqda',
  confirmed:       '✅ Tasdiqlangan',
  cancelled:       '❌ Bekor qilingan',
  completed:       '🏁 Bajarildi',
  no_show:         '🚫 Kelmadi',
}

export const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'text-status-warning',
  confirmed:       'text-status-success',
  cancelled:       'text-status-error',
  completed:       'text-text-secondary',
  no_show:         'text-text-muted',
}
