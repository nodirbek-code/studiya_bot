import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { uz } from 'date-fns/locale'
import { bookingsApi, paymentsApi } from '@/api/endpoints'
import { useBookingStore } from '@/store/bookingStore'
import { Spinner, Divider } from '@/components/ui'
import { formatPrice, formatDateShort } from '@/utils'
import { useTelegram } from '@/hooks/useTelegram'

export function BookingSummary() {
  const { draft, reset } = useBookingStore()
  const { haptic, openLink, tg } = useTelegram()

  const [bookingId, setBookingId]       = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl]     = useState<string | null>(null)
  const [provider, setProvider]         = useState<'payme' | 'click'>('payme')
  const [countdown, setCountdown]       = useState(600) // 10 daqiqa
  const [timerActive, setTimerActive]   = useState(false)
  const [done, setDone]                 = useState(false)

  // ── Countdown timer ─────────────────────────────────────────
  useEffect(() => {
    if (!timerActive || countdown <= 0) return
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(t)
          setTimerActive(false)
          tg?.showAlert('To\'lov vaqti tugadi. Bron bekor qilindi.')
          reset()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [timerActive, countdown, tg, reset])

  const timerColor = countdown < 120
    ? 'text-status-error'
    : countdown < 300
    ? 'text-status-warning'
    : 'text-accent'

  const timerStr = `${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`

  // ── Create booking mutation ─────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => bookingsApi.create({
      staff_id:      draft.staff?.id,
      service_id:    draft.service?.id,
      package_id:    draft.pkg?.id,
      start_time:    draft.timeSlot!.time,
      duration_hours:draft.durationH,
    }),
    onSuccess: async (booking) => {
      haptic('success')
      setBookingId(booking.id)
      // To'lov URL olish
      const payment = await paymentsApi.init(booking.id, provider)
      setPaymentUrl(payment.payment_url)
      setTimerActive(true)
    },
    onError: (err: Error) => {
      haptic('error')
      tg?.showAlert(err.message)
    },
  })

  const totalPrice = draft.pkg
    ? draft.pkg.final_price
    : (draft.service?.price_per_hour ?? 0) * draft.durationH
  const deposit = totalPrice * 0.3

  // ── If booking done waiting payment ─────────────────────────
  if (bookingId && paymentUrl) {
    return (
      <div className="px-4 flex flex-col gap-4">
        {/* Timer */}
        <div className="bg-bg-secondary rounded-card p-4 text-center">
          <div className="text-[12px] text-text-secondary mb-1">To'lov uchun vaqt</div>
          <div className={`text-[40px] font-bold font-mono ${timerColor}`}>{timerStr}</div>
          <div className="text-[11px] text-text-muted mt-1">
            Vaqt tugasa bron avtomatik bekor qilinadi
          </div>
        </div>

        {/* Payment buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => openLink(paymentUrl)}
            className="w-full h-12 bg-accent text-bg-primary font-semibold rounded-btn
                       flex items-center justify-center gap-2 active:opacity-85"
          >
            💳 {provider === 'payme' ? 'Payme' : 'Click'} orqali to'lash
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setProvider('payme')}
              className={`flex-1 h-10 rounded-btn text-[13px] border transition-all
                ${provider === 'payme'
                  ? 'bg-accent-muted border-accent text-accent'
                  : 'bg-bg-secondary border-white/5 text-text-secondary'}`}
            >
              Payme
            </button>
            <button
              onClick={() => setProvider('click')}
              className={`flex-1 h-10 rounded-btn text-[13px] border transition-all
                ${provider === 'click'
                  ? 'bg-accent-muted border-accent text-accent'
                  : 'bg-bg-secondary border-white/5 text-text-secondary'}`}
            >
              Click
            </button>
          </div>
        </div>

        <p className="text-[11px] text-text-muted text-center">
          To'lovdan keyin bot orqali tasdiqlash xabari keladi
        </p>
      </div>
    )
  }

  return (
    <div className="px-4">
      <p className="text-[13px] text-text-secondary mb-4">
        Ma'lumotlarni tekshiring va bronni tasdiqlang
      </p>

      {/* Summary card */}
      <div className="bg-bg-secondary rounded-card p-4 mb-4 flex flex-col gap-3">
        <Row label="Xodim" value={draft.staff?.name ?? 'Istalgan'} />
        <Divider />
        <Row
          label="Sana"
          value={draft.date ? formatDateShort(draft.date) : '—'}
        />
        <Row
          label="Vaqt"
          value={draft.timeSlot ? format(new Date(draft.timeSlot.time), 'HH:mm') : '—'}
        />
        <Divider />
        <Row
          label="Xizmat"
          value={draft.pkg?.name ?? draft.service?.name ?? '—'}
        />
        {draft.service && (
          <Row label="Davomiylik" value={`${draft.durationH} soat`} />
        )}
        <Divider />
        <Row
          label="Jami narx"
          value={formatPrice(totalPrice)}
          valueClass="text-text-primary font-semibold"
        />
        <Row
          label="Oldindan to'lov (30%)"
          value={formatPrice(deposit)}
          valueClass="text-accent font-bold text-[15px]"
        />
      </div>

      {/* Provider choice */}
      <div className="mb-4">
        <p className="text-[12px] text-text-secondary mb-2">To'lov tizimi</p>
        <div className="flex gap-2">
          {(['payme', 'click'] as const).map(p => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`flex-1 h-10 rounded-btn text-[13px] font-medium border transition-all
                ${provider === p
                  ? 'bg-accent-muted border-accent text-accent'
                  : 'bg-bg-secondary border-white/5 text-text-secondary'}`}
            >
              {p === 'payme' ? '💳 Payme' : '💳 Click'}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending}
        className="w-full h-12 bg-accent text-bg-primary font-bold rounded-btn
                   disabled:opacity-50 active:opacity-85 transition-opacity
                   flex items-center justify-center gap-2"
      >
        {createMutation.isPending
          ? <><Spinner size="sm" /> Bron qilinmoqda...</>
          : '✅ Bron qilish'}
      </button>

      <p className="text-[11px] text-text-muted text-center mt-3">
        Bron qilgandan so'ng 10 daqiqa ichida to'lov qilishingiz kerak
      </p>
    </div>
  )
}

function Row({
  label, value, valueClass,
}: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className={`text-[13px] text-text-primary ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}
