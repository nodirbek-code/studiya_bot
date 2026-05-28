import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsApi, reviewsApi } from '@/api/endpoints'
import { useTelegram } from '@/hooks/useTelegram'
import {
  Card, Skeleton, Stars, Badge, EmptyState, Spinner,
} from '@/components/ui'
import { formatPrice, STATUS_LABELS, STATUS_COLORS, formatDate } from '@/utils'
import type { Booking } from '@/types'

export default function ProfilePage() {
  const { user, haptic, tg } = useTelegram()
  const qc = useQueryClient()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingsApi.getMyBookings,
  })

  const completedWithoutReview = bookings.filter(
    b => b.status === 'completed'
  )

  // Loyalty: tasdiqlangan bronlar
  const confirmedCount = bookings.filter(
    b => b.status === 'confirmed' || b.status === 'completed'
  ).length
  const loyaltyTarget = 5
  const loyaltyPct    = Math.min((confirmedCount % loyaltyTarget) / loyaltyTarget * 100, 100)

  return (
    <div className="pb-24 page-enter">

      {/* ── User header ──────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-2 text-center">
        <div className="w-16 h-16 rounded-full bg-bg-secondary border border-accent/20
                        flex items-center justify-center text-3xl mx-auto mb-3">
          {user?.first_name?.[0]?.toUpperCase() ?? '👤'}
        </div>
        <h2 className="text-[17px] font-semibold">
          {user ? `${user.first_name} ${user.last_name ?? ''}`.trim() : 'Mehmon'}
        </h2>
        {user?.username && (
          <p className="text-[13px] text-text-secondary mt-0.5">@{user.username}</p>
        )}
      </div>

      {/* ── Loyalty card ─────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <Card className="p-4" style={{
          background: 'linear-gradient(135deg,#1a1200,#2a1e08)',
          borderColor: '#3d3020',
        }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
              <span className="text-[13px] font-semibold text-accent">Sadoqat bonusi</span>
            </div>
            <span className="text-[12px] text-text-secondary">
              {confirmedCount % loyaltyTarget} / {loyaltyTarget}
            </span>
          </div>
          <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${loyaltyPct}%` }}
            />
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            {loyaltyTarget - (confirmedCount % loyaltyTarget)} ta brondan keyin —
            bepul 1 soat foto sessiya!
          </p>
        </Card>
      </div>

      {/* ── Stats row ────────────────────────────────────────── */}
      <div className="px-4 grid grid-cols-3 gap-2 mb-4">
        {[
          { val: bookings.length,                              label: 'Jami bron' },
          { val: bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length, label: 'Bajarildi' },
          { val: formatPrice(
              bookings.reduce((s, b) =>
                b.status === 'confirmed' || b.status === 'completed' ? s + b.deposit_amount : s, 0)
            ).replace(' so\'m', ''),
            label: "To'landi" },
        ].map(({ val, label }) => (
          <Card key={label} className="p-3 text-center">
            <div className="text-[16px] font-bold text-accent">{val}</div>
            <div className="text-[10px] text-text-muted mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* ── Pending review ───────────────────────────────────── */}
      {completedWithoutReview.slice(0, 1).map(b => (
        <ReviewPrompt key={b.id} booking={b} onSuccess={() => qc.invalidateQueries({ queryKey: ['my-bookings'] })} />
      ))}

      {/* ── Bookings list ────────────────────────────────────── */}
      <div className="px-4">
        <h3 className="text-[14px] font-semibold mb-3">Bronlar tarixi</h3>
        {isLoading
          ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-card mb-2" />)
          : bookings.length === 0
          ? <EmptyState icon="📅" title="Bronlar yo'q" subtitle="Birinchi broningizni qiling!" />
          : bookings.map(b => <BookingCard key={b.id} booking={b} />)
        }
      </div>
    </div>
  )
}

// ── Booking card ──────────────────────────────────────────────
function BookingCard({ booking: b }: { booking: Booking }) {
  return (
    <Card className="p-3 mb-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">
            {formatDate(b.start_time)}
          </div>
          <div className="text-[12px] text-text-secondary mt-0.5">
            {b.duration_hours}h · {formatPrice(b.total_price)}
          </div>
        </div>
        <Badge
          variant={
            b.status === 'confirmed'       ? 'success'
            : b.status === 'cancelled'     ? 'error'
            : b.status === 'pending_payment'? 'warning'
            : 'default'
          }
          className="ml-2 flex-shrink-0"
        >
          {STATUS_LABELS[b.status] ?? b.status}
        </Badge>
      </div>
    </Card>
  )
}

// ── Review prompt ─────────────────────────────────────────────
function ReviewPrompt({
  booking, onSuccess,
}: { booking: Booking; onSuccess: () => void }) {
  const [rating, setRating] = useState(0)
  const [text, setText]     = useState('')
  const { haptic, tg }      = useTelegram()

  const mutation = useMutation({
    mutationFn: () => reviewsApi.create({
      booking_id: booking.id,
      rating,
      text: text.trim() || undefined,
    }),
    onSuccess: () => {
      haptic('success')
      tg?.showAlert('Sharhingiz qabul qilindi! Admin tasdiqlashidan so\'ng ko\'rinadi.')
      onSuccess()
    },
    onError: (e: Error) => tg?.showAlert(e.message),
  })

  return (
    <div className="px-4 mb-4">
      <Card className="p-4">
        <div className="text-[13px] font-semibold mb-1">Sessiyani baholang ⭐</div>
        <div className="text-[11px] text-text-secondary mb-3">
          {formatDate(booking.start_time)}
        </div>
        <Stars rating={rating} interactive onChange={r => { haptic('light'); setRating(r) }} />
        {rating > 0 && (
          <>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Fikr-mulohazangizni yozing... (ixtiyoriy)"
              rows={3}
              className="w-full mt-3 bg-bg-tertiary border border-white/5 rounded-lg
                         p-3 text-[13px] text-text-primary placeholder:text-text-muted
                         resize-none outline-none focus:border-accent/50 transition-colors"
            />
            <button
              onClick={() => rating > 0 && mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full h-10 bg-accent text-bg-primary font-semibold rounded-btn
                         mt-2 text-[13px] disabled:opacity-50 flex items-center
                         justify-center gap-2 active:opacity-85"
            >
              {mutation.isPending ? <Spinner size="sm" /> : 'Sharh yuborish'}
            </button>
          </>
        )}
      </Card>
    </div>
  )
}
