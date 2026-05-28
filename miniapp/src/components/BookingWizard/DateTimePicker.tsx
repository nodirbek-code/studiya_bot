import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isBefore, isToday, isSameDay,
} from 'date-fns'
import { uz } from 'date-fns/locale'
import { bookingsApi } from '@/api/endpoints'
import { useBookingStore } from '@/store/bookingStore'
import { Skeleton } from '@/components/ui'
import { clsx, formatTime } from '@/utils'
import { useTelegram } from '@/hooks/useTelegram'

export function DateTimePicker() {
  const { draft, setDate, setSlot, setStep } = useBookingStore()
  const { haptic } = useTelegram()
  const [viewMonth, setViewMonth] = useState(new Date())

  // Tanlangan sana uchun slotlar
  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', draft.date?.toISOString(), draft.staff?.id],
    queryFn: () => bookingsApi.getSlots(
      format(draft.date!, 'yyyy-MM-dd'),
      draft.staff?.id,
    ),
    enabled: !!draft.date,
  })

  const handleDayClick = (day: Date) => {
    haptic('light')
    setDate(day)
    setSlot(null)
  }

  const handleSlotClick = (slot: { time: string; available: boolean }) => {
    if (!slot.available) return
    haptic('light')
    setSlot(slot)
  }

  const handleNext = () => {
    if (!draft.date || !draft.timeSlot) return
    haptic('medium')
    setStep(3)
  }

  // Kalendar kunlari
  const monthStart = startOfMonth(viewMonth)
  const monthEnd   = endOfMonth(viewMonth)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad   = (getDay(monthStart) + 6) % 7  // Dushanba = 0

  const DAY_LABELS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

  return (
    <div className="px-4">

      {/* ── Calendar ──────────────────────────────────────────── */}
      <div className="bg-bg-secondary rounded-card p-3 mb-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setViewMonth(m => subMonths(m, 1))}
            className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center
                       text-text-secondary active:bg-bg-hover"
          >‹</button>
          <span className="text-[14px] font-semibold capitalize">
            {format(viewMonth, 'LLLL yyyy', { locale: uz })}
          </span>
          <button
            onClick={() => setViewMonth(m => addMonths(m, 1))}
            className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center
                       text-text-secondary active:bg-bg-hover"
          >›</button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-[10px] text-text-muted py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Padding */}
          {Array(startPad).fill(0).map((_, i) => <div key={`p${i}`} />)}

          {days.map(day => {
            const past     = isBefore(day, new Date()) && !isToday(day)
            const selected = draft.date && isSameDay(day, draft.date)
            const today    = isToday(day)

            return (
              <button
                key={day.toISOString()}
                onClick={() => !past && handleDayClick(day)}
                disabled={past}
                className={clsx(
                  'h-9 rounded-lg text-[13px] transition-all flex items-center justify-center',
                  past    && 'opacity-20 cursor-not-allowed',
                  selected && 'bg-accent text-bg-primary font-bold',
                  today && !selected && 'text-accent font-semibold',
                  !past && !selected && 'active:bg-bg-hover',
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Time slots ────────────────────────────────────────── */}
      {draft.date && (
        <div className="mb-4">
          <p className="text-[13px] text-text-secondary mb-2">
            {format(draft.date, 'd MMMM', { locale: uz })} uchun soatlar:
          </p>

          {slotsLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-6 text-text-muted text-[13px]">
              😴 Bu kun dam olish kuni
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map(slot => {
                const selected = draft.timeSlot?.time === slot.time
                return (
                  <button
                    key={slot.time}
                    onClick={() => handleSlotClick(slot)}
                    disabled={!slot.available}
                    className={clsx(
                      'h-10 rounded-lg text-[12px] font-medium transition-all border',
                      slot.available
                        ? selected
                          ? 'bg-accent-muted border-accent text-accent font-semibold'
                          : 'bg-bg-secondary border-white/5 text-text-secondary active:bg-bg-tertiary'
                        : 'bg-bg-tertiary border-white/5 text-text-muted line-through cursor-not-allowed',
                    )}
                  >
                    {formatTime(slot.time)}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={!draft.date || !draft.timeSlot}
        className="w-full h-12 bg-accent text-bg-primary font-semibold rounded-btn
                   disabled:opacity-40 active:opacity-85 transition-opacity"
      >
        Davom etish →
      </button>
    </div>
  )
}
